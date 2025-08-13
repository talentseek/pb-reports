import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })
  const report = await prisma.report.findFirst({ where: { id: params.id }, select: { id: true } })
  if (!report) return new NextResponse('Not found', { status: 404 })

  const locations = await prisma.reportLocation.findMany({ where: { reportId: report.id }, select: { id: true } })
  const links = await prisma.reportLocationPlace.findMany({
    where: { locationId: { in: locations.map((l) => l.id) } },
    select: { groupedCategory: true, included: true },
    take: 5000,
  })
  const total = new Map<string, number>()
  const included = new Map<string, number>()
  for (const l of links) {
    const cat = l.groupedCategory || 'Uncategorized'
    total.set(cat, (total.get(cat) || 0) + 1)
    if (l.included) included.set(cat, (included.get(cat) || 0) + 1)
  }
  const categories = Array.from(new Set<string>([...Array.from(total.keys()), ...Array.from(included.keys())]))
    .map((category) => ({ category, total: total.get(category) || 0, included: included.get(category) || 0 }))
    .sort((a, b) => b.included - a.included || b.total - a.total)
  return NextResponse.json({ categories })
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json().catch(() => null) as { category: string; included: boolean }
  if (!body?.category) return new NextResponse('Missing category', { status: 400 })
  const report = await prisma.report.findFirst({ where: { id: params.id }, select: { id: true } })
  if (!report) return new NextResponse('Not found', { status: 404 })
  const locations = await prisma.reportLocation.findMany({ where: { reportId: report.id }, select: { id: true } })
  await prisma.reportLocationPlace.updateMany({
    where: { locationId: { in: locations.map((l) => l.id) }, groupedCategory: body.category },
    data: { included: !!body.included },
  })
  return NextResponse.json({ ok: true })
}


