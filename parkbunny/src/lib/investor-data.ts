// ParkBunny Investor Deck — Static Data
// All figures sourced from ParkBunny-Investor-Deck-V6-JANUARY26.pdf

export interface TeamMember {
    name: string
    role: string
    initials: string
    credentials: string[]
}

export interface Partner {
    name: string
    description: string
    sites?: string
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
    raiseAmount: '£1M',
    equity: '20%',
    valuation: '£5M pre-money',
}

export const TRACTION = {
    liveSites: '40+',
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
    'Unlock Instant Local Deals every time they park',
    'Parking becomes rewarding, not just a cost',
]

export const SOLUTION_OPERATORS = [
    'Direct in-app communication with drivers',
    'Real-time control of tariffs & occupancy',
    'Transparent 1.5% fee + 20p convenience',
    'Comprehensive dashboard: usage, dwell time, repeat visits',
    'Local Business Activation to fill underutilised spaces',
]

export const HOW_IT_WORKS = [
    { step: 1, title: 'Park', description: 'Driver pays via ParkBunny — fast, cashless, seamless' },
    { step: 2, title: 'Discover', description: 'Instant deals from nearby businesses appear automatically' },
    { step: 3, title: 'Earn', description: 'Drivers get rewards. Businesses get footfall. Operators get revenue.' },
]

export const REVENUE_MODEL = {
    perSession: '1.5% + 20p',
    rewardsSubscription: '£10/month per retailer',
    shoppingCentreAnnual: '£20,500',
    payAndDisplayAnnual: '£7,167',
    projectedNetRevenue: '£1M+',
    currentMonthlyRev: '£1,949',
    breakeven: 'April 2026',
    overheadMonthly: '£14,500',
}

export const PATH_TO_1M = {
    target: '£995,244',
    mix: [
        { type: '15 Shopping Centres', revenue: '£307,500' },
        { type: '20 × 200-space P&D', revenue: '£286,560' },
        { type: '20 × 100-space P&D', revenue: '£143,280' },
        { type: '12 × 300-space P&D', revenue: '£257,904' },
    ],
    breakevenPipeline: [
        { name: 'Midsummer Place (Savills)', revenue: '£1,708', type: 'Shopping Centre' },
        { name: 'The Bridges Sunderland (LCP)', revenue: '£1,708', type: 'Shopping Centre' },
        { name: 'The Rock (Euro)', revenue: '£1,708', type: 'Shopping Centre' },
        { name: 'Bradford (Agena) 300 space', revenue: '£1,795', type: 'Pay & Display' },
        { name: 'Wimbledon (Euro) 300 space', revenue: '£1,795', type: 'Pay & Display' },
        { name: 'Shrewsbury (Intelli) 300 space', revenue: '£1,795', type: 'Pay & Display' },
        { name: 'Portsmouth (Newpark) 300 space', revenue: '£1,795', type: 'Pay & Display' },
        { name: 'Pitsea (Agena) 100 space', revenue: '£597', type: 'Pay & Display' },
    ],
}

export const ADDITIONAL_STREAMS: RevenueStream[] = [
    { name: 'Last Mile Logistics Lockers', annual: '£10,800', detail: 'Parcel & click-and-collect lockers. Passive income from rental fees.' },
    { name: 'Digital Signage', annual: '£13,400', detail: '15 deals network. In-app and physical signage revenue.' },
    { name: 'Waterless Car Wash', annual: '£6,200', detail: '8 sites. Self-service, zero maintenance.' },
    { name: 'Film Production', annual: 'Variable', detail: 'Partnerships with Netflix, Marvel & more. Car parks as filming locations.' },
    { name: 'Pop-Up Retail & Events', annual: 'Variable', detail: 'Brand activations, farmers markets, event parking.' },
    { name: 'EV Charging', annual: '£24,528/site', detail: 'Phased rollout with Emerge Renewable Solutions.' },
]

export const PARTNERS: Partner[] = [
    { name: 'Savills', description: 'Leading commercial property agent', sites: '80+ shopping centres' },
    { name: 'Euro Car Parks', description: 'Major UK parking operator', sites: '800+ sites' },
    { name: 'LCP', description: 'Property management', sites: 'Shopping centres' },
    { name: 'Agena Group', description: 'Parking management', sites: 'Multiple P&D sites' },
    { name: 'IntelliPark', description: 'Smart parking solutions', sites: '2,000+ sites' },
    { name: 'YourParkingSpace', description: 'Parking marketplace', sites: '100+ locations' },
    { name: 'Smart Parking', description: 'Parking technology', sites: '80+ sites' },
    { name: 'NSL', description: 'Parking enforcement', sites: '80% UK councils' },
    { name: 'Newpark', description: 'Car park operator', sites: 'Multiple sites' },
]

export const TEAM: TeamMember[] = [
    {
        name: 'Jon Sprank',
        role: 'Co-Founder & CEO',
        initials: 'JS',
        credentials: [
            'Ex Head of Sales at JustPark — onboarded 100,000+ spaces in under 2 years',
            'Ex European Sales Director at iZettle (2-time unicorn)',
            'Royal Navy Veteran',
        ],
    },
    {
        name: 'Chris Smith',
        role: 'Co-Founder & CTO',
        initials: 'CS',
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
        credentials: [
            'MSc in Strategic Marketing',
            'Expert in digital campaigns, brand growth & SEO',
            'Bilingual communicator across diverse markets',
        ],
    },
]

export const INVESTMENT = {
    amount: '£1M',
    equity: '20%',
    valuation: '£5M pre-money',
    alternative: '£500K for 10%',
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
