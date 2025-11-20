export type PlaceCategory = {
  group: string
  includedTypes?: string[]
  keywords: string[]
}

// Canonical group mapping with precedence (top to bottom)
export const PLACE_CATEGORIES: PlaceCategory[] = [
  {
    group: "Lodging (Hotels)",
    includedTypes: ["lodging", "hotel", "motel", "bed_and_breakfast", "resort", "guest_house"],
    keywords: ["hotel", "motel", "bed and breakfast", "resort", "guest house", "inn", "hostel"],
  },
  {
    group: "Shopping (Retail)",
    includedTypes: [
      "store", "clothing_store", "department_store", "electronics_store", "furniture_store",
      "home_goods_store", "jewelry_store", "shoe_store", "shopping_mall", "supermarket",
      "convenience_store", "book_store", "gift_shop", "hardware_store", "liquor_store"
    ],
    keywords: ["shop", "store", "retail", "mall", "outlet", "boutique", "market"],
  },
  {
    group: "Services",
    includedTypes: [
      "bank", "atm", "hair_salon", "laundry", "lawyer", "post_office", "real_estate_agency",
      "travel_agency", "car_repair", "car_wash", "electrician", "florist",
      "funeral_home", "insurance_agency", "locksmith", "moving_company", "painter", "plumber",
      "roofing_contractor", "storage", "veterinary_care"
    ],
    keywords: ["service", "agency", "bank", "repair", "care", "consultant"],
  },
  {
    group: "Food and Drink",
    includedTypes: ["restaurant", "cafe", "bar", "bakery", "meal_delivery", "meal_takeaway", "coffee_shop", "fast_food_restaurant", "ice_cream_shop"],
    keywords: ["restaurant", "cafe", "bar", "pub", "coffee", "food", "dining", "bakery"],
  },
  {
    group: "Health and Wellness",
    includedTypes: ["gym", "spa", "beauty_salon", "doctor", "dentist", "pharmacy", "hospital", "physiotherapist"],
    keywords: ["gym", "fitness", "spa", "health", "wellness", "clinic", "medical", "doctor", "pharmacy"],
  },
  {
    group: "Entertainment and Recreation",
    includedTypes: [
      "amusement_park", "aquarium", "art_gallery", "casino", "movie_theater", "museum",
      "night_club", "park", "zoo", "bowling_alley", "tourist_attraction"
    ],
    keywords: ["entertainment", "recreation", "fun", "park", "cinema", "theater", "museum", "gallery"],
  },
  {
    group: "Sports",
    includedTypes: ["stadium", "athletic_field", "sports_club", "swimming_pool", "golf_course", "sports_complex"],
    keywords: ["sports", "stadium", "arena", "club", "pool", "golf"],
  },
]

export const LEGACY_PLACE_CATEGORIES: PlaceCategory[] = [
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

  for (const cat of [...PLACE_CATEGORIES, ...LEGACY_PLACE_CATEGORIES]) {
    if (cat.includedTypes && cat.includedTypes.some((t) => lowerTypes.includes(t))) {
      return cat.group
    }
    if (cat.keywords.some((k) => lowerName.includes(k))) {
      return cat.group
    }
  }
  return null
}


