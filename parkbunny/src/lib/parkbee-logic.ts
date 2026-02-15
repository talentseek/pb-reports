import rawData from './parkbee-data.json'

export type StreamType = 'locker' | 'carwash'

type RawSite = {
    id: string
    name: string
    postcode: string
    region: string
    streams: string[]
}

export type ParkBeeSite = RawSite & {
    lat: number | null
    lng: number | null
}

// Revenue rates — updated per Jon's instructions
export const REVENUE_RATES = {
    locker: 900,            // £900 + VAT/year MINIMUM per locker per location
    carwash: {
        min: 10000,         // £10k/year per site (conservative)
        max: 20000,         // £20k/year per site (upper estimate)
    },
} as const

// Portfolio summary calculations
export function calculatePortfolioSummary(sites: ParkBeeSite[]) {
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
            annualMin: carwashSites.length * REVENUE_RATES.carwash.min,
            annualMax: carwashSites.length * REVENUE_RATES.carwash.max,
        },
    }
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
export async function getParkBeeData(): Promise<ParkBeeSite[]> {
    const sites: ParkBeeSite[] = []

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
