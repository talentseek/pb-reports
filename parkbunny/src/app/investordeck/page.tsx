import { Metadata } from 'next'
import InvestorDeck from './InvestorDeck'

export const metadata: Metadata = {
    title: 'ParkBunny — Investor Presentation',
    description: 'Confidential investor presentation for ParkBunny Ltd.',
    robots: 'noindex, nofollow',
}

export default function InvestorDeckPage() {
    return <InvestorDeck />
}
