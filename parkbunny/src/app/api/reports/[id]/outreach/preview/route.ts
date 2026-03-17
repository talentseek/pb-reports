import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/db';
import { buildTemplateVars, generateSequence } from '@/lib/outreach/emailTemplates';

/**
 * GET /api/reports/[id]/outreach/preview?sector=X&discountLevel=Y
 * Returns rendered email previews for each approved lead.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: reportId } = await params;
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get('sector');
    const discountLevel = searchParams.get('discountLevel') || '15%';

    if (!sector) {
        return NextResponse.json({ error: 'sector is required' }, { status: 400 });
    }

    const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: { locations: true },
    });
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    const location = report.locations[0];
    if (!location) return NextResponse.json({ error: 'No locations' }, { status: 400 });

    // Find the campaign for this sector
    const campaign = await prisma.outreachCampaign.findFirst({
        where: { reportId, sector },
    });
    if (!campaign) {
        return NextResponse.json({ error: 'No campaign found for this sector' }, { status: 404 });
    }

    // Get approved leads with enrichment data
    const approvedLeads = await prisma.outreachLead.findMany({
        where: {
            campaignId: campaign.id,
            reviewStatus: { in: ['auto_approved', 'approved'] },
        },
        include: { enrichment: { include: { place: true } } },
    });

    // Render emails for each lead
    const previews = approvedLeads.map(lead => {
        const vars = buildTemplateVars(lead.enrichment, report, location, sector, discountLevel);
        const emails = generateSequence(vars);
        return {
            leadId: lead.id,
            email: lead.email,
            businessName: lead.enrichment.place.name,
            firstName: vars.firstName,
            confidence: lead.confidence,
            emails: emails.map((e, i) => ({
                step: i + 1,
                subject: e.subject,
                body: e.body,
            })),
        };
    });

    return NextResponse.json({ previews, total: previews.length });
}
