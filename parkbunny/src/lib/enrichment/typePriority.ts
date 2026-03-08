/**
 * Business Type Priority
 * 
 * Google Places can assign multiple types to a business (e.g., "restaurant,bar,food").
 * This module determines the PRIMARY type for enrichment prioritisation and UI display.
 * 
 * Higher position = higher priority = more likely to be a parking partnership prospect.
 */

// Ordered by parking partnership relevance (highest first)
const TYPE_PRIORITY: string[] = [
    // Tier 1: High traffic, high value
    'shopping_mall',
    'department_store',
    'hotel',
    'gym',
    'fitness_center',
    'hospital',
    'university',

    // Tier 2: Regular traffic, good prospects
    'restaurant',
    'bar',
    'night_club',
    'cafe',
    'supermarket',
    'movie_theater',
    'bowling_alley',
    'amusement_park',
    'stadium',
    'tourist_attraction',
    'spa',

    // Tier 3: Standard businesses
    'store',
    'clothing_store',
    'shoe_store',
    'electronics_store',
    'furniture_store',
    'home_goods_store',
    'pet_store',
    'book_store',
    'jewelry_store',
    'pharmacy',
    'convenience_store',
    'bakery',
    'florist',

    // Tier 4: Professional services
    'dentist',
    'doctor',
    'veterinary_care',
    'physiotherapist',
    'lawyer',
    'accounting',
    'insurance_agency',
    'real_estate_agency',
    'travel_agency',

    // Tier 5: Automotive (already have parking, but could partner)
    'car_dealer',
    'car_rental',
    'car_repair',
    'car_wash',
    'gas_station',

    // Tier 6: Low prospect value
    'bank',
    'atm',
    'post_office',
    'library',
    'church',
    'mosque',
    'synagogue',
    'cemetery',
    'city_hall',
    'courthouse',
    'fire_station',
    'police',
    'school',
    'primary_school',
    'secondary_school',

    // Tier 7: Non-prospects (should be filtered)
    'bus_station',
    'subway_station',
    'train_station',
    'taxi_stand',
    'parking',
];

// Types that should be EXCLUDED from enrichment (not viable prospects)
const NON_PROSPECT_TYPES = new Set([
    'bus_station',
    'subway_station',
    'train_station',
    'taxi_stand',
    'parking',
    'transit_station',
    'light_rail_station',
    'cemetery',
    'funeral_home',
]);

// Types that should be flagged as LOW PRIORITY
const LOW_PRIORITY_TYPES = new Set([
    'atm',
    'post_office',
    'fire_station',
    'police',
    'city_hall',
    'courthouse',
    'church',
    'mosque',
    'synagogue',
    'school',
    'primary_school',
    'secondary_school',
]);

/**
 * Get the primary type from a list of Google Places types.
 * Returns the highest-priority type from the TYPE_PRIORITY list.
 */
export function getPrimaryType(types: string | string[]): string {
    const typesArray = Array.isArray(types)
        ? types
        : types.split(',').map(t => t.trim()).filter(Boolean);

    let bestType = typesArray[0] || 'unknown';
    let bestPriority = TYPE_PRIORITY.length;

    for (const type of typesArray) {
        const priority = TYPE_PRIORITY.indexOf(type);
        if (priority !== -1 && priority < bestPriority) {
            bestPriority = priority;
            bestType = type;
        }
    }

    return bestType;
}

/**
 * Get the tier label for UI display.
 */
export function getTypeTier(type: string): 'high' | 'medium' | 'low' | 'non_prospect' {
    if (NON_PROSPECT_TYPES.has(type)) return 'non_prospect';
    if (LOW_PRIORITY_TYPES.has(type)) return 'low';

    const priority = TYPE_PRIORITY.indexOf(type);
    if (priority === -1) return 'medium'; // Unknown type, default to medium
    if (priority < 20) return 'high';
    if (priority < 50) return 'medium';
    return 'low';
}

/**
 * Check if a business should be excluded from enrichment.
 */
export function isNonProspect(types: string | string[]): boolean {
    const typesArray = Array.isArray(types)
        ? types
        : types.split(',').map(t => t.trim()).filter(Boolean);

    return typesArray.every(t => NON_PROSPECT_TYPES.has(t));
}

/**
 * Format a Google type for UI display.
 * e.g., "shopping_mall" → "Shopping Mall"
 */
export function formatType(type: string): string {
    return type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Get unique type categories from a batch of businesses for filter UI.
 */
export function getTypeCategories(businesses: { types: string }[]): {
    type: string;
    label: string;
    count: number;
    tier: 'high' | 'medium' | 'low' | 'non_prospect';
}[] {
    const typeCounts = new Map<string, number>();

    for (const biz of businesses) {
        const primary = getPrimaryType(biz.types);
        typeCounts.set(primary, (typeCounts.get(primary) || 0) + 1);
    }

    return Array.from(typeCounts.entries())
        .map(([type, count]) => ({
            type,
            label: formatType(type),
            count,
            tier: getTypeTier(type),
        }))
        .sort((a, b) => {
            // Sort by tier priority, then by count
            const tierOrder = { high: 0, medium: 1, low: 2, non_prospect: 3 };
            const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
            if (tierDiff !== 0) return tierDiff;
            return b.count - a.count;
        });
}

export { TYPE_PRIORITY, NON_PROSPECT_TYPES, LOW_PRIORITY_TYPES };
