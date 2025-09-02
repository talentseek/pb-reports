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

export function groupForPlace(types: string | string[], name: string): string | null {
  const lowerName = name.toLowerCase()
  
  // Handle both string and array types
  let lowerTypes: string[] = []
  if (Array.isArray(types)) {
    lowerTypes = types.map((t) => t.toLowerCase())
  } else if (typeof types === 'string') {
    // Split by comma and clean up
    lowerTypes = types.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0)
  }
  
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


