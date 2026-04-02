import prisma from '@/lib/db'
import { processCallResult } from '@/lib/voice-agent'
import { scheduleRetry } from '@/lib/voice-queue'

/**
 * Vapi webhook endpoint — PUBLIC (no Clerk auth).
 * Vapi sends call events here server-to-server.
 */
export async function POST(req: Request) {
    // Verify webhook secret if configured
    const config = await prisma.voiceConfig.findFirst({ select: { webhookSecret: true } })
    if (config?.webhookSecret) {
        const secret = req.headers.get('x-vapi-secret')
        if (secret !== config.webhookSecret) {
            return new Response('Unauthorized', { status: 401 })
        }
    }

    const body = await req.json()
    const messageType = body?.message?.type

    try {
        if (messageType === 'end-of-call-report') {
            await handleEndOfCallReport(body.message)
        } else if (messageType === 'status-update') {
            await handleStatusUpdate(body.message)
        }
    } catch (err) {
        console.error('Vapi webhook processing error', err)
    }

    return new Response('OK', { status: 200 })
}

async function handleEndOfCallReport(message: any) {
    const metadata = message?.call?.metadata
    let cbId = metadata?.campaignBusinessId as string | undefined

    // Fallback: look up by vapiCallId if no metadata
    if (!cbId && message?.call?.id) {
        const found = await prisma.campaignBusiness.findFirst({
            where: { vapiCallId: message.call.id },
            select: { id: true },
        })
        if (found) cbId = found.id
    }

    if (!cbId) {
        console.warn('Vapi webhook: could not match call to CampaignBusiness', message?.call?.id)
        return
    }

    // Check if the CampaignBusiness exists
    const existing = await prisma.campaignBusiness.findUnique({ where: { id: cbId } })
    if (!existing) {
        console.warn('Vapi webhook: CampaignBusiness not found', cbId)
        return
    }

    const result = processCallResult(message)

    // Update campaign business with call results
    await prisma.campaignBusiness.update({
        where: { id: cbId },
        data: {
            callStatus: result.callStatus,
            callSummary: result.callSummary,
            transcript: result.transcript,
            recordingUrl: result.recordingUrl,
            callDuration: result.callDuration,
            extractedName: result.extractedName,
            extractedEmail: result.extractedEmail,
            extractedPhone: result.extractedPhone,
            callbackTime: result.callbackTime,
            endedReason: result.endedReason,
        },
    })

    // If we captured a decision-maker email, enrich the Place record
    if (result.extractedEmail && metadata.reportLocationPlaceId) {
        try {
            const rlp = await prisma.reportLocationPlace.findUnique({
                where: { id: metadata.reportLocationPlaceId },
                select: { placeId: true },
            })

            if (rlp) {
                const place = await prisma.place.findUnique({
                    where: { id: rlp.placeId },
                    select: { contactPeople: true },
                })

                const existingContacts = Array.isArray(place?.contactPeople) ? place.contactPeople : []
                const newContact = {
                    name: result.extractedName || 'Manager',
                    email: result.extractedEmail,
                    source: 'AI Voice Agent',
                    capturedAt: new Date().toISOString(),
                }

                await prisma.place.update({
                    where: { id: rlp.placeId },
                    data: {
                        contactPeople: [...(existingContacts as any[]), newContact],
                        email: place?.contactPeople ? undefined : result.extractedEmail,
                    },
                })
            }
        } catch (err) {
            console.error('Failed to enrich Place with extracted contact', err)
        }
    }

    // Schedule retry if voicemail/no answer and attempts remain
    const voiceConfig = await prisma.voiceConfig.findFirst({ select: { maxAttempts: true } })
    const maxAttempts = voiceConfig?.maxAttempts ?? 3

    if (
        (result.callStatus === 'VOICEMAIL' || result.callStatus === 'NO_ANSWER') &&
        existing.callAttempts < maxAttempts
    ) {
        await scheduleRetry(cbId)
    }
}

async function handleStatusUpdate(message: any) {
    const metadata = message?.call?.metadata
    let cbId = metadata?.campaignBusinessId as string | undefined

    if (!cbId && message?.call?.id) {
        const found = await prisma.campaignBusiness.findFirst({
            where: { vapiCallId: message.call.id },
            select: { id: true },
        })
        if (found) cbId = found.id
    }

    if (!cbId) return

    const status = message?.status
    if (status === 'in-progress') {
        await prisma.campaignBusiness.update({
            where: { id: cbId },
            data: { callStatus: 'IN_PROGRESS' },
        }).catch(() => { })
    }
}
