import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { archived } = body as { archived: boolean };

    // Verify the report exists (any authenticated user can access all reports)
    const report = await prisma.report.findFirst({
      where: { id: params.id },
    });

    if (!report) {
      return new Response('Report not found', { status: 404 });
    }

    // Update the archived status
    const updatedReport = await prisma.report.update({
      where: { id: params.id },
      data: { archived },
      select: { id: true, name: true, archived: true },
    });

    return Response.json(updatedReport);
  } catch (error) {
    console.error('Error updating report archive status:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
