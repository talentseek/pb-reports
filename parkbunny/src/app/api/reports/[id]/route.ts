import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  // Fetch report by id only (any signed-in user can access)
  const report = await prisma.report.findFirst({
    where: { id: params.id },
    include: { businesses: true },
  })
  if (!report) return new Response('Not found', { status: 404 })
  return Response.json(report)
}
