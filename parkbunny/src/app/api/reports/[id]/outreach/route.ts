import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/db';
import {
    createCampaign,
    createLeadsBatch,
    launchCampaign,
    listEmailAccounts,
    getDefaultSchedule,
    type CreateLeadPayload,
} from '@/lib/outreach/instantlyClient';
import { buildTemplateVars, buildInstantlySequence } from '@/lib/outreach/emailTemplates';

/**
 * POST /api/reports/[id]/outreach
 * Creates an Instantly campaign and pushes approved leads.
 *
 * Body: { sector: string, discountLevel: string, launch?: boolean }
 *
 * Flow:
 * 1. Query enriched businesses for this report + sector
 * 2. Split by confidence: high → auto-approve, medium → review, low/failed → skip
 * 3. Create OutreachCampaign + OutreachLead records
 * 4. If launch=true, create Instantly campaign + push auto-approved leads + activate
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: reportId } = await params;
    const body = await request.json();
    const { sector, discountLevel = '15%', launch = false } = body;

    if (!sector) {
        return NextResponse.json({ error: 'sector is required' }, { status: 400 });
    }

    // 1. Get the report and location
    const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: { locations: true },
    });
    if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    const location = report.locations[0]; // Primary location
    if (!location) {
        return NextResponse.json({ error: 'No locations in report' }, { status: 400 });
    }

    // 2. Find places in this sector via the report location link table
    const locationIds = report.locations.map(l => l.id);
    const sectorLinks = await prisma.reportLocationPlace.findMany({
        where: {
            locationId: { in: locationIds },
            groupedCategory: sector,
        },
        select: { placeId: true },
    });
    const sectorPlaceIds = sectorLinks.map(l => l.placeId);

    if (sectorPlaceIds.length === 0) {
        return NextResponse.json({
            error: 'No places found for this sector',
        }, { status: 400 });
    }

    // 3. Query enriched businesses with emails for these places
    const enrichments = await prisma.enrichmentResult.findMany({
        where: {
            reportId,
            placeId: { in: sectorPlaceIds },
            ownerEmail: { not: null },
        },
        include: {
            place: true,
        },
    });

    if (enrichments.length === 0) {
        return NextResponse.json({
            error: 'No enriched businesses with emails found for this sector',
        }, { status: 400 });
    }

    // 3. Classify leads by confidence
    const autoApproved: typeof enrichments = [];
    const needsReview: typeof enrichments = [];
    const skipped: typeof enrichments = [];

    for (const e of enrichments) {
        if (e.overallConfidence === 'high') {
            autoApproved.push(e);
        } else if (e.overallConfidence === 'medium') {
            needsReview.push(e);
        } else {
            skipped.push(e);
        }
    }

    // 4. Create or update OutreachCampaign
    const campaign = await prisma.outreachCampaign.upsert({
        where: {
            reportId_sector: { reportId, sector },
        },
        create: {
            reportId,
            sector,
            discountLevel,
            status: launch ? 'active' : 'review',
            leadsTotal: enrichments.length,
            leadsApproved: autoApproved.length,
            leadsInReview: needsReview.length,
            leadsSkipped: skipped.length,
        },
        update: {
            discountLevel,
            status: launch ? 'active' : 'review',
            leadsTotal: enrichments.length,
            leadsApproved: autoApproved.length,
            leadsInReview: needsReview.length,
            leadsSkipped: skipped.length,
        },
    });

    // 5. Create OutreachLead records
    const leadsToCreate = [
        ...autoApproved.map(e => ({
            campaignId: campaign.id,
            enrichmentId: e.id,
            email: e.ownerEmail!,
            firstName: e.ownerName?.split(' ')[0] ?? null,
            businessName: e.place.name,
            confidence: e.overallConfidence ?? 'low',
            reviewStatus: 'auto_approved',
        })),
        ...needsReview.map(e => ({
            campaignId: campaign.id,
            enrichmentId: e.id,
            email: e.ownerEmail!,
            firstName: e.ownerName?.split(' ')[0] ?? null,
            businessName: e.place.name,
            confidence: e.overallConfidence ?? 'low',
            reviewStatus: 'pending_review',
        })),
        ...skipped.map(e => ({
            campaignId: campaign.id,
            enrichmentId: e.id,
            email: e.ownerEmail!,
            firstName: e.ownerName?.split(' ')[0] ?? null,
            businessName: e.place.name,
            confidence: e.overallConfidence ?? 'low',
            reviewStatus: 'skipped',
        })),
    ];

    // Only create leads if the campaign doesn't already have them
    const existingLeadCount = await prisma.outreachLead.count({ where: { campaignId: campaign.id } });

    if (existingLeadCount === 0) {
        await prisma.outreachLead.createMany({ data: leadsToCreate });
    }

    // 6. If launch=true, push approved leads to Instantly
    let instantlyResult = null;

    // Get all leads that should be pushed (auto_approved + manually approved)
    const approvedLeads = await prisma.outreachLead.findMany({
        where: {
            campaignId: campaign.id,
            reviewStatus: { in: ['auto_approved', 'approved'] },
        },
        include: { enrichment: { include: { place: true } } },
    });

    if (launch && approvedLeads.length > 0) {
        try {
            // Get sending accounts
            const accounts = await listEmailAccounts();
            const emailList = accounts.items
                .filter(a => a.status === 1 || a.status === 'active' || a.status === '1')
                .map(a => a.email);

            if (emailList.length === 0) {
                return NextResponse.json({
                    error: 'No active email accounts in Instantly',
                    campaign,
                }, { status: 400 });
            }

            // Build the email sequence from the first lead (template is same for all)
            const firstLead = approvedLeads[0];
            const templateVars = buildTemplateVars(
                firstLead.enrichment,
                report,
                location,
                sector,
                discountLevel,
            );
            const sequence = buildInstantlySequence(templateVars);

            // Create Instantly campaign
            const instantlyCampaign = await createCampaign({
                name: `${report.name} — ${sector}`,
                campaign_schedule: getDefaultSchedule(),
                sequences: [sequence],
                email_list: emailList,
                text_only: true,
                stop_on_reply: true,
                daily_limit: 30,
                open_tracking: false,  // Plain text = no tracking pixel
                link_tracking: false,  // No links in emails
            });

            // Update campaign with Instantly ID
            await prisma.outreachCampaign.update({
                where: { id: campaign.id },
                data: { instantlyCampaignId: instantlyCampaign.id },
            });

            // Push all approved leads (auto + manually approved)
            const leadsForInstantly: Omit<CreateLeadPayload, 'campaign'>[] =
                approvedLeads.map(lead => {
                    const vars = buildTemplateVars(lead.enrichment, report, location, sector, discountLevel);
                    return {
                        email: lead.email,
                        first_name: vars.firstName ?? undefined,
                        last_name: lead.enrichment.ownerName?.split(' ').slice(1).join(' ') || undefined,
                        company_name: lead.enrichment.place.name,
                        phone: lead.enrichment.place.phone ?? undefined,
                        website: lead.enrichment.place.website ?? undefined,
                        custom_variables: {
                            businessName: vars.businessName,
                            carParkName: vars.carParkName,
                            postcode: vars.postcode,
                            sectorNoun: vars.sectorNoun,
                            sectorPain: vars.sectorPain,
                            discountLevel: vars.discountLevel,
                        },
                        skip_if_in_workspace: true,
                        skip_if_in_campaign: true,
                    };
                });

            const pushResult = await createLeadsBatch(instantlyCampaign.id, leadsForInstantly);

            // Update OutreachLead records with Instantly IDs
            for (const lead of pushResult.succeeded) {
                await prisma.outreachLead.updateMany({
                    where: { campaignId: campaign.id, email: lead.email },
                    data: { instantlyLeadId: lead.id },
                });
            }

            // Launch the campaign
            await launchCampaign(instantlyCampaign.id);

            await prisma.outreachCampaign.update({
                where: { id: campaign.id },
                data: { status: 'active' },
            });

            instantlyResult = {
                campaignId: instantlyCampaign.id,
                pushed: pushResult.succeeded.length,
                failed: pushResult.failed.length,
                failedEmails: pushResult.failed,
            };
        } catch (err) {
            console.error('[outreach] Instantly error:', err);
            return NextResponse.json({
                error: 'Failed to create Instantly campaign',
                details: err instanceof Error ? err.message : 'Unknown error',
                campaign,
            }, { status: 500 });
        }
    }

    return NextResponse.json({
        campaign,
        breakdown: {
            total: enrichments.length,
            autoApproved: autoApproved.length,
            needsReview: needsReview.length,
            skipped: skipped.length,
        },
        instantly: instantlyResult,
    });
}

/**
 * GET /api/reports/[id]/outreach
 * Returns outreach campaigns for this report with lead stats.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: reportId } = await params;

    const campaigns = await prisma.outreachCampaign.findMany({
        where: { reportId },
        include: {
            leads: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    businessName: true,
                    confidence: true,
                    reviewStatus: true,
                    sentAt: true,
                    repliedAt: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ campaigns });
}
