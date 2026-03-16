import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/db';
import {
    createLeadsBatch,
    type CreateLeadPayload,
} from '@/lib/outreach/instantlyClient';
import { buildTemplateVars } from '@/lib/outreach/emailTemplates';

/**
 * GET /api/reports/[id]/outreach/review?sector=...
 * Returns leads that need manual review (pending_review status).
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: reportId } = await params;
    const sector = request.nextUrl.searchParams.get('sector');

    const where: Record<string, unknown> = {
        campaign: { reportId },
        reviewStatus: 'pending_review',
    };
    if (sector) {
        where.campaign = { reportId, sector };
    }

    const leads = await prisma.outreachLead.findMany({
        where,
        include: {
            enrichment: {
                include: { place: true },
            },
            campaign: {
                select: { sector: true, discountLevel: true },
            },
        },
        orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ leads });
}

/**
 * PATCH /api/reports/[id]/outreach/review
 * Approve or reject leads in the review queue.
 * Optionally push approved leads to Instantly.
 *
 * Body: {
 *   decisions: Array<{ leadId: string, action: 'approved' | 'rejected' }>,
 *   pushToInstantly?: boolean
 * }
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: reportId } = await params;
    const body = await request.json();
    const { decisions, pushToInstantly = false } = body as {
        decisions: Array<{ leadId: string; action: 'approved' | 'rejected' }>;
        pushToInstantly?: boolean;
    };

    if (!decisions || !Array.isArray(decisions)) {
        return NextResponse.json({ error: 'decisions array required' }, { status: 400 });
    }

    // Update each lead's review status
    const approved: string[] = [];
    for (const d of decisions) {
        await prisma.outreachLead.update({
            where: { id: d.leadId },
            data: { reviewStatus: d.action },
        });
        if (d.action === 'approved') approved.push(d.leadId);
    }

    // Update campaign lead counts
    const campaigns = await prisma.outreachCampaign.findMany({
        where: { reportId },
    });
    for (const campaign of campaigns) {
        const counts = await prisma.outreachLead.groupBy({
            by: ['reviewStatus'],
            where: { campaignId: campaign.id },
            _count: true,
        });
        const approved = counts.find(c => c.reviewStatus === 'approved' || c.reviewStatus === 'auto_approved');
        const inReview = counts.find(c => c.reviewStatus === 'pending_review');
        const skipped = counts.find(c => c.reviewStatus === 'rejected' || c.reviewStatus === 'skipped');

        await prisma.outreachCampaign.update({
            where: { id: campaign.id },
            data: {
                leadsApproved: (approved?._count ?? 0),
                leadsInReview: (inReview?._count ?? 0),
                leadsSkipped: (skipped?._count ?? 0),
            },
        });
    }

    // Push newly approved leads to Instantly if requested
    let instantlyResult = null;
    if (pushToInstantly && approved.length > 0) {
        const approvedLeads = await prisma.outreachLead.findMany({
            where: { id: { in: approved } },
            include: {
                enrichment: { include: { place: true } },
                campaign: {
                    include: {
                        report: { include: { locations: true } },
                    },
                },
            },
        });

        // Group by campaign
        const byCampaign: Record<string, typeof approvedLeads> = {};
        for (const lead of approvedLeads) {
            if (!byCampaign[lead.campaignId]) byCampaign[lead.campaignId] = [];
            byCampaign[lead.campaignId].push(lead);
        }

        const results: Array<{ campaignId: string; pushed: number; failed: number }> = [];

        for (const campaignId of Object.keys(byCampaign)) {
            const campaignLeads = byCampaign[campaignId];
            const campaign = campaignLeads[0].campaign;
            if (!campaign.instantlyCampaignId) continue;

            const report = campaign.report;
            const location = report.locations[0];
            if (!location) continue;

            const leadsForInstantly: Omit<CreateLeadPayload, 'campaign'>[] = campaignLeads.map((l: typeof campaignLeads[0]) => {
                const vars = buildTemplateVars(
                    l.enrichment,
                    report,
                    location,
                    campaign.sector,
                    campaign.discountLevel ?? '15%',
                );
                return {
                    email: l.email,
                    first_name: vars.firstName ?? undefined,
                    last_name: l.enrichment.ownerName?.split(' ').slice(1).join(' ') || undefined,
                    company_name: l.businessName,
                    phone: l.enrichment.place.phone ?? undefined,
                    website: l.enrichment.place.website ?? undefined,
                    custom_variables: {
                        businessName: vars.businessName,
                        carParkName: vars.carParkName,
                        postcode: vars.postcode,
                        sectorNoun: vars.sectorNoun,
                        discountLevel: vars.discountLevel,
                    },
                    skip_if_in_workspace: true,
                    skip_if_in_campaign: true,
                };
            });

            const pushResult = await createLeadsBatch(
                campaign.instantlyCampaignId,
                leadsForInstantly,
            );

            for (const lead of pushResult.succeeded) {
                await prisma.outreachLead.updateMany({
                    where: { campaignId, email: lead.email },
                    data: { instantlyLeadId: lead.id },
                });
            }

            results.push({
                campaignId,
                pushed: pushResult.succeeded.length,
                failed: pushResult.failed.length,
            });
        }

        instantlyResult = results;
    }

    return NextResponse.json({
        updated: decisions.length,
        approved: approved.length,
        rejected: decisions.length - approved.length,
        instantly: instantlyResult,
    });
}
