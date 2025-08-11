export type PlaceCategory = {
  group: string
  includedTypes?: string[]
  keywords: string[]
}

// Canonical group mapping with precedence (top to bottom)
export const PLACE_CATEGORIES: PlaceCategory[] = [
  {
    group: "Hotels & Accommodation",
    includedTypes: ["lodging"],
    keywords: ["hotel", "motel", "bed and breakfast", "resort"],
  },
  {
    group: "Restaurants & Cafes",
    includedTypes: ["restaurant", "cafe"],
    keywords: ["restaurant", "cafe"],
  },
  {
    group: "Bars & Nightlife",
    includedTypes: ["bar", "night_club"],
    keywords: ["bar", "nightclub"],
  },
  {
    group: "Fitness & Wellness",
    includedTypes: ["gym", "spa"],
    keywords: ["gym", "fitness center", "spa"],
  },
  {
    group: "Offices & Coworking",
    keywords: ["coworking space", "shared workspace", "office space"],
  },
  {
    group: "Events & Conferences",
    keywords: ["event venue", "conference center", "wedding venue"],
  },
  {
    group: "Entertainment & Venues",
    keywords: ["entertainment venue"],
  },
  {
    group: "Retail & Services",
    includedTypes: ["store"],
    keywords: ["retail space", "catering service"],
  },
  {
    group: "Community & Public",
    keywords: ["community center"],
  },
]

export function groupForPlace(types: string[], name: string): string | null {
  const lowerName = name.toLowerCase()
  const lowerTypes = types.map((t) => t.toLowerCase())
  for (const cat of PLACE_CATEGORIES) {
    if (cat.includedTypes && cat.includedTypes.some((t) => lowerTypes.includes(t))) {
      return cat.group
    }
    if (cat.keywords.some((k) => lowerName.includes(k))) {
      return cat.group
    }
  }
  return null
}


