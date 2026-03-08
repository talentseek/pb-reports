/**
 * Report Enrichment API — Sector-level enrichment
 * 
 * POST — Start enrichment for a specific sector's included businesses
 *   Body: { category: string, postcode?: string, dryRun?: boolean }
 *   dryRun=true returns preview (count, businesses list)
 *   dryRun=false/omitted runs enrichment with SSE progress stream
 * 
 * GET — Get enrichment results for a report
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db';
import { enrichBusiness, savePipelineResult, type PipelineResult } from '@/lib/enrichment/pipeline';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const reportId = params.id;
        const body = await request.json();
        const { category, postcode, dryRun } = body as {
            category: string;
            postcode?: string;
            dryRun?: boolean;
        };

        if (!category) {
            return NextResponse.json({ error: 'Missing category' }, { status: 400 });
        }

        // Verify report exists
        const report = await prisma.report.findFirst({
            where: { id: reportId },
            select: { id: true },
        });
        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        // Get locations for this report (optionally filtered by postcode)
        const locations = await prisma.reportLocation.findMany({
            where: { reportId, ...(postcode ? { postcode } : {}) },
            select: { id: true },
        });
        if (locations.length === 0) {
            return NextResponse.json({ error: 'No locations found' }, { status: 404 });
        }
        const locationIds = locations.map(l => l.id);

        // Get included businesses for this category
        const links = await prisma.reportLocationPlace.findMany({
            where: {
                locationId: { in: locationIds },
                groupedCategory: category,
                included: true,
            },
            include: {
                place: {
                    include: {
                        enrichmentResults: {
                            where: { reportId },
                            take: 1,
                        },
                    },
                },
            },
        });

        // Separate already-enriched from pending
        const businesses = links.map(link => {
            const enrichment = link.place.enrichmentResults[0];
            const isEnriched = enrichment && ['resolved', 'partial'].includes(enrichment.status);
            return {
                id: link.place.id,
                name: link.place.name,
                types: link.place.types,
                website: link.place.website,
                address: link.place.address,
                phone: link.place.phone,
                enriched: !!isEnriched,
                enrichmentStatus: enrichment?.status || null,
            };
        });

        const toEnrich = businesses.filter(b => !b.enriched);
        const alreadyEnriched = businesses.filter(b => b.enriched);

        // Dry run: return preview without enriching
        if (dryRun) {
            return NextResponse.json({
                toEnrich: toEnrich.length,
                alreadyEnriched: alreadyEnriched.length,
                total: businesses.length,
                businesses: businesses.map(b => ({
                    id: b.id,
                    name: b.name,
                    enriched: b.enriched,
                    status: b.enrichmentStatus,
                })),
            });
        }

        if (toEnrich.length === 0) {
            return NextResponse.json({
                message: 'All included businesses are already enriched',
                alreadyEnriched: alreadyEnriched.length,
            });
        }

        // SSE streaming response for real-time progress
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const send = (data: Record<string, any>) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                };

                send({ type: 'start', total: toEnrich.length, alreadyEnriched: alreadyEnriched.length });

                let resolved = 0, partial = 0, failed = 0;

                // Process sequentially (1 at a time for reliability + real-time updates)
                for (let i = 0; i < toEnrich.length; i++) {
                    const biz = toEnrich[i];
                    try {
                        const result = await enrichBusiness({
                            id: biz.id,
                            name: biz.name,
                            types: biz.types,
                            website: biz.website,
                            address: biz.address,
                            phone: biz.phone,
                        });

                        // Save to database
                        await savePipelineResult(result, reportId);

                        // Update counters
                        if (result.status === 'resolved') resolved++;
                        else if (result.status === 'partial') partial++;
                        else failed++;

                        // Stream progress
                        send({
                            type: 'progress',
                            current: i + 1,
                            total: toEnrich.length,
                            placeId: biz.id,
                            name: biz.name,
                            status: result.status,
                            ownerName: result.ownerName,
                            ownerEmail: result.ownerEmail,
                            ownerRole: result.ownerRole,
                            confidence: result.overallConfidence,
                            emailVerified: result.emailVerified,
                        });
                    } catch (err: any) {
                        failed++;
                        send({
                            type: 'progress',
                            current: i + 1,
                            total: toEnrich.length,
                            placeId: biz.id,
                            name: biz.name,
                            status: 'failed',
                            error: err.message,
                        });
                    }
                }

                send({ type: 'complete', resolved, partial, failed, total: toEnrich.length });
                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (err: any) {
        console.error('Enrichment API error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const reportId = params.id;
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        // Base query
        const whereClause: any = { reportId };

        // If category specified, filter to places in that category
        let placeIdFilter: string[] | undefined;
        if (category) {
            const locations = await prisma.reportLocation.findMany({
                where: { reportId },
                select: { id: true },
            });
            const links = await prisma.reportLocationPlace.findMany({
                where: {
                    locationId: { in: locations.map(l => l.id) },
                    groupedCategory: category,
                },
                select: { placeId: true },
            });
            placeIdFilter = links.map(l => l.placeId);
            whereClause.placeId = { in: placeIdFilter };
        }

        const results = await prisma.enrichmentResult.findMany({
            where: whereClause,
            include: {
                place: {
                    select: {
                        id: true,
                        name: true,
                        types: true,
                        address: true,
                        website: true,
                        phone: true,
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        const stats = {
            total: results.length,
            resolved: results.filter(r => r.status === 'resolved').length,
            partial: results.filter(r => r.status === 'partial').length,
            failed: results.filter(r => r.status === 'failed').length,
            inProgress: results.filter(r => r.status === 'in_progress').length,
        };

        return NextResponse.json({
            stats,
            results: results.map(r => ({
                id: r.id,
                placeId: r.placeId,
                place: r.place,
                status: r.status,
                chainClassification: r.chainClassification,
                chainName: r.chainName,
                ownerName: r.ownerName,
                ownerRole: r.ownerRole,
                ownerEmail: r.ownerEmail,
                ownerPhone: r.ownerPhone,
                ownerLinkedIn: r.ownerLinkedIn,
                emailVerified: r.emailVerified,
                emailVerificationResult: r.emailVerificationResult,
                overallConfidence: r.overallConfidence,
                dataSources: r.dataSources,
                companyName: r.companyName,
                companiesHouseNumber: r.companiesHouseNumber,
                lastEnrichedAt: r.lastEnrichedAt,
            })),
        });
    } catch (err: any) {
        console.error('Enrichment GET error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
