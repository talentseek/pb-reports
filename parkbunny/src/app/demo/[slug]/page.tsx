import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { transformToConfig } from '@/lib/demo-transform'
import { enrichDeals } from '@/lib/demo-places'
import ClientDemo from './ClientDemo'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const demo = await prisma.appDemo.findUnique({ where: { slug: params.slug } })
    if (!demo) return { title: 'Demo Not Found' }

    return {
        title: `${demo.operatorName} × ParkBunny — Interactive Demo`,
        description: demo.operatorTagline,
        robots: 'noindex, nofollow',
    }
}

export default async function DemoPage({ params }: { params: { slug: string } }) {
    const demo = await prisma.appDemo.findUnique({ where: { slug: params.slug } })
    if (!demo) return notFound()

    const config = transformToConfig(demo)

    // Geocode if lat/lng not pre-set
    let lat = config.location.lat
    let lng = config.location.lng

    if (!lat || !lng) {
        try {
            const res = await fetch(
                `https://api.postcodes.io/postcodes/${encodeURIComponent(config.location.postcode)}`
            )
            const data = await res.json()
            if (data.status === 200 && data.result) {
                lat = data.result.latitude
                lng = data.result.longitude
            }
        } catch {
            lat = 51.5074
            lng = -0.1278
        }
    }

    const configWithGeo = {
        ...config,
        location: { ...config.location, lat, lng },
    }

    const enrichedDeals = await enrichDeals(configWithGeo)

    return <ClientDemo config={configWithGeo} enrichedDeals={enrichedDeals} />
}
