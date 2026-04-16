import prisma from '@/lib/db'
import type { StreamType } from '@prisma/client'

// ── Stream type groupings ─────────────────────────────────────────────

export const CORE_STREAM_TYPES: StreamType[] = ['LOCKER', 'CAR_WASH', 'EV_CHARGING', 'FARMERS_MARKET']
export const ALT_STREAM_TYPES: StreamType[] = [
    'TESLA_DEMO', 'WE_BUY_ANY_CAR', 'GIANT_WASHING_MACHINE', 'DOG_GROOMING',
    'NHS_MRI_SCANNER', 'FILM_CREW_HOSTING', 'ELECTRIC_BIKE_BAY', 'WATERLESS_CAR_WASH', 'DIGITAL_SIGNAGE',
    'DOMINOS_POD', 'LAST_MILE_LOCKER', 'DOG_WASH_UNIT', 'SELF_SERVICE_LAUNDRY',
    'SOLAR_PPA', 'SOLAR_PV_PAID', 'TARIFF_OPTIMISATION', 'SITE_MAINTENANCE', 'OCTOPUS_ENERGY',
    'PADEL_COURT',
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
        image: '/locker-new.png',
        description: 'Minimum revenue per locker per year — this can dramatically increase subject to location and footfall.',
        bullets: [
            'Spaces required: none – 4 max per locker (typically utilises underused space)',
            'Solar powered — zero energy cost to the operator',
            'Fully insured and maintained by ParkBunny',
            'Minimum 1-year contract',
            'Zero CAPEX — all hardware supplied',
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
            'Spaces required: 10–15',
            'Zero CAPEX — all equipment and consumables provided',
            'Fully insured and maintained',
            '5-year contract — break clauses negotiable after 18 months with zero penalties, subject to historic revenue performance and supplier capex recovery',
            'All terms subject to negotiation',
        ],
        defaultMin: 10000,
        defaultMax: 20000,
        statusLabel: 'Portfolio-Wide',
    },
    EV_CHARGING: {
        label: 'EV Charging',
        icon: 'Zap',
        image: '/ev-charging.webp',
        description: 'Various suppliers and contract lengths available. Revenue model dependent on capex vs. non-capex structure and supplier ROI.',
        bullets: [
            'Multiple supplier options with flexible contract terms',
            'Capex and non-capex models available',
            'Revenue dependent on chosen supplier and deployment model',
            'Installation and ongoing maintenance included',
            'All terms subject to negotiation and client requirements',
        ],
        isTextOnly: true,
        textDisplay: 'Subject to supplier & model selection',
        statusLabel: 'Subject to Survey',
    },
    FARMERS_MARKET: {
        label: 'Farmers Markets & Events',
        icon: 'ShoppingBag',
        image: '/market.webp',
        description: 'From one-off pilot events through to weekly, monthly, or seasonal programmes. Fully managed service driving footfall and community engagement.',
        bullets: [
            'Flexible deployment — one-off pilots, weekly, monthly, or seasonal',
            'Fully managed service including vendor coordination',
            'Community engagement and incremental footfall on quieter days',
            'All subject to client requirements and negotiation',
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
            'Spaces required: 3–5 + EV charging needed',
            'Fixed annual revenue — £50,000 per site',
            'Tesla manages all vehicles and staffing',
            '1-year contract where on-site EV charging is available for 3+ vehicles',
            '5-year contract where Tesla must provide charging infrastructure',
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
            '3-year contract preferred — 1-year break clause negotiable with zero penalties',
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
            'Spaces required: none – 5 (non-parking space if available)',
            'Revenue share model — £1,500 per year minimum',
            'All equipment supplied and maintained',
            '3-year contract — 18-month break clauses negotiable based on historic revenue performance',
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
            'Spaces required: none – 5 (non-parking space if available)',
            'Revenue range £5,000 – £10,000 per site per year',
            'Self-service model — minimal staffing',
            '3-year contract — break clauses negotiable based on revenue performance',
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
        description: 'Hosting NHS mobile MRI scanning units on-site, up to 7 days per month. Generates fixed revenue with positive community impact.',
        bullets: [
            'Spaces required: 10 — site must provide HGV access and sufficient turning circle',
            'Fixed annual revenue — £7,500 per site',
            'Maximum 7 days per month occupancy',
            '1-year contract — longer terms available on request',
            'NHS-managed — fully self-contained unit',
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
            'No fixed contract length — ad-hoc bookings arranged as required',
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
            'Spaces required: 10–12',
            'Revenue range £15,000 – £45,000 depending on footfall',
            'Environmentally sustainable — zero water usage',
            '3-year contract — break clauses negotiable',
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
            '3-year contract — longer terms available on request',
            'Zero CAPEX — all hardware supplied',
        ],
        defaultMin: 10000,
        defaultMax: 50000,
        statusLabel: 'Subject to Survey',
        isAlternative: true,
    },
    DOMINOS_POD: {
        label: "Domino's Pizza Pod",
        icon: 'Pizza',
        image: '/dominos-pod.jpg',
        description: "Self-contained Domino's Pizza pod unit installed in the car park. Power and plumbing costs covered by Domino's — zero CAPEX to the operator.",
        bullets: [
            'Spaces required: 10–15 (power and plumbing needed)',
            'Revenue range £20,000 – £50,000 depending on location',
            "All power and plumbing costs covered by Domino's",
            'Long lease terms required — duration dependent on location suitability',
            'National brand with proven demand and significant footfall',
        ],
        defaultMin: 20000,
        defaultMax: 50000,
        statusLabel: 'Subject to Survey',
        isAlternative: true,
    },
    LAST_MILE_LOCKER: {
        label: 'Last Mile Logistics Locker',
        icon: 'Warehouse',
        image: '/lastmile.jpg',
        description: 'Micro warehouse locker for tradespeople (Hotpoint, Sky engineers etc.) to collect parts. Battery operated, fully maintained, and requires 2.5m height clearance.',

        bullets: [
            'Spaces required: 3–4+ (subject to survey)',
            'Revenue range £3,000 – £4,000 + VAT per location per year',
            'Battery operated — zero energy cost to the operator',
            'Requires 2.5m height clearance',
            'Can be installed on non-concrete areas — locker company pays for base installation',
            'Fully maintained — acts as a micro warehouse',
            '1-year contract then rolling',
            'UK-wide demand from trade and logistics networks',
        ],
        defaultMin: 3000,
        defaultMax: 4000,
        statusLabel: 'Subject to Survey',
        isAlternative: true,
    },
    DOG_WASH_UNIT: {
        label: 'Self-Service Dog Wash',
        icon: 'Dog',
        image: '/dog-wash-unit.avif',
        description: 'Fully self-service dog wash unit — choice of enclosed or open-air. All setup and install costs covered by supplier. Revenue share model with quarterly payments.',
        bullets: [
            'Average gross revenue: ~£15,000 per year',
            'Revenue share model — 80/20 split, operator receives 20%',
            'All setup costs covered including installation — zero CAPEX',
            'Two product options: fully enclosed unit or open-air unit',
            'Requires high visibility from the road for passing traffic',
            'Utilities metered and tracked — electricity and water',
            'Payments paid quarterly, 2 weeks in arrears',
        ],
        defaultRate: 3000,
        statusLabel: 'Subject to Survey',
        isAlternative: true,
    },
    SELF_SERVICE_LAUNDRY: {
        label: 'Self-Service Laundry',
        icon: 'WashingMachine',
        image: '/self-service-laundry.png',
        description: 'Self-service laundry unit with 4 drums (2 washers, 2 dryers — all large capacity). All setup and install costs covered. Revenue share model with quarterly payments.',
        bullets: [
            'Average gross revenue: ~£35,000 per year',
            'Revenue share model — 80/20 split, operator receives 20%',
            'All setup costs covered including installation — zero CAPEX',
            '4 drum unit: 2 washers + 2 dryers (all large capacity)',
            'Requires strong local population and high road visibility',
            'Utilities metered and tracked — electricity and water',
            'Payments paid quarterly, 2 weeks in arrears',
        ],
        defaultRate: 7000,
        statusLabel: 'Subject to Survey',
        isAlternative: true,
    },
    SOLAR_PPA: {
        label: 'Solar PPA (Power Purchase Agreement)',
        icon: 'Sun',
        image: '/solar-ppa.png',
        description: 'Fully-funded Solar PV, Battery, and EV charging installation via Power Purchase Agreement. No capital expenditure — fixed kWh tariff with approximately 30% bill reduction for the full term.',
        bullets: [
            'Free installation — fully funded by PPA provider',
            'Fixed kWh tariff: £0.16–£0.20/kWh for the duration of the agreement',
            'Terms from 15 to 25 years — ~30% bill reduction with no inflation impact',
            'Minimum requirements: CreditSafe score of 55, 25,000 kWh annual consumption, 20kW+ Solar PV capacity (~35 panels)',
            'Legal title transfers to site owner for £1 at end of PPA term',
            'Improved Commercial EPC — readiness for 2030 M.E.E.S requirements',
            'Fully maintained and serviced to optimise generation',
            'No impact on site ownership — not a "rent a roof" agreement',
            'Direct contribution to carbon reduction targets',
        ],
        isTextOnly: true,
        textDisplay: '~30% bill reduction — free installation',
        statusLabel: 'Subject to Survey',
        isAlternative: true,
    },
    SOLAR_PV_PAID: {
        label: 'Solar PV (Paid Installation)',
        icon: 'SunDim',
        image: '/solar-pv-paid.png',
        description: 'Paid solar PV generation and battery storage — tailored installation to remove up to 80% of grid electricity usage. Average ROI of approximately 7 years with 500% return over system life.',
        bullets: [
            'Removes up to 80% of electricity usage from the grid',
            'Fully tailored installation to suit site requirements',
            'Approximate 7-year return on investment',
            '500% return on investment over the life of the system',
            'Includes battery storage and trading capability',
            'Improved Commercial EPC rating',
        ],
        isTextOnly: true,
        textDisplay: 'Up to 80% grid reduction — ~7yr ROI',
        statusLabel: 'Subject to Survey',
        isAlternative: true,
    },
    TARIFF_OPTIMISATION: {
        label: 'Energy Tariff Optimisation',
        icon: 'TrendingDown',
        image: '/tariff-optimisation.png',
        description: 'Full energy tariff optimisation service with access to exclusive tariffs from 20+ energy retailers. Proposals returned within 48 hours.',
        bullets: [
            'Between 20% and 70% saving on current energy bills',
            'Lock in today\'s prices even under existing contracts',
            'Access to exclusive tariffs not available on the open market',
            'Over 20 energy retailers compared',
            'Account managed service — 91% of renewals beaten on price',
            'Proposals returned within 48 hours with copies of bills',
        ],
        isTextOnly: true,
        textDisplay: '20%–70% savings on energy bills',
        statusLabel: 'Subject to Survey',
        isAlternative: true,
    },
    SITE_MAINTENANCE: {
        label: 'Site Maintenance & Clearance',
        icon: 'Wrench',
        image: '/site-maintenance.png',
        description: 'Full site clearance, maintenance, and building services available with UK-wide coverage. From cleaning and power washing to specialist maintenance contracts.',
        bullets: [
            'Full site clearance and maintenance',
            'Building and repair work',
            'Cleaning and power washing',
            'Specialist cleaning services',
            'Maintenance contracts available',
            'UK-wide coverage',
        ],
        isTextOnly: true,
        textDisplay: 'Subject to survey',
        statusLabel: 'Subject to Survey',
        isAlternative: true,
    },
    OCTOPUS_ENERGY: {
        label: 'Octopus Energy — Domestic Switch',
        icon: 'Plug',
        image: '/octopus-energy.webp',
        description: 'In-app hyperlink allowing drivers to switch domestic energy supply to Octopus Energy in approximately 2 minutes. Generates revenue per switch with zero site impact.',
        bullets: [
            '£50 credit to new Octopus customers on switch',
            '£25 revenue to ParkBunny for every completed switch',
            'Switch completed in approximately 2 minutes via app',
            'Octopus Energy: 8m domestic customers, best value supplier 9 years running',
            'Tariff types available for all homes including EV and Solar PV owners',
            'National deal — available at all ParkBunny locations',
            'Zero site footprint — entirely digital',
        ],
        isTextOnly: true,
        textDisplay: '£25 per customer switch',
        statusLabel: 'National Deal',
        isAlternative: true,
    },
    PADEL_COURT: {
        label: 'Instant Padel Courts',
        icon: 'Racquet',
        image: '/padel.png',
        description: 'Zero-CAPEX instant padel courts manufactured in Sweden. Revenue share model with 25% to the site partner. Minimum two-court installation with flexible relocation options within your portfolio.',
        bullets: [
            'Total revenue per 2–4 courts: £250,000 – £350,000 per year',
            'Revenue share model — 25% to the site partner',
            'Zero CAPEX — all costs covered',
            '300 sq m per court (two-court minimum to make viable)',
            'Min 24-month contract with option to relocate after 18 months',
            '4–12 week install time dependent on stock',
            'Manufactured in Sweden — premium build quality',
            'Multiple court flooring options depending on location',
        ],
        defaultMin: 62500,
        defaultMax: 87500,
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
