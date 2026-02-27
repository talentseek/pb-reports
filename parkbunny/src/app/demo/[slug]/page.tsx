import { notFound } from 'next/navigation'
import { getDemoConfig } from '@/lib/demo-configs'
import { enrichDeals } from '@/lib/demo-places'
import ClientDemo from './ClientDemo'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const config = getDemoConfig(params.slug)
    if (!config) return { title: 'Demo Not Found' }

    return {
        title: `${config.operator.name} × ParkBunny — Interactive Demo`,
        description: config.operator.tagline,
        robots: 'noindex, nofollow',
    }
}

export default async function DemoPage({ params }: { params: { slug: string } }) {
    const config = getDemoConfig(params.slug)
    if (!config) return notFound()

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
            // Use defaults
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
