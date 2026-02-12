import rawData from './nsl-data.json'

export type StreamType = 'locker' | 'carwash'

type RawSite = {
    id: string
    name: string
    postcode: string
    region: string
    streams: string[]
}

export type NSLSite = RawSite & {
    lat: number | null
    lng: number | null
}

// Revenue rates — flat pricing per Jon's email
export const REVENUE_RATES = {
    locker: 900,        // £900/year per site (flat rate)
    carwash: 10000,     // £10k/year per site (Self-Service, ZERO CAPEX)
} as const

// Portfolio summary calculations
export function calculatePortfolioSummary(sites: NSLSite[]) {
    const lockerSites = sites.filter(s => s.streams.includes('locker'))
    const carwashSites = sites.filter(s => s.streams.includes('carwash'))

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
    }
}

// Group sites by region
export function groupByRegion(sites: NSLSite[]): Record<string, NSLSite[]> {
    return sites.reduce((acc, site) => {
        const region = site.region || 'Other'
        if (!acc[region]) acc[region] = []
        acc[region].push(site)
        return acc
    }, {} as Record<string, NSLSite[]>)
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
export async function getNSLData(): Promise<NSLSite[]> {
    const sites: NSLSite[] = []

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
