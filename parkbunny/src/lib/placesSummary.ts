import prisma from '@/lib/db'

export type LocationSummary = {
  id: string
  postcode: string
  latitude: number | null
  longitude: number | null
  status: 'PENDING' | 'LIVE'
  countsByCategory: { category: string; total: number; included: number }[]
  totalPlaces: number
  totalIncluded: number
}

export async function getReportLocationSummaries(reportId: string): Promise<LocationSummary[]> {
  const locations = await prisma.reportLocation.findMany({
    where: { reportId },
    include: { places: true },
    orderBy: { postcode: 'asc' },
  })
  return locations.map((loc) => {
    const totalCounts = new Map<string, number>()
    const includedCounts = new Map<string, number>()
    for (const link of loc.places) {
      const cat = link.groupedCategory || 'Uncategorized'
      totalCounts.set(cat, (totalCounts.get(cat) || 0) + 1)
      if (link.included) includedCounts.set(cat, (includedCounts.get(cat) || 0) + 1)
    }
    const allCats = new Set<string>()
    totalCounts.forEach((_v, k) => allCats.add(k))
    includedCounts.forEach((_v, k) => allCats.add(k))
    const countsByCategory = Array.from(allCats).map((category) => ({
      category,
      total: totalCounts.get(category) || 0,
      included: includedCounts.get(category) || 0,
    })).sort((a, b) => b.included - a.included || b.total - a.total)
    const totalIncluded = loc.places.filter((p) => p.included).length
    return {
      id: loc.id,
      postcode: loc.postcode,
      latitude: loc.latitude ?? null,
      longitude: loc.longitude ?? null,
      status: loc.status,
      countsByCategory,
      totalPlaces: loc.places.length,
      totalIncluded,
    }
  })
}

export type LocationMarker = { lat: number; lng: number; title: string; category: string }

export async function getMarkersForLocation(reportId: string, postcode: string): Promise<LocationMarker[]> {
  const location = await prisma.reportLocation.findFirst({
    where: { reportId, postcode },
    include: { places: { where: { included: true }, include: { place: true } } },
  })
  if (!location) return []
  const markers: LocationMarker[] = []
  for (const link of location.places) {
    const lat = link.place.lat
    const lng = link.place.lng
    if (typeof lat === 'number' && typeof lng === 'number') {
      markers.push({ lat, lng, title: link.place.name, category: link.groupedCategory || 'Uncategorized' })
    }
  }
  return markers
}


