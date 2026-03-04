import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/demos/[id] — get full demo by ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const demo = await prisma.appDemo.findUnique({ where: { id } })
    if (!demo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(demo)
}

// PUT /api/demos/[id] — update demo
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()

    const demo = await prisma.appDemo.update({
        where: { id },
        data: {
            slug: body.slug,
            password: body.password,
            operatorName: body.operatorName,
            operatorTagline: body.operatorTagline,
            operatorLogo: body.operatorLogo,
            operatorLogoAlt: body.operatorLogoAlt || null,
            operatorFont: body.operatorFont || 'Arial, sans-serif',
            brandStripLogo: body.brandStripLogo || null,
            brandStripAlt: body.brandStripAlt || null,
            brandStripBackground: body.brandStripBackground || null,
            colorPrimary: body.colorPrimary,
            colorSecondary: body.colorSecondary,
            colorAccent: body.colorAccent,
            colorBackground: body.colorBackground,
            colorText: body.colorText,
            colorCardBg: body.colorCardBg,
            colorCta: body.colorCta,
            locationName: body.locationName,
            locationAddress: body.locationAddress,
            locationPostcode: body.locationPostcode,
            locationPhone: body.locationPhone || '',
            locationCode: body.locationCode || '',
            locationCity: body.locationCity,
            totalSpaces: body.totalSpaces,
            hourlyRate: body.hourlyRate,
            lat: body.lat || null,
            lng: body.lng || null,
            deals: body.deals || [],
            partnerView: body.partnerView || {},
        },
    })

    return NextResponse.json(demo)
}

// DELETE /api/demos/[id] — delete demo
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await prisma.appDemo.delete({ where: { id } })

    return NextResponse.json({ ok: true })
}
