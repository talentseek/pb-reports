import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/db';
import { hybridEnrichmentService } from '@/lib/hybridEnrichmentService';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaignId } = await request.json();

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    // Check if required services are properly configured
    if (!process.env.OUTSCRAPER_API_KEY) {
      return NextResponse.json({ 
        error: 'Outscraper API key is not configured. Please check your environment variables.' 
      }, { status: 500 });
    }

    // Fetch the campaign with businesses
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        businesses: {
          include: {
            reportLocationPlace: {
              include: {
                place: true
              }
            }
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Update campaign status to enriching
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'ENRICHING' }
    });

    // Prepare businesses for enrichment (include all relevant data)
    const businessesToEnrich = campaign.businesses
      .filter(cb => cb.reportLocationPlace.place.website)
      .map(cb => ({
        id: cb.reportLocationPlace.place.id,
        website: cb.reportLocationPlace.place.website!,
        name: cb.reportLocationPlace.place.name,
        types: cb.reportLocationPlace.place.types,
        address: cb.reportLocationPlace.place.address,
        phone: cb.reportLocationPlace.place.phone
      }));

    if (businessesToEnrich.length === 0) {
      return NextResponse.json({ 
        error: 'No businesses with websites found for enrichment' 
      }, { status: 400 });
    }

    // Start hybrid enrichment process
    const enrichmentResults = await hybridEnrichmentService.enrichMultipleBusinesses(businessesToEnrich);

    // Update places with hybrid enrichment data
    const updatePromises = enrichmentResults.map(async (result) => {
      const updateData: any = {
        enrichmentStatus: (result.outscraperResults.success || result.googleSearchResults.length > 0) ? 'ENRICHED' : 'FAILED',
        enrichedAt: new Date()
      };

      if (result.outscraperResults.success || result.googleSearchResults.length > 0) {
        // Primary contact info from combined results
        if (result.combinedContacts.primaryEmail) updateData.email = result.combinedContacts.primaryEmail;
        if (result.combinedContacts.primaryPhone) updateData.phone = result.combinedContacts.primaryPhone;
        
        // Combined results with relevance scores
        if (result.combinedContacts.allEmails.length > 0) updateData.allEmails = result.combinedContacts.allEmails;
        if (result.combinedContacts.allPhones.length > 0) updateData.allPhones = result.combinedContacts.allPhones;
        if (result.combinedContacts.contactPeople.length > 0) updateData.contactPeople = result.combinedContacts.contactPeople;
        
        // Outscraper results
        if (result.outscraperResults.socialLinks) updateData.socialLinks = result.outscraperResults.socialLinks;
        if (result.outscraperResults.businessDetails) updateData.businessDetails = result.outscraperResults.businessDetails;
        if (result.outscraperResults.siteData) updateData.siteData = result.outscraperResults.siteData;
        
        // Note: businessProfile, enrichmentStrategy, and overallRelevanceScore 
        // are not stored in the database yet - they're only used for analysis
      }

      return prisma.place.update({
        where: { id: result.businessId },
        data: updateData
      });
    });

    await Promise.all(updatePromises);

    // Update campaign status
    const enrichedCount = enrichmentResults.filter(r => r.outscraperResults.success || r.googleSearchResults.length > 0).length;
    const campaignStatus = enrichedCount > 0 ? 'ENRICHED' : 'CREATED';

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: campaignStatus }
    });

    return NextResponse.json({
      success: true,
      enriched: enrichedCount,
      total: businessesToEnrich.length,
      campaignStatus
    });

  } catch (error) {
    console.error('Enrichment error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    // Fetch campaign status and enrichment progress
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        businesses: {
          include: {
            reportLocationPlace: {
              include: {
                place: true
              }
            }
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const enrichmentStats = campaign.businesses.reduce((stats, cb) => {
      const status = cb.reportLocationPlace.place.enrichmentStatus;
      stats[status] = (stats[status] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);

    return NextResponse.json({
      campaignStatus: campaign.status,
      enrichmentStats,
      totalBusinesses: campaign.businesses.length
    });

  } catch (error) {
    console.error('Error fetching enrichment status:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
