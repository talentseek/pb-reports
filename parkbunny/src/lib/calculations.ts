import type { MockBusiness } from './mockData'

export const defaultSettings = {
  upliftPercentages: {
    restaurants: 0.08,
    bars: 0.08,
    hotels: 0.05,
    coworking: 0.07,
    gyms: 0.06,
  },
  signUpRates: {
    restaurants: 0.2,
    bars: 0.15,
    hotels: 0.3,
    coworking: 0.5,
    gyms: 0.25,
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
  const numBusinesses = Math.max(1, businesses.length)
  const totalRevenue = Math.max(1, s.estimatedRevenuePerPostcode) * Math.max(1, s.postcodesCount)
  const basePerBusiness = totalRevenue / numBusinesses
  let total = 0
  for (const biz of businesses) {
    const displayCat = biz.category
    // Prefer per-display-category override if present, else fall back to legacy keys
    const uplift = s.categoryUplift[displayCat] ??
      (s.upliftPercentages as any)[displayCat] ?? 0.06
    const signUp = s.categorySignUp[displayCat] ??
      (s.signUpRates as any)[displayCat] ?? 0.2
    total += basePerBusiness * uplift * signUp
  }
  return Math.round(total)
}
