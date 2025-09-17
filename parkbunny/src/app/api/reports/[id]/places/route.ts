import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { refreshReportLocations } from '@/lib/placesFetch'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })
  try {
    const report = await prisma.report.findFirst({ where: { id: params.id } })
    if (!report) return new Response('Not found', { status: 404 })

    const postcodes = String(report.postcodes).split(',').map((s) => s.trim()).filter(Boolean)
    const settings = (report.settings ?? {}) as any
    const radiusMiles = typeof settings.radiusMiles === 'number' ? settings.radiusMiles : 0.75
    const maxPerType = typeof settings.placesMaxPerType === 'number' ? Math.max(1, Math.min(100, settings.placesMaxPerType)) : 10
    const body = await req.json().catch(() => ({} as any))
    const force = Boolean(body?.force)

    const result = await refreshReportLocations(report.id, postcodes, { radiusMiles, maxPerType, force, staleHours: 12 })
    if (!result.ok) return new Response('No API key configured', { status: 200 })
    return new Response(null, { status: 204 })
  } catch (e: any) {
    console.error('places refresh error', e)
    return new Response(e?.message || 'Internal Error', { status: 500 })
  }
}


