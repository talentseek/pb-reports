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

async function geocodePostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', postcode)
  url.searchParams.set('region', 'uk')
  url.searchParams.set('key', PLACES_API_KEY as string)
  const res = await fetch(url.toString())
  if (!res.ok) return null
  const data = await res.json()
  const loc = data?.results?.[0]?.geometry?.location
  if (!loc) return null
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
      ].join(','),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data?.places ?? []) as any[]
}

async function placesSearchText(lat: number, lng: number, radiusMeters: number, textQuery: string, maxResults: number) {
  const endpoint = 'https://places.googleapis.com/v1/places:searchText'
  const body = {
    textQuery,
    maxResultCount: Math.max(1, Math.min(maxResults, 20)),
    locationBias: {
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
      ].join(','),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) return []
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
            priceLevel: p.priceLevel ?? null,
            lat: p.location?.latitude ?? null,
            lng: p.location?.longitude ?? null,
            address: p.formattedAddress ?? null,
            website: p.websiteUri ?? null,
            phone: p.nationalPhoneNumber ?? null,
            status: p.businessStatus ?? null,
            raw: p,
          },
          create: {
            placeId,
            name: p.displayName?.text || p.displayName || 'Unknown',
            types: JSON.stringify(types),
            rating: p.rating ?? null,
            priceLevel: p.priceLevel ?? null,
            lat: p.location?.latitude ?? null,
            lng: p.location?.longitude ?? null,
            address: p.formattedAddress ?? null,
            website: p.websiteUri ?? null,
            phone: p.nationalPhoneNumber ?? null,
            status: p.businessStatus ?? null,
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


