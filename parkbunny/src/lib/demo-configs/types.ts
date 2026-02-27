export type DemoConfig = {
    slug: string
    operator: {
        name: string
        tagline: string
        logo: string
        logoAlt?: string
        colors: {
            primary: string
            secondary: string
            accent: string
            background: string
            text: string
            cardBg: string
        }
        font: string
    }
    location: {
        name: string
        address: string
        postcode: string
        phone: string
        locationCode: string
        city: string
        totalSpaces: number
        hourlyRate: number
        lat?: number
        lng?: number
    }
    deals: DemoDeal[]
    partnerView: {
        baselineRevenue: number
        projectedUplift: number
        avgDwellIncrease: number
        partnerEngagement: number
        driverRetention: number
        dealsRedeemed: number
        footfallConversion: number
    }
}

export type DemoDeal = {
    id: string
    brand: string
    logo: string
    offer: string
    category: 'food_and_drink' | 'entertainment' | 'shopping' | 'services'
    savingsValue: string
    expiryMinutes: number
    placeQuery: string
    redeemInstructions: string
    termsAndConditions: string
    color: string
}

export type EnrichedDeal = DemoDeal & {
    distance: string
    nearestAddress: string
}
