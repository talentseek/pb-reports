import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import type { StreamType } from '@prisma/client'

const VALID_STREAM_TYPES: StreamType[] = ['LOCKER', 'CAR_WASH', 'EV_CHARGING', 'FARMERS_MARKET']

export async function GET(_req: Request, { params }: { params: { id: string } }) {
    const { userId } = await auth()
    if (!userId) return new Response('Unauthorized', { status: 401 })

    const report = await prisma.report.findFirst({ where: { id: params.id } })
    if (!report) return new Response('Not found', { status: 404 })

    const streams = await prisma.revenueStream.findMany({
        where: { reportId: params.id },
        include: { excludedLocations: true },
        orderBy: { createdAt: 'asc' },
    })

    return Response.json({ streams })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const { userId } = await auth()
    if (!userId) return new Response('Unauthorized', { status: 401 })

    const report = await prisma.report.findFirst({ where: { id: params.id } })
    if (!report) return new Response('Not found', { status: 404 })

    const body = await req.json()
    const { streamType, enabled, ratePerSite, rateMin, rateMax, notes } = body

    if (!streamType || !VALID_STREAM_TYPES.includes(streamType)) {
        return new Response('Invalid streamType', { status: 400 })
    }

    const stream = await prisma.revenueStream.upsert({
        where: { reportId_streamType: { reportId: params.id, streamType } },
        create: {
            reportId: params.id,
            streamType,
            enabled: enabled ?? true,
            ratePerSite: ratePerSite ?? null,
            rateMin: rateMin ?? null,
            rateMax: rateMax ?? null,
            notes: notes ?? null,
        },
        update: {
            enabled: enabled ?? undefined,
            ratePerSite: ratePerSite !== undefined ? ratePerSite : undefined,
            rateMin: rateMin !== undefined ? rateMin : undefined,
            rateMax: rateMax !== undefined ? rateMax : undefined,
            notes: notes !== undefined ? notes : undefined,
        },
        include: { excludedLocations: true },
    })

    return Response.json(stream)
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const { userId } = await auth()
    if (!userId) return new Response('Unauthorized', { status: 401 })

    const body = await req.json()
    const { streamType } = body

    if (!streamType || !VALID_STREAM_TYPES.includes(streamType)) {
        return new Response('Invalid streamType', { status: 400 })
    }

    await prisma.revenueStream.deleteMany({
        where: { reportId: params.id, streamType },
    })

    return Response.json({ ok: true })
}
