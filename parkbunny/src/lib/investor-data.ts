// ParkBunny Investor Deck — Static Data
// Updated Feb 2026 with CEO feedback

export interface TeamMember {
    name: string
    role: string
    initials: string
    photo: string
    credentials: string[]
}

export interface Partner {
    name: string
    description: string
    sites?: string
    logo?: string
}

export interface RevenueStream {
    name: string
    annual: string
    detail: string
}

export const DECK_PASSWORD = 'parkbunny2026'

export const HERO = {
    headline: 'Parking that rewards drivers.',
    subheadline: 'Technology that drives revenue.',
    tagline: 'A platform built for the future of real-estate activation.',
    raiseAmount: '£400k',
    valuation: '£4M pre-money',
}

export const TRACTION = {
    liveSites: '50+',
    pipeline: '150+',
    councilCoverage: '80%',
    shoppingCentres: '60',
    retailers: '7,000+',
    monthOnMonthGrowth: '32%',
    dailyParkingEvents: '68M',
    ukCarParks: '17,000+',
}

export const PROBLEM_DRIVERS = [
    'Clunky, outdated interfaces with too many steps',
    'No rewards, no perks — parking feels like a penalty',
    'No reason to return to the same car park',
]

export const PROBLEM_OPERATORS = [
    'No way to communicate with drivers once parked',
    'No tools to increase footfall or repeat visits',
    'Rigid pricing that can\'t adapt to demand',
    'High provider fees with minimal added value',
    'Underutilised spaces = lost revenue',
]

export const SOLUTION_DRIVERS = [
    'Fast, simple payments through an intuitive app',
    'Hyperlocal discounts from nearby businesses — food, retail, beauty & fitness',
    'Parking becomes rewarding, not just a cost',
]

export const SOLUTION_OPERATORS = [
    'Direct in-app communication with drivers',
    'Real-time control of tariffs & occupancy',
    'Transparent 1.5% fee + 20p convenience',
    'Comprehensive dashboard: usage, dwell time, repeat visits',
    'AI-driven hyperlocal outreach to hotels, gyms & offices — offering discounted tariffs in return for promoting the car park to their guests, members and staff',
]

export const HOW_IT_WORKS = [
    { step: 1, title: 'Park', description: 'Driver pays via ParkBunny — fast, cashless, seamless' },
    { step: 2, title: 'Discover', description: 'Instant deals from nearby businesses appear automatically' },
    { step: 3, title: 'Earn', description: 'Drivers get rewards. Businesses get footfall. Operators get revenue.' },
]

export const BUSINESS_ACTIVATION = {
    headline: 'Supporting Independent Retailers',
    subtitle: 'Hyperlocal discounts that turn a new customer into a regular customer',
    description: 'Drivers receive instant deals from local businesses the moment they park. Food, retail, beauty and fitness rewards — giving independent retailers the chance to turn a new customer into a regular customer.',
    aiOutreach: 'AI-driven hyperlocal outreach to Hotels, Gyms, Offices and more — offering discounted tariffs in return for promoting the car park to their guests, members and staff.',
}

export const REVENUE_SIMPLIFIED = {
    breakeven: 'April 2026',
    runRate: '£18.5k',
    perSite150: '£7k',
    perSiteLabel: '150-space car park',
    targetRevenue: '£1M',
    targetSites: '142',
    partnerSites: '10,000+',
    portfolioPercent: '1.42%',
    shoppingCentreMultiple: '4–6×',
    shoppingCentreNote: 'a 150-space car park in revenue',
    perSession: '1.5% + 20p',
    rewardsSubscription: '£10/month per retailer',
}

export const ADDITIONAL_STREAMS: RevenueStream[] = [
    { name: 'Lockers', annual: '£1k – £500k', detail: 'Depending on size of portfolio. Parcel & click-and-collect lockers for underutilised areas.' },
    { name: 'Digital Signage', annual: '£10k – £40k', detail: 'In-app and physical signage revenue from car park assets.' },
    { name: 'Waterless Car Wash', annual: '£10k – £30k', detail: 'Self-service, zero maintenance. Revenue from underutilised car park areas.' },
    { name: 'EV Charging', annual: 'Variable', detail: 'Phased rollout. Revenue share or CAPEX options.' },
]

export const COMMISSION_NOTE = 'ParkBunny earns a minimum of 10% of this revenue for the duration of these contracts.'

export const TRACK_RECORD = {
    headline: 'We\'ve done this before',
    detail: 'Our CEO added 100,000 spaces to the JustPark platform in under two years — the equivalent of 600+ car parks.',
}

export const AI_OPERATIONS = {
    headline: 'AI-First Operations',
    subtitle: 'Why we\'re not hiring big teams',
    points: [
        'AI-powered support lines handle customer queries 24/7',
        'Automated SDR functions for retailer acquisition at scale',
        'AI-driven outreach via b2bee.ai — our proprietary platform',
        'Lean team of 5 delivers what traditionally requires 15–20 people',
        'Keeps burn rate low and capital efficiency high',
        'More runway per £ invested',
    ],
}

export const PARTNERS: Partner[] = [
    { name: 'Savills', description: 'Leading commercial property agent', sites: '80+ shopping centres', logo: '/savills-logo.png' },
    { name: 'Euro Car Parks', description: 'Major UK parking operator', sites: '800+ sites', logo: '/euro-car-parks.png' },
    { name: 'M Core', description: 'Property management', sites: 'Shopping centres', logo: '/m-core-property.png' },
    { name: 'Agena Group', description: 'Parking management', sites: 'Multiple P&D sites', logo: '/agena-group.png' },
    { name: 'IntelliPark', description: 'Smart parking solutions', sites: '2,000+ sites', logo: '/intelli.png' },
    { name: 'NSL', description: 'Parking enforcement', sites: '80% UK councils', logo: '/nsl-logo.svg' },
    { name: 'Newpark', description: 'Car park operator', sites: 'Multiple sites', logo: '/newpark-solutions.png' },
    { name: 'Anchor Group', description: 'Parking operator', sites: 'National network', logo: '/anchor-group-services.png' },
    { name: 'ParkBee', description: 'Smart parking marketplace', sites: 'Premium locations', logo: '/parkbee-logo.png' },
    { name: 'Group Nexus', description: 'Parking management group', sites: 'Multi-brand operator', logo: '/groupnexus.jpeg' },
    { name: 'Wise Parking', description: 'Parking management', sites: 'Regional network', logo: '/wise-parking.png' },
    { name: 'Britannia Parking', description: 'National parking operator', sites: 'Nationwide coverage', logo: '/britannia-parking.png' },
]

export const TEAM: TeamMember[] = [
    {
        name: 'Jon Sprank',
        role: 'Co-Founder & CEO',
        initials: 'JS',
        photo: '/team/jon-headshot.jpg',
        credentials: [
            'Ex Head of Sales at JustPark — onboarded 100,000+ spaces in under 2 years',
            'Ex European Sales Director at iZettle (acquired by PayPal for $2.2B)',
            'Royal Navy Veteran',
        ],
    },
    {
        name: 'Chris Smith',
        role: 'Co-Founder & CTO',
        initials: 'CS',
        photo: '/team/chris-smith.png',
        credentials: [
            'Veteran technology executive and product strategist',
            'Former CTO/Technical Director across multiple ventures',
            'Leads ParkBunny tech & AI development',
        ],
    },
    {
        name: 'Russell Grigg',
        role: 'Co-Founder & COO',
        initials: 'RG',
        photo: '/team/russell-grigg.png',
        credentials: [
            'Ex Lead Vision Systems Engineer at Sony',
            '20+ years delivering tech-driven solutions in parking',
            'Major projects: Parking, Defence, Pharma & Manufacturing',
        ],
    },
    {
        name: 'Mark Cushing',
        role: 'Co-Founder & VP Sales',
        initials: 'MC',
        photo: '/team/mark-cushing.png',
        credentials: [
            'Account Management & Direct Sales specialist',
            'Electronic Security (ANPR, CCTV, Access Control)',
            'Deep parking industry relationships',
        ],
    },
    {
        name: 'Ana Elena González',
        role: 'CMO',
        initials: 'AG',
        photo: '/team/ana-gonzalez.png',
        credentials: [
            'MSc in Strategic Marketing',
            'Expert in digital campaigns, brand growth & SEO',
            'Bilingual communicator across diverse markets',
        ],
    },
]

export const INVESTMENT = {
    amount: '£400k',
    valuation: '£4M pre-money',
    useOfFunds: [
        { label: 'Core team — product, ops, commercial hires', percent: 35 },
        { label: 'Scale from 50+ to 150+ live car parks', percent: 25 },
        { label: 'Activate £1M+ revenue pipeline', percent: 20 },
        { label: 'Expand retailer rewards & AI outreach', percent: 10 },
        { label: 'Deliver pilots with major operators & councils', percent: 10 },
    ],
}

export const INTERNATIONAL = {
    usTarget: 'Los Angeles',
    usRationale: 'Highly fragmented parking market, lagging in unified payment and rewards technology.',
    europeRationale: 'Focus on regions with strong smart city adoption and high B2B appetite.',
}
