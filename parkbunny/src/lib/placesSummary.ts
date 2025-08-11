import prisma from '@/lib/db'

export type LocationSummary = {
  id: string
  postcode: string
  latitude: number | null
  longitude: number | null
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
    const allCats = new Set<string>([...totalCounts.keys(), ...includedCounts.keys()])
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
      countsByCategory,
      totalPlaces: loc.places.length,
      totalIncluded,
    }
  })
}


