// Central market configuration — add new countries here
export type MarketCode = 'GB' | 'NL'

export interface MarketConfig {
  label: string
  flag: string
  currency: string
  currencySymbol: string
  locale: string
  geocodeRegion: string
  postcodeFormat: string
  postcodePlaceholder: string
  distanceUnit: 'miles' | 'km'
  language: 'en' | 'nl'
}

export const MARKETS: Record<MarketCode, MarketConfig> = {
  GB: {
    label: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    currencySymbol: '£',
    locale: 'en-GB',
    geocodeRegion: 'uk',
    postcodeFormat: 'SW1A 1AA',
    postcodePlaceholder: 'SW1A 1AA, SW1A 2AA',
    distanceUnit: 'miles',
    language: 'en',
  },
  NL: {
    label: 'Netherlands',
    flag: '🇳🇱',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'nl-NL',
    geocodeRegion: 'nl',
    postcodeFormat: '1234 AB',
    postcodePlaceholder: '5613 AB, 1012 JS',
    distanceUnit: 'km',
    language: 'nl',
  },
}

export const DEFAULT_MARKET: MarketCode = 'GB'

export function getMarketFromSettings(settings: Record<string, unknown> | null | undefined): MarketConfig {
  const code = (settings?.market as string) ?? DEFAULT_MARKET
  return MARKETS[code as MarketCode] ?? MARKETS[DEFAULT_MARKET]
}

export function formatCurrencyForMarket(n: number, market: MarketConfig): string {
  try {
    return new Intl.NumberFormat(market.locale, {
      style: 'currency',
      currency: market.currency,
      maximumFractionDigits: 0,
    }).format(n)
  } catch {
    return `${market.currencySymbol}${Math.round(n).toLocaleString(market.locale)}`
  }
}
