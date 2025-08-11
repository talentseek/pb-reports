import prisma from '@/lib/db'

export type LocationSummary = {
  id: string
  postcode: string
  latitude: number | null
  longitude: number | null
  countsByCategory: { category: string; count: number }[]
  totalPlaces: number
}

export async function getReportLocationSummaries(reportId: string): Promise<LocationSummary[]> {
  const locations = await prisma.reportLocation.findMany({
    where: { reportId },
    include: { places: true },
    orderBy: { postcode: 'asc' },
  })
  return locations.map((loc) => {
    const counts = new Map<string, number>()
    for (const link of loc.places) {
      const cat = link.groupedCategory || 'Uncategorized'
      counts.set(cat, (counts.get(cat) || 0) + 1)
    }
    const countsByCategory = Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
    return {
      id: loc.id,
      postcode: loc.postcode,
      latitude: loc.latitude ?? null,
      longitude: loc.longitude ?? null,
      countsByCategory,
      totalPlaces: loc.places.length,
    }
  })
}


