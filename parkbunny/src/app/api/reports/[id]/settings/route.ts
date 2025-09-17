import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const body = await req.json()
  if (typeof body?.placesMaxPerType === 'number') {
    body.placesMaxPerType = Math.max(1, Math.min(100, Math.floor(body.placesMaxPerType)))
  }
  
  const report = await prisma.report.findFirst({ where: { id: params.id } })
  if (!report) return new Response('Not found', { status: 404 })

  // Handle report name update separately from settings
  const { name, ...settingsData } = body
  
  const updateData: any = {}
  
  // Update report name if provided
  if (typeof name === 'string' && name.trim().length > 0) {
    updateData.name = name.trim()
  }
  
  // Update settings if provided
  if (Object.keys(settingsData).length > 0) {
    const nextSettings = { ...(report.settings as object | null ?? {}), ...settingsData }
    updateData.settings = nextSettings
  }

  const updated = await prisma.report.update({
    where: { id: report.id },
    data: updateData,
  })
  return Response.json(updated)
}


