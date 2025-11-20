import type { MockBusiness } from './mockData'

export const defaultSettings = {
  upliftPercentages: {
    "Lodging (Hotels)": 0.05,
    "Shopping (Retail)": 0.06,
    "Services": 0.05,
    "Food and Drink": 0.08,
    "Health and Wellness": 0.06,
    "Entertainment and Recreation": 0.07,
    "Sports": 0.06,
    // Legacy support
    restaurants: 0.08,
    bars: 0.08,
    hotels: 0.05,
    coworking: 0.07,
    gyms: 0.06,
  },
  signUpRates: {
    "Lodging (Hotels)": 0.05,
    "Shopping (Retail)": 0.05,
    "Services": 0.05,
    "Food and Drink": 0.05,
    "Health and Wellness": 0.05,
    "Entertainment and Recreation": 0.05,
    "Sports": 0.05,
    // Legacy support
    restaurants: 0.05,
    bars: 0.05,
    hotels: 0.05,
    coworking: 0.05,
    gyms: 0.05,
  },
  estimatedRevenuePerPostcode: 50_000, // default per postcode
  postcodesCount: 1,
  // Optional per-display-category overrides (by display name)
  categoryUplift: {} as Record<string, number>,
  categorySignUp: {} as Record<string, number>,
}

export type Settings = typeof defaultSettings

export function calculateRevenuePotential(
  businesses: { category: string }[],
  settings: Partial<Settings> = defaultSettings,
): number {
  const s: Settings = { ...defaultSettings, ...settings }
  const totalRevenue = Math.max(1, s.estimatedRevenuePerPostcode) * Math.max(1, s.postcodesCount)

  // Count businesses per category
  const counts = new Map<string, number>()
  for (const b of businesses) {
    const key = String(b.category)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  // Uplift model (requested):
  // upliftPercentTotal = sum_over_categories(count * signUpRate * upliftPercent)
  // upliftValue = totalRevenue * upliftPercentTotal
  let upliftPercentTotal = 0
  counts.forEach((count, category) => {
    const uplift = s.categoryUplift[category] ?? (s.upliftPercentages as any)[category] ?? 0.06
    const signUp = s.categorySignUp[category] ?? (s.signUpRates as any)[category] ?? 0.05
    upliftPercentTotal += count * signUp * uplift
  })

  const upliftValue = totalRevenue * upliftPercentTotal
  return Math.round(upliftValue)
}
