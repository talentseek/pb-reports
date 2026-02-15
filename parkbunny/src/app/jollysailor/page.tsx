import { Metadata } from 'next'
import JollySailor from './JollySailor'

export const metadata: Metadata = {
    title: 'JollySailor — Marina Platform Demo',
    description: 'Interactive marina booking and services platform concept by ParkBunny.',
    robots: 'noindex, nofollow',
}

export default function JollySailorPage() {
    return <JollySailor />
}
