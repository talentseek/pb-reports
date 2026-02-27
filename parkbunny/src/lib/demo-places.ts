import type { DemoConfig, DemoDeal, EnrichedDeal } from './demo-configs/types'

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || ''

type PlaceResult = {
    displayName?: { text: string }
    formattedAddress?: string
    location?: { latitude: number; longitude: number }
}

function haversineDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 3959 // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

function formatDistance(miles: number): string {
    if (miles < 0.1) return `${Math.round(miles * 5280)} ft`
    if (miles < 1) return `${(miles).toFixed(1)} mi`
    return `${(miles).toFixed(1)} mi`
}

// Hardcoded fallback distances for when Google Places is unavailable
const FALLBACK_DISTANCES: Record<string, { distance: string; address: string }> = {
    'Costa Coffee': { distance: '0.2 mi', address: '35 Grosvenor St, London W1K 4QN' },
    'Vue Cinema': { distance: '0.8 mi', address: 'Fulham Rd, London SW10 9SG' },
    'Tesco': { distance: '0.4 mi', address: '311 Oxford St, London W1C 2HP' },
    'Pret A Manger': { distance: '0.1 mi', address: '27 Curzon St, London W1J 7TH' },
    "Nando's": { distance: '0.3 mi', address: '10 Wardour St, London W1D 6QF' },
    'Greggs': { distance: '0.5 mi', address: '1 Piccadilly, London W1J 0DA' },
}

async function findNearestPlace(
    query: string,
    lat: number,
    lng: number
): Promise<{ distance: string; address: string } | null> {
    if (!PLACES_API_KEY) return null

    try {
        const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': PLACES_API_KEY,
                'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location',
            },
            body: JSON.stringify({
                textQuery: query,
                locationBias: {
                    circle: {
                        center: { latitude: lat, longitude: lng },
                        radius: 2000,
                    },
                },
                maxResultCount: 1,
            }),
        })

        if (!res.ok) return null
        const data = await res.json()
        const place: PlaceResult | undefined = data.places?.[0]
        if (!place?.location) return null

        const miles = haversineDistance(lat, lng, place.location.latitude, place.location.longitude)
        return {
            distance: formatDistance(miles),
            address: place.formattedAddress || query,
        }
    } catch {
        return null
    }
}

export async function enrichDeals(config: DemoConfig): Promise<EnrichedDeal[]> {
    const { lat, lng } = config.location
    if (!lat || !lng) {
        return config.deals.map(deal => ({
            ...deal,
            distance: FALLBACK_DISTANCES[deal.brand]?.distance || '0.3 mi',
            nearestAddress: FALLBACK_DISTANCES[deal.brand]?.address || deal.brand,
        }))
    }

    const enriched: EnrichedDeal[] = await Promise.all(
        config.deals.map(async (deal: DemoDeal) => {
            const result = await findNearestPlace(deal.placeQuery, lat, lng)
            const fallback = FALLBACK_DISTANCES[deal.brand]

            return {
                ...deal,
                distance: result?.distance || fallback?.distance || '0.3 mi',
                nearestAddress: result?.address || fallback?.address || deal.brand,
            }
        })
    )

    return enriched
}
