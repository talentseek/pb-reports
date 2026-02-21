import prisma from '@/lib/db'
import { dispatchCall, getCallableBusinesses, isWithinCallingWindow } from './voice-agent'
import type { CallStatus } from '@prisma/client'

// ─── Call dispatching ───

/**
 * Process the next batch of calls for a campaign.
 * Returns the number of calls dispatched.
 */
export async function processNextCalls(
    campaignId: string,
    maxConcurrent: number = 1,
    skipWindowCheck: boolean = false,
): Promise<number> {
    if (!skipWindowCheck && !isWithinCallingWindow()) {
        return 0
    }

    const config = await prisma.voiceConfig.findFirst()
    if (!config?.callingEnabled) return 0

    const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { status: true, carparkName: true, locationId: true },
    })

    if (!campaign || campaign.status !== 'CALLING') return 0

    // Verify location is still LIVE
    if (campaign.locationId) {
        const location = await prisma.reportLocation.findUnique({
            where: { id: campaign.locationId },
            select: { status: true },
        })
        if (location?.status !== 'LIVE') return 0
    }

    const callable = await getCallableBusinesses(campaignId, config.maxAttempts)
    const batch = callable.slice(0, maxConcurrent)
    let dispatched = 0

    for (const cb of batch) {
        // Mark as IN_PROGRESS before calling
        await prisma.campaignBusiness.update({
            where: { id: cb.id },
            data: { callStatus: 'IN_PROGRESS', callAttempts: { increment: 1 }, lastCallAt: new Date() },
        })

        const result = await dispatchCall(cb, campaign.carparkName, {
            vapiAssistantId: config.vapiAssistantId,
            vapiPhoneNumId: config.vapiPhoneNumId,
        })

        if (result.success) {
            await prisma.campaignBusiness.update({
                where: { id: cb.id },
                data: { vapiCallId: result.vapiCallId },
            })
            dispatched++
        } else {
            // Handle dispatch failures
            const errorStatus: CallStatus = result.error === 'invalid_number' ? 'INVALID_NUMBER' : 'FAILED'
            await prisma.campaignBusiness.update({
                where: { id: cb.id },
                data: { callStatus: errorStatus },
            })
        }

        // Rate limiting: 30-second gap between calls
        if (batch.indexOf(cb) < batch.length - 1) {
            await new Promise(r => setTimeout(r, 30_000))
        }
    }

    // Check if campaign is complete
    await checkCampaignCompletion(campaignId)

    return dispatched
}

// ─── Retry scheduling ───

const MORNING_WINDOW = { hour: 10, min: 0 }
const AFTERNOON_WINDOW = { hour: 14, min: 30 }

/**
 * Schedule a retry for a business that got voicemail or no answer.
 * Alternates between morning and afternoon windows, 24-48hrs later.
 */
export async function scheduleRetry(campaignBusinessId: string): Promise<void> {
    const cb = await prisma.campaignBusiness.findUnique({
        where: { id: campaignBusinessId },
        select: { lastCallAt: true },
    })

    if (!cb?.lastCallAt) return

    const lastHour = cb.lastCallAt.getHours()
    const isMorningCall = lastHour < 12

    // Schedule for the opposite window, 24-48hrs later
    const delayHours = 24 + Math.floor(Math.random() * 24)
    const nextCall = new Date(cb.lastCallAt.getTime() + delayHours * 60 * 60 * 1000)

    // Adjust to the target window
    if (isMorningCall) {
        nextCall.setHours(AFTERNOON_WINDOW.hour, AFTERNOON_WINDOW.min, 0, 0)
    } else {
        nextCall.setHours(MORNING_WINDOW.hour, MORNING_WINDOW.min, 0, 0)
        // If adjusting to morning pushes us to tomorrow, that's fine
        if (nextCall <= new Date()) {
            nextCall.setDate(nextCall.getDate() + 1)
        }
    }

    // Skip weekends
    const day = nextCall.getDay()
    if (day === 0) nextCall.setDate(nextCall.getDate() + 1) // Sun → Mon
    if (day === 6) nextCall.setDate(nextCall.getDate() + 2) // Sat → Mon

    await prisma.campaignBusiness.update({
        where: { id: campaignBusinessId },
        data: { nextCallAt: nextCall },
    })
}

// ─── Stats ───

export interface CampaignStats {
    total: number
    pending: number
    queued: number
    inProgress: number
    leadsCaptured: number
    callbacksBooked: number
    notInterested: number
    voicemail: number
    gatekeeperBlocked: number
    noAnswer: number
    invalidNumber: number
    failed: number
    ctpsBlocked: number
}

export async function getCampaignStats(campaignId: string): Promise<CampaignStats> {
    const businesses = await prisma.campaignBusiness.groupBy({
        by: ['callStatus'],
        where: { campaignId },
        _count: true,
    })

    const counts: Record<string, number> = {}
    for (const b of businesses) {
        counts[b.callStatus] = b._count
    }

    return {
        total: Object.values(counts).reduce((a, b) => a + b, 0),
        pending: counts['PENDING'] ?? 0,
        queued: counts['QUEUED'] ?? 0,
        inProgress: counts['IN_PROGRESS'] ?? 0,
        leadsCaptured: counts['LEAD_CAPTURED'] ?? 0,
        callbacksBooked: counts['CALLBACK_BOOKED'] ?? 0,
        notInterested: counts['NOT_INTERESTED'] ?? 0,
        voicemail: counts['VOICEMAIL'] ?? 0,
        gatekeeperBlocked: counts['GATEKEEPER_BLOCKED'] ?? 0,
        noAnswer: counts['NO_ANSWER'] ?? 0,
        invalidNumber: counts['INVALID_NUMBER'] ?? 0,
        failed: counts['FAILED'] ?? 0,
        ctpsBlocked: counts['CTPS_BLOCKED'] ?? 0,
    }
}

export interface LocationStats {
    locationId: string
    totalBusinesses: number
    withPhone: number
    campaignId: string | null
    campaignStatus: string | null
    callStats: CampaignStats | null
    lastActivity: { businessName: string; status: string; at: Date } | null
}

export async function getLocationStats(locationId: string): Promise<LocationStats> {
    const location = await prisma.reportLocation.findUnique({
        where: { id: locationId },
        include: {
            places: {
                where: { included: true },
                include: { place: { select: { phone: true } } },
            },
            campaigns: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { id: true, status: true },
            },
        },
    })

    if (!location) {
        return {
            locationId,
            totalBusinesses: 0,
            withPhone: 0,
            campaignId: null,
            campaignStatus: null,
            callStats: null,
            lastActivity: null,
        }
    }

    const totalBusinesses = location.places.length
    const withPhone = location.places.filter(p => p.place.phone).length
    const campaign = location.campaigns[0] ?? null

    let callStats: CampaignStats | null = null
    let lastActivity: LocationStats['lastActivity'] = null

    if (campaign) {
        callStats = await getCampaignStats(campaign.id)

        const lastCall = await prisma.campaignBusiness.findFirst({
            where: { campaignId: campaign.id, lastCallAt: { not: null } },
            orderBy: { lastCallAt: 'desc' },
            include: { reportLocationPlace: { include: { place: { select: { name: true } } } } },
        })

        if (lastCall?.lastCallAt) {
            lastActivity = {
                businessName: lastCall.reportLocationPlace.place.name,
                status: lastCall.callStatus,
                at: lastCall.lastCallAt,
            }
        }
    }

    return {
        locationId,
        totalBusinesses,
        withPhone,
        campaignId: campaign?.id ?? null,
        campaignStatus: campaign?.status ?? null,
        callStats,
        lastActivity,
    }
}

// ─── Campaign completion check ───

const TERMINAL_STATUSES: CallStatus[] = [
    'LEAD_CAPTURED',
    'CALLBACK_BOOKED',
    'NOT_INTERESTED',
    'GATEKEEPER_BLOCKED',
    'INVALID_NUMBER',
    'FAILED',
    'CTPS_BLOCKED',
]

async function checkCampaignCompletion(campaignId: string): Promise<void> {
    const remaining = await prisma.campaignBusiness.count({
        where: {
            campaignId,
            callStatus: { notIn: TERMINAL_STATUSES },
        },
    })

    if (remaining === 0) {
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'COMPLETED' },
        })
    }
}
