import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') || ''
    const postcode = searchParams.get('postcode') || undefined
    if (!category) return new NextResponse('Missing category', { status: 400 })

    const report = await prisma.report.findFirst({
      where: { id: params.id, user: { clerkId: userId } },
      select: { id: true },
    })
    if (!report) return new NextResponse('Not found', { status: 404 })

    const locations = await prisma.reportLocation.findMany({
      where: { reportId: report.id, ...(postcode ? { postcode } : {}) },
      select: { id: true, postcode: true },
    })
    if (locations.length === 0) return NextResponse.json({ places: [] })

    const locationIds = locations.map((l) => l.id)
    const links = await prisma.reportLocationPlace.findMany({
      where: { locationId: { in: locationIds }, groupedCategory: category },
      include: { place: true, location: true },
      take: 200,
    })

    const places = links.map((link) => ({
      id: link.placeId,
      name: link.place.name,
      address: link.place.address || '',
      rating: link.place.rating,
      priceLevel: link.place.priceLevel,
      website: link.place.website,
      phone: link.place.phone,
      parkingOptions: link.place.parkingOptions,
      included: link.included,
      postcode: link.location.postcode,
    }))

    return NextResponse.json({ places })
  } catch (e: any) {
    console.error('placesByCategory GET error', e)
    return new NextResponse('Server error', { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })
    const body = await req.json().catch(() => null) as { placeId: string; locationId?: string; included: boolean }
    if (!body?.placeId) return new NextResponse('Missing placeId', { status: 400 })

    const report = await prisma.report.findFirst({
      where: { id: params.id, user: { clerkId: userId } },
      select: { id: true },
    })
    if (!report) return new NextResponse('Not found', { status: 404 })

    // find link by place and report's locations
    const locations = await prisma.reportLocation.findMany({ where: { reportId: report.id }, select: { id: true } })
    const link = await prisma.reportLocationPlace.findFirst({
      where: { placeId: body.placeId, locationId: { in: locations.map((l) => l.id) } },
      select: { id: true },
    })
    if (!link) return new NextResponse('Link not found', { status: 404 })

    await prisma.reportLocationPlace.update({ where: { id: link.id }, data: { included: !!body.included } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('placesByCategory PATCH error', e)
    return new NextResponse('Server error', { status: 500 })
  }
}


