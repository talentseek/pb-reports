import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'

export async function POST(req: Request, { params }: { params: { id: string; streamId: string } }) {
    const { userId } = await auth()
    if (!userId) return new Response('Unauthorized', { status: 401 })

    const body = await req.json()
    const { locationId } = body

    if (!locationId) return new Response('locationId required', { status: 400 })

    // Verify stream belongs to report
    const stream = await prisma.revenueStream.findFirst({
        where: { id: params.streamId, reportId: params.id },
    })
    if (!stream) return new Response('Stream not found', { status: 404 })

    // Verify location belongs to report
    const location = await prisma.reportLocation.findFirst({
        where: { id: locationId, reportId: params.id },
    })
    if (!location) return new Response('Location not found', { status: 404 })

    const exclusion = await prisma.revenueStreamExclusion.upsert({
        where: { revenueStreamId_locationId: { revenueStreamId: params.streamId, locationId } },
        create: { revenueStreamId: params.streamId, locationId },
        update: {},
    })

    return Response.json(exclusion)
}

export async function DELETE(req: Request, { params }: { params: { id: string; streamId: string } }) {
    const { userId } = await auth()
    if (!userId) return new Response('Unauthorized', { status: 401 })

    const body = await req.json()
    const { locationId } = body

    if (!locationId) return new Response('locationId required', { status: 400 })

    await prisma.revenueStreamExclusion.deleteMany({
        where: { revenueStreamId: params.streamId, locationId },
    })

    return Response.json({ ok: true })
}
