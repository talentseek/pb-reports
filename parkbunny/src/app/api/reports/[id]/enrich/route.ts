/**
 * Report Enrichment API
 * 
 * POST — Start enrichment for businesses in a report
 * GET  — Get enrichment status and results for a report
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db';
import { enrichBatch, savePipelineResult } from '@/lib/enrichment/pipeline';
import { getPrimaryType, isNonProspect } from '@/lib/enrichment/typePriority';

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
        const { types, placeIds } = body as {
            types?: string[];
            placeIds?: string[];
        };

        // Verify report exists and belongs to user
        const report = await prisma.report.findFirst({
            where: { id: reportId },
        });

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        // Get places for this report
        const reportLocationPlaces = await prisma.reportLocationPlace.findMany({
            where: { location: { reportId } },
            include: { place: true },
        });

        let places = reportLocationPlaces.map(rlp => rlp.place);

        // Filter by types if specified
        if (types && types.length > 0) {
            places = places.filter(p => {
                const primaryType = getPrimaryType(p.types);
                return types.includes(primaryType);
            });
        }

        // Filter by specific place IDs if specified
        if (placeIds && placeIds.length > 0) {
            places = places.filter(p => placeIds.includes(p.id));
        }

        // Filter out non-prospects
        places = places.filter(p => !isNonProspect(p.types));

        if (places.length === 0) {
            return NextResponse.json({
                error: 'No eligible businesses found for enrichment',
            }, { status: 400 });
        }

        // Check for already-enriched places (skip if resolved recently)
        const existingResults = await prisma.enrichmentResult.findMany({
            where: {
                placeId: { in: places.map(p => p.id) },
                reportId,
                status: 'resolved',
                lastEnrichedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
            },
            select: { placeId: true },
        });

        const alreadyResolved = new Set(existingResults.map(r => r.placeId));
        const placesToEnrich = places.filter(p => !alreadyResolved.has(p.id));

        if (placesToEnrich.length === 0) {
            return NextResponse.json({
                message: 'All businesses are already enriched',
                skipped: places.length,
            });
        }

        // Mark as in_progress
        await Promise.all(
            placesToEnrich.map(p =>
                prisma.enrichmentResult.upsert({
                    where: { placeId_reportId: { placeId: p.id, reportId } },
                    create: { placeId: p.id, reportId, status: 'in_progress' },
                    update: { status: 'in_progress' },
                }),
            ),
        );

        // Run the pipeline (non-blocking via streaming response pattern)
        const pipelineInput = placesToEnrich.map(p => ({
            id: p.id,
            name: p.name,
            types: p.types,
            website: p.website,
            address: p.address,
            phone: p.phone,
        }));

        // Start enrichment in background
        enrichBatch(pipelineInput, 3, async (completed, total, result) => {
            try {
                await savePipelineResult(result, reportId);
            } catch (err) {
                console.error(`Failed to save result for ${result.placeId}:`, err);
            }
        }).catch(err => {
            console.error('Pipeline batch error:', err);
        });

        return NextResponse.json({
            message: 'Enrichment started',
            total: placesToEnrich.length,
            skipped: alreadyResolved.size,
            reportId,
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

        // Get all enrichment results for this report
        const results = await prisma.enrichmentResult.findMany({
            where: { reportId },
            include: {
                place: {
                    select: {
                        id: true,
                        name: true,
                        types: true,
                        address: true,
                        website: true,
                        phone: true,
                        rating: true,
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        // Compute stats
        const stats = {
            total: results.length,
            resolved: results.filter(r => r.status === 'resolved').length,
            partial: results.filter(r => r.status === 'partial').length,
            failed: results.filter(r => r.status === 'failed').length,
            inProgress: results.filter(r => r.status === 'in_progress').length,
            pending: results.filter(r => r.status === 'pending').length,
            needsReview: results.filter(r => r.status === 'needs_review').length,
            skipped: results.filter(r => r.status === 'skipped').length,
        };

        const classificationStats = {
            independent: results.filter(r => r.chainClassification === 'independent').length,
            national_chain: results.filter(r => r.chainClassification === 'national_chain').length,
            local_group: results.filter(r => r.chainClassification === 'local_group').length,
        };

        return NextResponse.json({
            stats,
            classificationStats,
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
                emailVerified: r.emailVerified,
                emailVerificationResult: r.emailVerificationResult,
                overallConfidence: r.overallConfidence,
                dataSources: r.dataSources,
                companyName: r.companyName,
                companyType: r.companyType,
                companiesHouseNumber: r.companiesHouseNumber,
                lastEnrichedAt: r.lastEnrichedAt,
                failureReason: r.failureReason,
            })),
        });
    } catch (err: any) {
        console.error('Enrichment status error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
