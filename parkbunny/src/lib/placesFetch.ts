import prisma from '@/lib/db'
import { PLACE_CATEGORIES, groupForPlace } from './placesCategories'

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

export type FetchConfig = {
  radiusMiles: number
  maxPerType: number
}

function milesToMeters(miles: number): number {
  return Math.round(miles * 1609.34)
}

function normalizePriceLevel(input: any): number | null {
  if (input == null) return null
  if (typeof input === 'number') return input
  if (typeof input === 'string') {
    switch (input) {
      case 'PRICE_LEVEL_FREE':
        return 0
      case 'PRICE_LEVEL_INEXPENSIVE':
        return 1
      case 'PRICE_LEVEL_MODERATE':
        return 2
      case 'PRICE_LEVEL_EXPENSIVE':
        return 3
      case 'PRICE_LEVEL_VERY_EXPENSIVE':
        return 4
      default:
        return null
    }
  }
  return null
}

async function geocodePostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', postcode)
  url.searchParams.set('region', 'uk')
  url.searchParams.set('key', PLACES_API_KEY as string)
  const res = await fetch(url.toString())
  if (!res.ok) {
    // fallback to Places text search without bias
    const alt = await placesSearchText(undefined, undefined, undefined as any, postcode, 1)
    const first = alt[0]
    if (first?.location?.latitude && first?.location?.longitude) {
      return { lat: first.location.latitude, lng: first.location.longitude }
    }
    return null
  }
  const data = await res.json()
  const loc = data?.results?.[0]?.geometry?.location
  if (!loc) {
    const alt = await placesSearchText(undefined, undefined, undefined as any, postcode, 1)
    const first = alt[0]
    if (first?.location?.latitude && first?.location?.longitude) {
      return { lat: first.location.latitude, lng: first.location.longitude }
    }
    return null
  }
  return { lat: loc.lat, lng: loc.lng }
}

async function placesSearchNearby(lat: number, lng: number, radiusMeters: number, includedTypes: string[], maxResults: number) {
  const endpoint = 'https://places.googleapis.com/v1/places:searchNearby'
  const body = {
    includedTypes,
    maxResultCount: Math.max(1, Math.min(maxResults, 20)),
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radiusMeters,
      },
    },
  }
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': PLACES_API_KEY as string,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.types',
        'places.formattedAddress',
        'places.location',
        'places.rating',
        'places.userRatingCount',
        'places.priceLevel',
        'places.websiteUri',
        'places.nationalPhoneNumber',
        'places.businessStatus',
        'places.googleMapsUri',
        'places.parkingOptions',
      ].join(','),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text().catch(()=> '')
    console.error('placesSearchNearby error', res.status, t)
    return []
  }
  const data = await res.json()
  return (data?.places ?? []) as any[]
}

async function placesSearchText(lat?: number, lng?: number, radiusMeters?: number, textQuery?: string, maxResults: number = 10) {
  const endpoint = 'https://places.googleapis.com/v1/places:searchText'
  const body = {
    textQuery,
    maxResultCount: Math.max(1, Math.min(maxResults, 20)),
    ...(lat && lng && radiusMeters ? { locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters } } } : {}),
  }
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': PLACES_API_KEY as string,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.types',
        'places.formattedAddress',
        'places.location',
        'places.rating',
        'places.userRatingCount',
        'places.priceLevel',
        'places.websiteUri',
        'places.nationalPhoneNumber',
        'places.businessStatus',
        'places.googleMapsUri',
        'places.parkingOptions',
      ].join(','),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text().catch(()=> '')
    console.error('placesSearchText error', res.status, t)
    return []
  }
  const data = await res.json()
  return (data?.places ?? []) as any[]
}

export async function refreshReportLocations(reportId: string, postcodes: string[], cfg: FetchConfig) {
  if (!PLACES_API_KEY) {
    return { ok: false, reason: 'no_api_key' as const }
  }
  const radiusMeters = milesToMeters(cfg.radiusMiles)
  for (const pc of postcodes) {
    // Geocode postcode
    const geo = await geocodePostcode(pc)
    const loc = await prisma.reportLocation.upsert({
      where: { reportId_postcode: { reportId, postcode: pc } },
      update: { radiusMeters, params: { maxPerType: cfg.maxPerType } },
      create: { reportId, postcode: pc, radiusMeters },
    } as any)
    if (!geo) continue
    await prisma.reportLocation.update({ where: { id: (loc as any).id }, data: { latitude: geo.lat, longitude: geo.lng, lastFetchedAt: new Date() } })

    // For each category, fetch by includedTypes or keywords
    for (const cat of PLACE_CATEGORIES) {
      let results: any[] = []
      if (cat.includedTypes && cat.includedTypes.length > 0) {
        results = await placesSearchNearby(geo.lat, geo.lng, radiusMeters, cat.includedTypes, cfg.maxPerType)
      } else {
        // Take the first keyword only to limit cost in testing
        const kw = cat.keywords[0]
        results = kw ? await placesSearchText(geo.lat, geo.lng, radiusMeters, kw, cfg.maxPerType) : []
      }
      for (const p of results) {
        const placeId: string | undefined = p.id || p.placeId
        if (!placeId) continue
        const types: string[] = p.types || []
        const group = groupForPlace(types, p.displayName?.text || p.displayName || '') || cat.group
        const createdPlace = await prisma.place.upsert({
          where: { placeId },
          update: {
            name: p.displayName?.text || p.displayName || 'Unknown',
            types: JSON.stringify(types),
            rating: p.rating ?? null,
            priceLevel: normalizePriceLevel(p.priceLevel),
            lat: p.location?.latitude ?? null,
            lng: p.location?.longitude ?? null,
            address: p.formattedAddress ?? null,
            website: p.websiteUri ?? null,
            phone: p.nationalPhoneNumber ?? null,
            status: p.businessStatus ?? null,
            parkingOptions: p.parkingOptions ?? null,
            raw: p,
          },
          create: {
            placeId,
            name: p.displayName?.text || p.displayName || 'Unknown',
            types: JSON.stringify(types),
            rating: p.rating ?? null,
            priceLevel: normalizePriceLevel(p.priceLevel),
            lat: p.location?.latitude ?? null,
            lng: p.location?.longitude ?? null,
            address: p.formattedAddress ?? null,
            website: p.websiteUri ?? null,
            phone: p.nationalPhoneNumber ?? null,
            status: p.businessStatus ?? null,
            parkingOptions: p.parkingOptions ?? null,
            raw: p,
          },
        })
        // link to location if not exists
        try {
          await prisma.reportLocationPlace.create({
            data: {
              locationId: (loc as any).id,
              placeId: (createdPlace as any).id,
              groupedCategory: group,
              matchedKeyword: (cat.includedTypes && cat.includedTypes.length > 0) ? undefined : (cat.keywords[0] || undefined),
            },
          })
        } catch (e) {
          // ignore duplicates due to unique constraint
        }
      }
    }
  }
  return { ok: true as const }
}


