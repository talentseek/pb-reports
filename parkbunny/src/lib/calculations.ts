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
}

export type Settings = typeof defaultSettings

const BASE_REVENUE_PER_BUSINESS = 1000 // placeholder for POC

export function calculateRevenuePotential(
  businesses: Pick<MockBusiness, 'category'>[],
  settings: Settings = defaultSettings,
): number {
  let total = 0
  for (const biz of businesses) {
    const category = biz.category as keyof typeof settings.upliftPercentages
    const uplift = settings.upliftPercentages[category] ?? 0.05
    const signUp = settings.signUpRates[category] ?? 0.2
    total += BASE_REVENUE_PER_BUSINESS * uplift * signUp
  }
  return Math.round(total)
}
