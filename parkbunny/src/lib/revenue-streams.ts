import prisma from '@/lib/db'
import type { StreamType } from '@prisma/client'

// ── Stream type groupings ─────────────────────────────────────────────

export const CORE_STREAM_TYPES: StreamType[] = ['LOCKER', 'CAR_WASH', 'EV_CHARGING', 'FARMERS_MARKET']
export const ALT_STREAM_TYPES: StreamType[] = [
    'TESLA_DEMO', 'WE_BUY_ANY_CAR', 'GIANT_WASHING_MACHINE', 'DOG_GROOMING',
    'NHS_MRI_SCANNER', 'FILM_CREW_HOSTING', 'ELECTRIC_BIKE_BAY', 'WATERLESS_CAR_WASH', 'DIGITAL_SIGNAGE',
]
export const ALL_STREAM_TYPES: StreamType[] = [...CORE_STREAM_TYPES, ...ALT_STREAM_TYPES]

// ── Stream display metadata ───────────────────────────────────────────

export type StreamMeta = {
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
    isAlternative?: boolean
}

export const STREAM_DEFAULTS: Record<StreamType, StreamMeta> = {
    // ── Core streams (add to portfolio total) ─────────────────────────
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

    // ── Alternative streams (informational only — NOT added to total) ─
    TESLA_DEMO: {
        label: 'Tesla Demo Vehicles',
        icon: 'Car',
        image: '/teslatestdrive.jpg',
        description: 'Host Tesla demo and test drive vehicles on-site, generating fixed annual revenue from dedicated parking spaces.',
        bullets: [
            'Fixed annual revenue — £50,000 per site',
            'Tesla manages all vehicles and staffing',
            'Drives premium footfall to the car park',
            'Zero CAPEX — Tesla supplies all infrastructure',
        ],
        defaultRate: 50000,
        statusLabel: 'Subject to Survey',
        isAlternative: true,
    },
    WE_BUY_ANY_CAR: {
        label: 'We Buy Any Car — Site Pod',
        icon: 'Car',
        image: '/wbacstation.jpg',
        description: 'Dedicated valuation pod with 10 parking spaces for vehicle buy-back operations. Fixed annual lease revenue.',
        bullets: [
            'Fixed annual revenue — £15,000 per site',
            '10 dedicated car spaces included',
            'Self-contained pod — minimal operator involvement',
            'Proven high-street brand with national coverage',
        ],
        defaultRate: 15000,
        statusLabel: 'Subject to Survey',
        isAlternative: true,
    },
    GIANT_WASHING_MACHINE: {
        label: 'Giant Washing Machines',
        icon: 'Droplets',
        image: '/washmachine.jpeg',
        description: 'Commercial-grade giant washing machines deployed on a revenue share basis. Ideal for high-footfall locations near residential areas.',
        bullets: [
            'Revenue share model — £1,500 per year minimum',
            'All equipment supplied and maintained',
            'Popular with residential and commuter car parks',
            'Zero CAPEX — fully managed service',
        ],
        defaultRate: 1500,
        statusLabel: 'Subject to Survey',
        isAlternative: true,
    },
    DOG_GROOMING: {
        label: 'Dog Grooming Stations',
        icon: 'Heart',
        image: '/dogwash.webp',
        description: 'Self-service dog wash and grooming stations. Popular with pet owners visiting retail and leisure destinations.',
        bullets: [
            'Revenue range £5,000 – £10,000 per site per year',
            'Self-service model — minimal staffing',
            'Drives repeat visits from pet owners',
            'All equipment supplied and maintained',
        ],
        defaultMin: 5000,
        defaultMax: 10000,
        statusLabel: 'Subject to Survey',
        isAlternative: true,
    },
    NHS_MRI_SCANNER: {
        label: 'NHS Mobile MRI Scanner',
        icon: 'Activity',
        image: '/nhs-mri-placeholder.webp',
        description: 'Hosting NHS mobile MRI scanning units on-site, up to 7 days per month. Generates fixed revenue with minimal space requirements.',
        bullets: [
            'Fixed annual revenue — £7,500 per site',
            'Maximum 7 days per month occupancy',
            'NHS-managed — fully self-contained unit',
            'Positive community impact and PR value',
        ],
        defaultRate: 7500,
        statusLabel: 'Subject to Survey',
        isAlternative: true,
    },
    FILM_CREW_HOSTING: {
        label: 'Unit Base — Film Crew Hosting',
        icon: 'Film',
        image: '/film-unit-base-placeholder.webp',
        description: 'Production unit base hosting for film and TV crews. Revenue varies significantly based on production duration and scale.',
        bullets: [
            'Revenue range £5,000 – £50,000 depending on duration',
            'Short-term high-value bookings',
            'Film industry demand growing across UK regions',
            'Minimal infrastructure changes required',
        ],
        defaultMin: 5000,
        defaultMax: 50000,
        statusLabel: 'Subject to Survey',
        isAlternative: true,
    },
    ELECTRIC_BIKE_BAY: {
        label: 'Electric Bike Bays',
        icon: 'Bike',
        image: '/electric-bike-bay-placeholder.webp',
        description: 'E-bike docking and charging bays generating recurring annual revenue per bay. Quantity subject to site survey.',
        bullets: [
            '£5,000+ per bay per year',
            'Growing demand for last-mile mobility',
            'Complements EV charging infrastructure',
            'Attractive to commuter and rail-adjacent sites',
        ],
        isTextOnly: true,
        textDisplay: '£5,000+ per bay per year',
        statusLabel: 'Subject to Survey',
        isAlternative: true,
    },
    WATERLESS_CAR_WASH: {
        label: 'Waterless Car Wash',
        icon: 'Sparkles',
        image: '/waterless-carwash-placeholder.webp',
        description: 'Eco-friendly waterless car wash service operated on-site. Revenue driven by footfall and location.',
        bullets: [
            'Revenue range £15,000 – £45,000 depending on footfall',
            'Environmentally sustainable — zero water usage',
            'Complements self-service car wash offering',
            'All equipment and staffing provided',
        ],
        defaultMin: 15000,
        defaultMax: 45000,
        statusLabel: 'Subject to Survey',
        isAlternative: true,
    },
    DIGITAL_SIGNAGE: {
        label: 'Digital Signage',
        icon: 'Monitor',
        image: '/signage.jpg',
        description: 'Digital advertising displays generating revenue from local and national advertisers. Revenue depends on footfall and location quality.',
        bullets: [
            'Revenue range £10,000 – £50,000+ depending on footfall',
            'Fully managed by advertising partner',
            'Premium locations command premium rates',
            'Zero CAPEX — all hardware supplied',
        ],
        defaultMin: 10000,
        defaultMax: 50000,
        statusLabel: 'Subject to Survey',
        isAlternative: true,
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
    isAlternative: boolean
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
    const isAlt = meta.isAlternative ?? false

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
            isAlternative: isAlt,
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
            isAlternative: isAlt,
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
        isAlternative: isAlt,
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
