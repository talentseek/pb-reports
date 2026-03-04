import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/demos — list all demos
export async function GET() {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const demos = await prisma.appDemo.findMany({
        select: {
            id: true,
            slug: true,
            operatorName: true,
            operatorLogo: true,
            locationCity: true,
            locationPostcode: true,
            totalSpaces: true,
            password: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(demos)
}

// POST /api/demos — create a new demo
export async function POST(request: Request) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    // Auto-generate slug from operator name
    const slug = body.slug || body.operatorName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

    const demo = await prisma.appDemo.create({
        data: {
            slug,
            password: body.password || null,
            operatorName: body.operatorName,
            operatorTagline: body.operatorTagline || '',
            operatorLogo: body.operatorLogo || '',
            operatorLogoAlt: body.operatorLogoAlt || null,
            operatorFont: body.operatorFont || 'Arial, sans-serif',
            brandStripLogo: body.brandStripLogo || null,
            brandStripAlt: body.brandStripAlt || null,
            brandStripBackground: body.brandStripBackground || null,
            colorPrimary: body.colorPrimary || '#003399',
            colorSecondary: body.colorSecondary || '#001a4d',
            colorAccent: body.colorAccent || '#FFCC00',
            colorBackground: body.colorBackground || '#f0f4ff',
            colorText: body.colorText || '#0f172a',
            colorCardBg: body.colorCardBg || 'rgba(255,255,255,0.92)',
            colorCta: body.colorCta || '#FFCC00',
            locationName: body.locationName || '',
            locationAddress: body.locationAddress || '',
            locationPostcode: body.locationPostcode || '',
            locationPhone: body.locationPhone || '',
            locationCode: body.locationCode || '',
            locationCity: body.locationCity || '',
            totalSpaces: body.totalSpaces || 100,
            hourlyRate: body.hourlyRate || 2.5,
            lat: body.lat || null,
            lng: body.lng || null,
            deals: body.deals || [],
            partnerView: body.partnerView || {},
        },
    })

    return NextResponse.json(demo, { status: 201 })
}
