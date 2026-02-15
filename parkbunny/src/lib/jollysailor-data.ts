// JollySailor Marina Platform — Mock Data
// All data is static for demo/pitch purposes

export const DECK_PASSWORD = 'jollysailor2026'

export const TABS = [
    { id: 'mooring', label: 'Mooring', icon: 'MapPin' },
    { id: 'social', label: 'Social Bee', icon: 'Megaphone' },
    { id: 'services', label: 'Services', icon: 'Wrench' },
    { id: 'rewards', label: 'Rewards', icon: 'Gift' },
    { id: 'loyalty', label: 'Loyalty', icon: 'Star' },
] as const

export type TabId = typeof TABS[number]['id']

export interface Berth {
    id: string
    dock: 'A' | 'B' | 'C'
    number: number
    size: 'S' | 'M' | 'L'
    maxLength: string
    status: 'available' | 'occupied' | 'maintenance'
    x: number
    y: number
    basePrice: number
    amenities: string[]
}

export const BERTHS: Berth[] = [
    // Dock A (top) — 8 berths
    { id: 'A-01', dock: 'A', number: 1, size: 'S', maxLength: '25ft', status: 'available', x: 80, y: 60, basePrice: 28, amenities: ['Power', 'Water'] },
    { id: 'A-02', dock: 'A', number: 2, size: 'S', maxLength: '25ft', status: 'occupied', x: 155, y: 60, basePrice: 28, amenities: ['Power', 'Water'] },
    { id: 'A-03', dock: 'A', number: 3, size: 'M', maxLength: '35ft', status: 'available', x: 230, y: 60, basePrice: 42, amenities: ['Power', 'Water', 'WiFi'] },
    { id: 'A-04', dock: 'A', number: 4, size: 'M', maxLength: '35ft', status: 'available', x: 305, y: 60, basePrice: 42, amenities: ['Power', 'Water', 'WiFi'] },
    { id: 'A-05', dock: 'A', number: 5, size: 'L', maxLength: '50ft', status: 'occupied', x: 380, y: 60, basePrice: 65, amenities: ['Power', 'Water', 'WiFi', 'Pump-out'] },
    { id: 'A-06', dock: 'A', number: 6, size: 'L', maxLength: '50ft', status: 'available', x: 455, y: 60, basePrice: 65, amenities: ['Power', 'Water', 'WiFi', 'Pump-out'] },
    { id: 'A-07', dock: 'A', number: 7, size: 'S', maxLength: '25ft', status: 'available', x: 530, y: 60, basePrice: 28, amenities: ['Power'] },
    { id: 'A-08', dock: 'A', number: 8, size: 'M', maxLength: '35ft', status: 'maintenance', x: 605, y: 60, basePrice: 42, amenities: ['Power', 'Water', 'WiFi'] },
    // Dock B (middle) — 8 berths
    { id: 'B-01', dock: 'B', number: 1, size: 'M', maxLength: '35ft', status: 'available', x: 80, y: 180, basePrice: 42, amenities: ['Power', 'Water', 'WiFi'] },
    { id: 'B-02', dock: 'B', number: 2, size: 'L', maxLength: '50ft', status: 'occupied', x: 155, y: 180, basePrice: 65, amenities: ['Power', 'Water', 'WiFi', 'Pump-out'] },
    { id: 'B-03', dock: 'B', number: 3, size: 'M', maxLength: '35ft', status: 'available', x: 230, y: 180, basePrice: 42, amenities: ['Power', 'Water', 'WiFi'] },
    { id: 'B-04', dock: 'B', number: 4, size: 'S', maxLength: '25ft', status: 'available', x: 305, y: 180, basePrice: 28, amenities: ['Power', 'Water'] },
    { id: 'B-05', dock: 'B', number: 5, size: 'L', maxLength: '50ft', status: 'occupied', x: 380, y: 180, basePrice: 65, amenities: ['Power', 'Water', 'WiFi', 'Pump-out'] },
    { id: 'B-06', dock: 'B', number: 6, size: 'M', maxLength: '35ft', status: 'available', x: 455, y: 180, basePrice: 42, amenities: ['Power', 'Water', 'WiFi'] },
    { id: 'B-07', dock: 'B', number: 7, size: 'S', maxLength: '25ft', status: 'occupied', x: 530, y: 180, basePrice: 28, amenities: ['Power'] },
    { id: 'B-08', dock: 'B', number: 8, size: 'L', maxLength: '50ft', status: 'available', x: 605, y: 180, basePrice: 65, amenities: ['Power', 'Water', 'WiFi', 'Pump-out'] },
    // Dock C (bottom) — 8 berths
    { id: 'C-01', dock: 'C', number: 1, size: 'L', maxLength: '50ft', status: 'available', x: 80, y: 300, basePrice: 65, amenities: ['Power', 'Water', 'WiFi', 'Pump-out'] },
    { id: 'C-02', dock: 'C', number: 2, size: 'L', maxLength: '50ft', status: 'occupied', x: 155, y: 300, basePrice: 65, amenities: ['Power', 'Water', 'WiFi', 'Pump-out'] },
    { id: 'C-03', dock: 'C', number: 3, size: 'M', maxLength: '35ft', status: 'available', x: 230, y: 300, basePrice: 42, amenities: ['Power', 'Water', 'WiFi'] },
    { id: 'C-04', dock: 'C', number: 4, size: 'S', maxLength: '25ft', status: 'available', x: 305, y: 300, basePrice: 28, amenities: ['Power', 'Water'] },
    { id: 'C-05', dock: 'C', number: 5, size: 'M', maxLength: '35ft', status: 'occupied', x: 380, y: 300, basePrice: 42, amenities: ['Power', 'Water', 'WiFi'] },
    { id: 'C-06', dock: 'C', number: 6, size: 'S', maxLength: '25ft', status: 'available', x: 455, y: 300, basePrice: 28, amenities: ['Power'] },
    { id: 'C-07', dock: 'C', number: 7, size: 'M', maxLength: '35ft', status: 'available', x: 530, y: 300, basePrice: 42, amenities: ['Power', 'Water', 'WiFi'] },
    { id: 'C-08', dock: 'C', number: 8, size: 'L', maxLength: '50ft', status: 'available', x: 605, y: 300, basePrice: 65, amenities: ['Power', 'Water', 'WiFi', 'Pump-out'] },
]

export const PRICING_DEFAULTS = {
    baseMultiplier: 1.0,
    highDemandSurcharge: 20,
    weatherMultiplier: 1.0,
    seasonalRate: 'mid' as 'low' | 'mid' | 'high',
    occupancyPercent: 72,
}

export const SEASONAL_MULTIPLIERS = { low: 0.8, mid: 1.0, high: 1.4 }

export interface SocialPost {
    id: number
    platform: 'facebook' | 'instagram' | 'twitter'
    content: string
    scheduledDate: string
    scheduledTime: string
    engagement: { likes: number; comments: number; shares: number }
    image?: string
}

export const SOCIAL_POSTS: SocialPost[] = [
    { id: 1, platform: 'instagram', content: 'Summer berths are filling up fast! ☀️ Book yours today and enjoy 10% off early reservations...', scheduledDate: 'Mon', scheduledTime: '09:00', engagement: { likes: 142, comments: 18, shares: 23 } },
    { id: 2, platform: 'facebook', content: 'New boat cleaning service now available! Professional detailing at competitive prices...', scheduledDate: 'Mon', scheduledTime: '14:00', engagement: { likes: 87, comments: 12, shares: 8 } },
    { id: 3, platform: 'twitter', content: 'Storm coming this weekend? Our sheltered berths have you covered. Dynamic pricing adjusted for safety. ⛵', scheduledDate: 'Tue', scheduledTime: '10:30', engagement: { likes: 56, comments: 7, shares: 31 } },
    { id: 4, platform: 'instagram', content: 'Meet our new loyalty program! Every overnight stay earns you a stamp towards a FREE night...', scheduledDate: 'Wed', scheduledTime: '11:00', engagement: { likes: 203, comments: 34, shares: 45 } },
    { id: 5, platform: 'facebook', content: 'Customer spotlight: "Best marina app we have ever used!" — Captain Roberts, SV Wanderer...', scheduledDate: 'Thu', scheduledTime: '08:00', engagement: { likes: 167, comments: 22, shares: 19 } },
    { id: 6, platform: 'twitter', content: 'Weekend deals unlocking tomorrow for all booked guests! Check your Rewards tab. 🎁', scheduledDate: 'Fri', scheduledTime: '16:00', engagement: { likes: 94, comments: 11, shares: 27 } },
    { id: 7, platform: 'instagram', content: 'Golden hour at the marina 🌅 Tag us in your best sunset shots for a chance to win a free stay!', scheduledDate: 'Sat', scheduledTime: '18:30', engagement: { likes: 312, comments: 45, shares: 67 } },
    { id: 8, platform: 'facebook', content: 'Fuel dock open extended hours this holiday weekend. Pre-book your slot to skip the queue!', scheduledDate: 'Sun', scheduledTime: '07:00', engagement: { likes: 73, comments: 9, shares: 14 } },
]

export const SOCIAL_STATS = {
    postsThisWeek: 8,
    newFollowers: 32,
    avgEngagement: 4.8,
    topPlatform: 'Instagram',
}

export interface Service {
    id: string
    name: string
    description: string
    price: string
    availability: string
    icon: string
}

export const SERVICES: Service[] = [
    { id: 'clean', name: 'Boat Cleaning', description: 'Professional hull & deck wash. Interior detailing available.', price: 'From £35', availability: '8am – 5pm', icon: 'sparkles' },
    { id: 'fuel', name: 'Refuelling', description: 'Diesel & petrol at competitive marina rates. Pre-book your slot.', price: 'Market rate', availability: '6am – 8pm', icon: 'fuel' },
    { id: 'pumpout', name: 'Pump-out Service', description: 'Waste tank pump-out at berth or pump-out station.', price: '£15', availability: '7am – 6pm', icon: 'droplets' },
    { id: 'engine', name: 'Engine Check', description: 'Basic engine health check by our certified marine engineers.', price: 'From £60', availability: 'By appointment', icon: 'wrench' },
    { id: 'laundry', name: 'Laundry Service', description: 'Wash, dry & fold. Drop off by 9am, collect by 5pm.', price: '£12/load', availability: '24hr drop-off', icon: 'shirt' },
    { id: 'provisions', name: 'Provisions Delivery', description: 'Fresh groceries & supplies delivered dockside.', price: 'From £25', availability: 'Order by 4pm', icon: 'shoppingBag' },
]

export interface Reward {
    id: string
    title: string
    description: string
    terms: string
    icon: string
    discount: string
}

export const REWARDS: Reward[] = [
    { id: 'fuel', title: '10% Off Fuel', description: 'Save on your next fill-up at the fuel dock.', terms: 'Valid during current stay only.', icon: 'fuel', discount: '10%' },
    { id: 'cafe', title: 'Free Coffee', description: 'Complimentary hot drink at the Dockside Café.', terms: 'One per booking. Any size.', icon: 'coffee', discount: 'FREE' },
    { id: 'shop', title: '£5 Off Merch', description: '£5 discount at the Marina Gift Shop.', terms: 'Min spend £15. Cannot combine.', icon: 'shoppingBag', discount: '£5' },
    { id: 'ice', title: 'Free Bag of Ice', description: 'Collect from the marina office on arrival.', terms: 'One bag per booking.', icon: 'snowflake', discount: 'FREE' },
    { id: 'laundry', title: 'Free Laundry Load', description: 'One complimentary wash, dry & fold.', terms: 'Drop off before 9am.', icon: 'shirt', discount: 'FREE' },
    { id: 'restaurant', title: '15% Off Dinner', description: 'Dine at The Galley restaurant with discount.', terms: 'Food only. Max party of 6.', icon: 'utensils', discount: '15%' },
]

export const LOYALTY = {
    currentStamps: 7,
    totalRequired: 10,
    rewardText: 'Free overnight stay',
    history: [
        { date: '12 Jan 2026', marina: 'Agena Marina, Southampton', nights: 2 },
        { date: '28 Dec 2025', marina: 'Agena Marina, Southampton', nights: 1 },
        { date: '15 Dec 2025', marina: 'Agena Marina, Southampton', nights: 3 },
        { date: '22 Nov 2025', marina: 'Agena Marina, Southampton', nights: 1 },
        { date: '08 Nov 2025', marina: 'Agena Marina, Southampton', nights: 2 },
        { date: '19 Oct 2025', marina: 'Agena Marina, Southampton', nights: 1 },
        { date: '03 Oct 2025', marina: 'Agena Marina, Southampton', nights: 1 },
    ],
}
