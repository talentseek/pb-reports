import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const body = await req.json()
  // Body is a partial settings object; merge into existing JSON
  const report = await prisma.report.findFirst({ where: { id: params.id } })
  if (!report) return new Response('Not found', { status: 404 })

  const nextSettings = { ...(report.settings as object | null ?? {}), ...body }

  const updated = await prisma.report.update({
    where: { id: report.id },
    data: { settings: nextSettings },
  })
  return Response.json(updated)
}


