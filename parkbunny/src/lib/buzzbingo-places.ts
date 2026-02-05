/**
 * Lightweight Google Places fetcher for Buzz Bingo proposal
 * Fetches demand drivers for portfolio postcodes without database persistence
 */

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY
const PLACES_FIELD_MASK = [
    'places.id',
    'places.displayName',
    'places.types',
    'places.formattedAddress',
    'places.rating',
    'places.userRatingCount',
].join(',')

// Simplified categories for portfolio overview
const DEMAND_CATEGORIES = [
    { group: 'Food & Drink', types: ['restaurant', 'cafe', 'bar', 'fast_food_restaurant'] },
    { group: 'Shopping', types: ['store', 'shopping_mall', 'supermarket'] },
    { group: 'Health & Fitness', types: ['gym', 'spa', 'doctor', 'pharmacy'] },
    { group: 'Entertainment', types: ['movie_theater', 'bowling_alley', 'amusement_park'] },
    { group: 'Services', types: ['bank', 'post_office', 'car_repair'] },
]

export type PlaceSummary = {
    id: string
    name: string
    types: string[]
    rating?: number
    reviewCount?: number
}

export type CategorySummary = {
    group: string
    count: number
    topPlaces: PlaceSummary[]
}

export type PostcodePlaces = {
    postcode: string
    siteName: string
    categories: CategorySummary[]
    totalPlaces: number
    demandScore: number // 1-10 based on total nearby businesses
}

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

async function fetchNearbyPlaces(lat: number, lng: number, types: string[], maxResults: number = 10): Promise<any[]> {
    if (!PLACES_API_KEY) return []

    const endpoint = 'https://places.googleapis.com/v1/places:searchNearby'
    const body = {
        includedTypes: types,
        maxResultCount: Math.min(maxResults, 20),
        locationRestriction: {
            circle: {
                center: { latitude: lat, longitude: lng },
                radius: 1609.34, // 1 mile in meters
            },
        },
    }

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': PLACES_API_KEY,
                'X-Goog-FieldMask': PLACES_FIELD_MASK,
            },
            body: JSON.stringify(body),
        })

        if (!res.ok) return []
        const data = await res.json()
        return data?.places ?? []
    } catch {
        return []
    }
}

function calculateDemandScore(totalPlaces: number): number {
    // Score based on total nearby businesses (1-10 scale)
    if (totalPlaces >= 50) return 10
    if (totalPlaces >= 40) return 9
    if (totalPlaces >= 30) return 8
    if (totalPlaces >= 25) return 7
    if (totalPlaces >= 20) return 6
    if (totalPlaces >= 15) return 5
    if (totalPlaces >= 10) return 4
    if (totalPlaces >= 5) return 3
    if (totalPlaces >= 2) return 2
    return 1
}

export async function fetchPlacesForPostcode(postcode: string, siteName: string): Promise<PostcodePlaces> {
    const geo = await geocodePostcode(postcode)

    if (!geo) {
        return {
            postcode,
            siteName,
            categories: [],
            totalPlaces: 0,
            demandScore: 1,
        }
    }

    const categories: CategorySummary[] = []
    let totalPlaces = 0

    for (const cat of DEMAND_CATEGORIES) {
        const places = await fetchNearbyPlaces(geo.lat, geo.lng, cat.types, 10)
        const topPlaces: PlaceSummary[] = places.slice(0, 5).map((p: any) => ({
            id: p.id,
            name: p.displayName?.text || p.displayName || 'Unknown',
            types: p.types || [],
            rating: p.rating,
            reviewCount: p.userRatingCount,
        }))

        categories.push({
            group: cat.group,
            count: places.length,
            topPlaces,
        })
        totalPlaces += places.length
    }

    return {
        postcode,
        siteName,
        categories,
        totalPlaces,
        demandScore: calculateDemandScore(totalPlaces),
    }
}

export async function fetchAllBuzzBingoPlaces(sites: { postcode: string; name: string }[]): Promise<PostcodePlaces[]> {
    // Fetch in parallel with some concurrency control
    const results: PostcodePlaces[] = []
    const batchSize = 5 // Process 5 postcodes at a time to avoid rate limits

    for (let i = 0; i < sites.length; i += batchSize) {
        const batch = sites.slice(i, i + batchSize)
        const batchResults = await Promise.all(
            batch.map(site => fetchPlacesForPostcode(site.postcode, site.name))
        )
        results.push(...batchResults)
    }

    return results
}

// Calculate portfolio-wide demand summary
export function calculatePortfolioDemandSummary(placesData: PostcodePlaces[]) {
    const totalSites = placesData.length
    const avgDemandScore = totalSites > 0
        ? Math.round(placesData.reduce((sum, p) => sum + p.demandScore, 0) / totalSites * 10) / 10
        : 0

    const categoryTotals: Record<string, number> = {}
    for (const site of placesData) {
        for (const cat of site.categories) {
            categoryTotals[cat.group] = (categoryTotals[cat.group] || 0) + cat.count
        }
    }

    // Find top demand categories
    const topCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([group, count]) => ({ group, count }))

    return {
        totalSites,
        avgDemandScore,
        topCategories,
        totalBusinesses: Object.values(categoryTotals).reduce((a, b) => a + b, 0),
    }
}
