export type MockBusiness = {
  name: string
  category: 'restaurants' | 'bars' | 'hotels' | 'coworking' | 'gyms'
  address: string
  website?: string
  mapsLink?: string
}

export const mockBusinesses: MockBusiness[] = [
  { name: 'The Green Fork', category: 'restaurants', address: '12 High St, SW1A 1AA', website: 'https://example.com' },
  { name: 'River Bar', category: 'bars', address: '34 Riverside, SW1A 1AA' },
  { name: 'City Hotel', category: 'hotels', address: '1 Queen Sq, SW1A 1AA', website: 'https://example.com' },
  { name: 'Hive Cowork', category: 'coworking', address: '45 Tech Park, SW1A 1AA' },
  { name: 'Pulse Gym', category: 'gyms', address: '78 Fitness Rd, SW1A 1AA' }
]

export default mockBusinesses
