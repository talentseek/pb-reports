import rawData from './buzzbingo-data.json'

export type StreamType = 'locker' | 'carwash' | 'ev'

type RawSite = {
    id: string
    name: string
    postcode: string
    region: string
    streams: string[]
}

export type BuzzBingoSite = RawSite & {
    lat: number | null
    lng: number | null
}

// Revenue rates (updated per Jon's feedback)
export const REVENUE_RATES = {
    locker: 900,        // £900/year per site
    carwash: 10000,     // £10k/year per site (Self-Service, ZERO CAPEX)
    ev: {
        // EV has complex options - we'll show details in the report
        capexPerSite: { min: 35000, max: 45000 },
        grossProfitPerYear: 24528,
        revShareSplit: { emerge: 85, buzz: 15 }
    }
} as const

// Portfolio summary calculations
export function calculatePortfolioSummary(sites: BuzzBingoSite[]) {
    const lockerSites = sites.filter(s => s.streams.includes('locker'))
    const carwashSites = sites.filter(s => s.streams.includes('carwash'))
    const evSites = sites.filter(s => s.streams.includes('ev'))

    return {
        total: sites.length,
        baseline: sites.length * 50000, // £50k per site baseline
        locker: {
            count: lockerSites.length,
            annual: lockerSites.length * REVENUE_RATES.locker
        },
        carwash: {
            count: carwashSites.length,
            annual: carwashSites.length * REVENUE_RATES.carwash
        },
        ev: {
            count: evSites.length,
            // EV revenue depends on model chosen - show in report
            capexRange: {
                min: evSites.length * REVENUE_RATES.ev.capexPerSite.min,
                max: evSites.length * REVENUE_RATES.ev.capexPerSite.max
            },
            annualGrossProfit: evSites.length * REVENUE_RATES.ev.grossProfitPerYear
        }
    }
}

// Group sites by region
export function groupByRegion(sites: BuzzBingoSite[]): Record<string, BuzzBingoSite[]> {
    return sites.reduce((acc, site) => {
        const region = site.region || 'Other'
        if (!acc[region]) acc[region] = []
        acc[region].push(site)
        return acc
    }, {} as Record<string, BuzzBingoSite[]>)
}

// Geocoding via postcodes.io
async function geocodePostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`)
        if (!res.ok) return null
        const data = await res.json()
        if (data.status === 200 && data.result) {
            return { lat: data.result.latitude, lng: data.result.longitude }
        }
    } catch {
        // Silently fail
    }
    return null
}

// Main data loader
export async function getBuzzBingoData(): Promise<BuzzBingoSite[]> {
    const sites: BuzzBingoSite[] = []

    for (const raw of rawData as RawSite[]) {
        const geo = await geocodePostcode(raw.postcode)
        sites.push({
            ...raw,
            streams: raw.streams as StreamType[],
            lat: geo?.lat ?? null,
            lng: geo?.lng ?? null
        })
    }

    return sites
}

// Format currency helper
export function formatCurrency(n: number): string {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        maximumFractionDigits: 0
    }).format(n)
}
