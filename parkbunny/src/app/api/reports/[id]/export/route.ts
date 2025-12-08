import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { userId } = await auth()
    if (!userId) return new Response('Unauthorized', { status: 401 })

    try {
        const report = await prisma.report.findFirst({
            where: { id: params.id },
        })
        if (!report) return new Response('Not found', { status: 404 })

        // Get all locations with their places
        const locations = await prisma.reportLocation.findMany({
            where: { reportId: report.id },
            include: {
                places: {
                    include: {
                        place: true,
                    },
                },
            },
            orderBy: { postcode: 'asc' },
        })

        // Format the export data
        const exportData = {
            report: {
                id: report.id,
                name: report.name,
                postcodes: report.postcodes,
                createdAt: report.createdAt,
            },
            locations: locations.map((loc) => ({
                id: loc.id,
                postcode: loc.postcode,
                latitude: loc.latitude,
                longitude: loc.longitude,
                status: loc.status,
                radiusMeters: loc.radiusMeters,
                lastFetchedAt: loc.lastFetchedAt,
                businesses: loc.places.map((link) => ({
                    id: link.place.id,
                    placeId: link.place.placeId,
                    name: link.place.name,
                    category: link.groupedCategory || 'Uncategorized',
                    included: link.included,
                    types: (() => {
                        try {
                            return JSON.parse(link.place.types || '[]')
                        } catch {
                            return []
                        }
                    })(),
                    address: link.place.address,
                    phone: link.place.phone,
                    website: link.place.website,
                    rating: link.place.rating,
                    priceLevel: link.place.priceLevel,
                    latitude: link.place.lat,
                    longitude: link.place.lng,
                    businessStatus: link.place.status,
                    googleMapsUrl: ((link.place.raw as any)?.googleMapsUri) || null,
                })),
            })),
            exportedAt: new Date().toISOString(),
        }

        return new Response(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${report.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'report'}_export.json"`,
            },
        })
    } catch (e: any) {
        console.error('Export error', e)
        return new Response(e?.message || 'Internal Error', { status: 500 })
    }
}
