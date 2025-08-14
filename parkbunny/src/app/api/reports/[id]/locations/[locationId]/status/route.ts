import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; locationId: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { status } = body as { status: 'PENDING' | 'LIVE' };

    // Verify the report exists (any authenticated user can access all reports)
    const report = await prisma.report.findFirst({
      where: { id: params.id },
    });

    if (!report) {
      return new Response('Report not found', { status: 404 });
    }

    // Verify the location exists and belongs to the report
    const location = await prisma.reportLocation.findFirst({
      where: { 
        id: params.locationId,
        reportId: params.id
      },
    });

    if (!location) {
      return new Response('Location not found', { status: 404 });
    }

    if (!location) {
      return new Response('Location not found', { status: 404 });
    }

    // Update the location status
    const updatedLocation = await prisma.reportLocation.update({
      where: { id: params.locationId },
      data: { status },
      select: { id: true, postcode: true, status: true },
    });

    return Response.json(updatedLocation);
  } catch (error) {
    console.error('Error updating location status:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
