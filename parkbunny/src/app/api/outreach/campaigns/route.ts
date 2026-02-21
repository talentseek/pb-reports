import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { locationId, category, postcode, businessIds, carparkName } = await request.json();

    if (!locationId || !category || !postcode || !businessIds || !Array.isArray(businessIds)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Verify the location exists and is live
    const location = await prisma.reportLocation.findUnique({
      where: {
        id: locationId,
        status: 'LIVE'
      }
    });

    if (!location) {
      return NextResponse.json({ error: 'Location not found or not live' }, { status: 404 });
    }

    // Create campaign name
    const campaignName = `${category} - ${postcode}`;

    // Create the campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: campaignName,
        businessType: category,
        postcode: postcode,
        locationId: locationId,
        carparkName: carparkName || 'the car park',
        businesses: {
          create: businessIds.map((businessId: string) => ({
            reportLocationPlaceId: businessId
          }))
        }
      },
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

    return NextResponse.json({
      campaignId: campaign.id,
      campaign: campaign
    });

  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all campaigns
    const campaigns = await prisma.campaign.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(campaigns);

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
