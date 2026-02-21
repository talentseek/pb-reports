import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { processNextCalls } from '@/lib/voice-queue'
import { screenCampaign } from '@/lib/ctps-check'

export async function POST(request: NextRequest) {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { action, campaignId } = await request.json()
    if (!action || !campaignId) {
        return NextResponse.json({ error: 'Missing action or campaignId' }, { status: 400 })
    }

    const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { location: { select: { status: true } } },
    })

    if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    switch (action) {
        case 'start': {
            // Verify location is LIVE
            if (campaign.location?.status !== 'LIVE') {
                return NextResponse.json(
                    { error: 'Location is not LIVE — cannot start calling' },
                    { status: 400 },
                )
            }

            await prisma.campaign.update({
                where: { id: campaignId },
                data: { status: 'CALLING' },
            })

            const config = await prisma.voiceConfig.findFirst()
            const dispatched = await processNextCalls(campaignId, config?.maxConcurrent ?? 1)

            return NextResponse.json({ status: 'CALLING', dispatched })
        }

        case 'pause': {
            await prisma.campaign.update({
                where: { id: campaignId },
                data: { status: 'PAUSED' },
            })
            return NextResponse.json({ status: 'PAUSED' })
        }

        case 'resume': {
            if (campaign.location?.status !== 'LIVE') {
                return NextResponse.json(
                    { error: 'Location is no longer LIVE — cannot resume' },
                    { status: 400 },
                )
            }

            await prisma.campaign.update({
                where: { id: campaignId },
                data: { status: 'CALLING' },
            })

            const config = await prisma.voiceConfig.findFirst()
            const dispatched = await processNextCalls(campaignId, config?.maxConcurrent ?? 1)

            return NextResponse.json({ status: 'CALLING', dispatched })
        }

        case 'call-next': {
            // Debug mode: trigger exactly 1 call, skip calling window
            const dispatched = await processNextCalls(campaignId, 1, true)
            return NextResponse.json({ dispatched })
        }

        case 'screen': {
            const result = await screenCampaign(campaignId)
            return NextResponse.json(result)
        }

        default:
            return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
}
