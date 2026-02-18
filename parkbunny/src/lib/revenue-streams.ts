import prisma from '@/lib/db'
import type { StreamType } from '@prisma/client'

// ── Stream display metadata (hardcoded per user request) ──────────────

export const STREAM_DEFAULTS: Record<StreamType, {
    label: string
    icon: string
    image: string
    description: string
    bullets: string[]
    defaultRate?: number
    defaultMin?: number
    defaultMax?: number
    isTextOnly?: boolean
    textDisplay?: string
    statusLabel: string
}> = {
    LOCKER: {
        label: 'Smart Locker Solution',
        icon: 'Package',
        image: '/lockerphoto.webp',
        description: 'Minimum revenue per year — this can dramatically increase subject to location and footfall.',
        bullets: [
            'Solar powered — zero energy cost',
            'Fully insured and maintained',
            'Minimum 1-year contract',
            'Zero CAPEX — ParkBunny supplies all hardware',
        ],
        defaultRate: 900,
        statusLabel: 'Confirmed',
    },
    CAR_WASH: {
        label: 'Self-Service Car Wash',
        icon: 'Car',
        image: '/selfservicecarwash.webp',
        description: 'All hardware supplied, maintained, and insured including liquids. Zero CAPEX to the operator.',
        bullets: [
            'Zero CAPEX — all equipment provided',
            'All liquids and consumables included',
            'Fully insured and maintained',
            'Revenue generated from day one',
        ],
        defaultMin: 10000,
        defaultMax: 20000,
        statusLabel: 'Portfolio-Wide',
    },
    EV_CHARGING: {
        label: 'EV Charging (Revenue Share)',
        icon: 'Zap',
        image: '/ev-charging.webp',
        description: 'EV charging deployed via a revenue-share model with zero upfront cost. Typical deployment is 4 × 22kW AC chargers (8 bays) per site.',
        bullets: [
            'Zero upfront cost — revenue share model',
            '15% operator share of gross revenue',
            'Installation and maintenance included',
            'Site surveys required to confirm viability',
        ],
        defaultRate: 3600,
        statusLabel: 'Subject to Survey',
    },
    FARMERS_MARKET: {
        label: 'Farmers Markets & Events',
        icon: 'ShoppingBag',
        image: '/market.webp',
        description: 'Pop-up farmers markets and community events to drive footfall and create community engagement.',
        bullets: [
            'Flexible activation model',
            'Community engagement and brand building',
            'Additional footfall on quieter days',
            'Subject to site feasibility assessment',
        ],
        isTextOnly: true,
        textDisplay: '£1,000 – £2,500 per day',
        statusLabel: 'Subject to Survey',
    },
}

// ── DB query helpers ──────────────────────────────────────────────────

export async function getStreamsForReport(reportId: string) {
    return prisma.revenueStream.findMany({
        where: { reportId, enabled: true },
        include: { excludedLocations: true },
    })
}

export async function getActiveLocationCount(
    stream: { excludedLocations: { locationId: string }[] },
    totalLocationCount: number,
) {
    return totalLocationCount - stream.excludedLocations.length
}

export async function isLocationExcluded(
    stream: { excludedLocations: { locationId: string }[] },
    locationId: string,
) {
    return stream.excludedLocations.some((e) => e.locationId === locationId)
}

// ── Revenue calculation ───────────────────────────────────────────────

export type StreamRevenueSummary = {
    streamType: StreamType
    label: string
    siteCount: number
    annualRevenue: number | null
    annualMin: number | null
    annualMax: number | null
    isRange: boolean
    isTextOnly: boolean
    textDisplay: string | null
    statusLabel: string
}

export function calculateStreamRevenue(
    stream: {
        streamType: StreamType
        ratePerSite: number | null
        rateMin: number | null
        rateMax: number | null
        excludedLocations: { locationId: string }[]
    },
    totalLocationCount: number,
): StreamRevenueSummary {
    const meta = STREAM_DEFAULTS[stream.streamType]
    const siteCount = totalLocationCount - stream.excludedLocations.length

    if (meta.isTextOnly) {
        return {
            streamType: stream.streamType,
            label: meta.label,
            siteCount,
            annualRevenue: null,
            annualMin: null,
            annualMax: null,
            isRange: false,
            isTextOnly: true,
            textDisplay: meta.textDisplay ?? null,
            statusLabel: meta.statusLabel,
        }
    }

    const hasRange = stream.rateMin != null && stream.rateMax != null
    if (hasRange) {
        return {
            streamType: stream.streamType,
            label: meta.label,
            siteCount,
            annualRevenue: null,
            annualMin: siteCount * (stream.rateMin ?? 0),
            annualMax: siteCount * (stream.rateMax ?? 0),
            isRange: true,
            isTextOnly: false,
            textDisplay: null,
            statusLabel: meta.statusLabel,
        }
    }

    const rate = stream.ratePerSite ?? meta.defaultRate ?? 0
    return {
        streamType: stream.streamType,
        label: meta.label,
        siteCount,
        annualRevenue: siteCount * rate,
        annualMin: null,
        annualMax: null,
        isRange: false,
        isTextOnly: false,
        textDisplay: null,
        statusLabel: meta.statusLabel,
    }
}

// ── Format helper ─────────────────────────────────────────────────────

export function formatCurrency(n: number): string {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        maximumFractionDigits: 0,
    }).format(n)
}
