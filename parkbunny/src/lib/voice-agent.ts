import prisma from '@/lib/db'
import type { CampaignBusiness, CallStatus } from '@prisma/client'

const VAPI_API_URL = 'https://api.vapi.ai'

// ─── Phone formatting ───

export function formatPhoneE164(phone: string): string | null {
    try {
        // Strip spaces, dashes, parentheses
        let clean = phone.replace(/[\s\-()]/g, '')

        // Handle +44 prefix
        if (clean.startsWith('+44')) {
            clean = '0' + clean.slice(3)
        } else if (clean.startsWith('44') && clean.length > 10) {
            clean = '0' + clean.slice(2)
        }

        // Must start with 0 and be 10-11 digits
        if (!clean.startsWith('0')) return null
        if (clean.length < 10 || clean.length > 11) return null
        
        // Must be a valid UK prefix
        if (!/^0[1-9]/.test(clean)) return null

        // Convert to E.164: +44 + number without leading 0
        return '+44' + clean.slice(1)
    } catch {
        return null
    }
}

// ─── Calling window ───

export function isWithinCallingWindow(): boolean {
    const now = new Date()
    const ukFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        hour: 'numeric',
        minute: 'numeric',
        weekday: 'short',
        hour12: false,
    })
    const parts = ukFormatter.formatToParts(now)
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10)
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10)
    const weekday = parts.find(p => p.type === 'weekday')?.value ?? ''

    // Mon-Fri only
    if (['Sat', 'Sun'].includes(weekday)) return false

    const t = hour * 60 + minute
    // 10:00–11:30 or 14:30–16:30
    return (t >= 600 && t <= 690) || (t >= 870 && t <= 990)
}

// ─── Vapi call dispatch ───

export interface DispatchResult {
    vapiCallId: string
    success: true
}

export interface DispatchError {
    success: false
    error: string
}

export async function dispatchCall(
    cb: CampaignBusiness & { reportLocationPlace: { place: { name: string; phone: string | null } } },
    carparkName: string,
    config: { vapiAssistantId: string; vapiPhoneNumId: string },
): Promise<DispatchResult | DispatchError> {
    const phone = cb.reportLocationPlace.place.phone
    if (!phone) return { success: false, error: 'no_phone' }

    const e164 = formatPhoneE164(phone)
    if (!e164) return { success: false, error: 'invalid_number' }

    const businessName = cb.reportLocationPlace.place.name.slice(0, 40)

    const payload = {
        assistantId: config.vapiAssistantId,
        phoneNumberId: config.vapiPhoneNumId,
        customer: { number: e164, name: businessName },
        assistantOverrides: {
            variableValues: {
                business_name: businessName,
                carpark_name: carparkName,
            },
        },
        metadata: {
            campaignBusinessId: cb.id,
            reportLocationPlaceId: cb.reportLocationPlaceId,
        },
    }

    const vapiKey = process.env.VAPI_PRIVATE_API_KEY
    if (!vapiKey) return { success: false, error: 'no_vapi_key' }

    try {
        const res = await fetch(`${VAPI_API_URL}/call/phone`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${vapiKey}`,
            },
            body: JSON.stringify(payload),
        })

        if (!res.ok) {
            const text = await res.text().catch(() => '')
            console.error('Vapi dispatch error', res.status, text)
            return { success: false, error: `vapi_${res.status}` }
        }

        const data = await res.json()
        return { success: true, vapiCallId: data.id }
    } catch (err) {
        console.error('Vapi dispatch exception', err)
        return { success: false, error: 'network_error' }
    }
}

// ─── Webhook processing ───

export interface ProcessedCallResult {
    callStatus: CallStatus
    callSummary: string | null
    transcript: string | null
    recordingUrl: string | null
    callDuration: number | null
    extractedName: string | null
    extractedEmail: string | null
    extractedPhone: string | null
    callbackTime: string | null
    endedReason: string | null
}

export function processCallResult(payload: any): ProcessedCallResult {
    const structured = payload?.analysis?.structuredData ?? {}
    const outcomeMap: Record<string, CallStatus> = {
        LEAD_CAPTURED: 'LEAD_CAPTURED',
        CALLBACK_BOOKED: 'CALLBACK_BOOKED',
        NOT_INTERESTED: 'NOT_INTERESTED',
        VOICEMAIL: 'VOICEMAIL',
        GATEKEEPER_BLOCKED: 'GATEKEEPER_BLOCKED',
    }

    const rawOutcome = structured.call_outcome as string | undefined
    let callStatus: CallStatus = outcomeMap[rawOutcome ?? ''] ?? 'FAILED'

    // Map Vapi endedReason to our statuses
    const endedReason = payload?.endedReason ?? payload?.call?.endedReason ?? null
    if (endedReason === 'voicemail') callStatus = 'VOICEMAIL'
    if (endedReason === 'customer-did-not-answer') callStatus = 'NO_ANSWER'
    if (endedReason === 'twilio-failed-to-connect-call') callStatus = 'FAILED'

    // Detect IVR/automated systems:
    // - max-duration-reached with GATEKEEPER_BLOCKED = stuck in IVR
    // - silence-timed-out with GATEKEEPER_BLOCKED = IVR dropped
    // - summary containing 'automated' or 'menu' with GATEKEEPER_BLOCKED
    const summary = payload?.summary ?? payload?.analysis?.summary ?? ''
    if (callStatus === 'GATEKEEPER_BLOCKED') {
        const isIVR =
            endedReason === 'max-duration-reached' ||
            endedReason === 'silence-timed-out' ||
            /automated|menu loop|automated system|ivr|press \d/i.test(summary)
        if (isIVR) callStatus = 'IVR_BLOCKED'
    }

    // customer-ended-call with no structured outcome is likely a hang-up, not a "failure"
    if (callStatus === 'FAILED' && endedReason === 'customer-ended-call') {
        callStatus = 'NOT_INTERESTED'
    }

    return {
        callStatus,
        callSummary: summary || null,
        transcript: payload?.transcript ?? null,
        recordingUrl: payload?.recordingUrl ?? null,
        callDuration: payload?.call?.duration ? Math.round(payload.call.duration) : null,
        extractedName: structured.decision_maker_name ?? null,
        extractedEmail: structured.decision_maker_email ?? null,
        extractedPhone: null,
        callbackTime: structured.best_callback_time ?? null,
        endedReason,
    }
}

// ─── Callable business lookup ───

export async function getCallableBusinesses(campaignId: string, maxAttempts: number = 3) {
    return prisma.campaignBusiness.findMany({
        where: {
            campaignId,
            OR: [
                { callStatus: 'PENDING' },
                { callStatus: 'QUEUED' },
                {
                    callStatus: { in: ['VOICEMAIL', 'NO_ANSWER'] },
                    callAttempts: { lt: maxAttempts },
                    nextCallAt: { lte: new Date() },
                },
            ],
        },
        include: {
            reportLocationPlace: {
                include: { place: true },
            },
        },
        orderBy: [{ callAttempts: 'asc' }, { createdAt: 'asc' }],
    })
}

// ─── Deduplication ───

/**
 * Check if a business (by placeId) has already been contacted in any campaign.
 * Returns the campaign name if duplicate, null if safe to call.
 */
export async function checkDuplicateBusiness(
    placeId: string,
    excludeCampaignId?: string,
): Promise<string | null> {
    const existing = await prisma.campaignBusiness.findFirst({
        where: {
            reportLocationPlace: { placeId },
            callStatus: { notIn: ['PENDING', 'QUEUED', 'DUPLICATE_SKIPPED'] },
            ...(excludeCampaignId ? { campaignId: { not: excludeCampaignId } } : {}),
        },
        include: { campaign: { select: { name: true } } },
    })
    return existing ? existing.campaign.name : null
}
