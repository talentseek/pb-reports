/**
 * Vatsense API Service
 * 
 * Resolves VAT numbers to legal entity details.
 * Used as a fallback (Layer 5) when Companies House lookup fails
 * but a VAT number was found on the business website.
 * 
 * API: https://vatsense.com/
 * Free tier: 100 lookups/month
 * Paid: from €0.01/lookup
 * 
 * Flow: VAT number from website footer → Vatsense → company name + address
 *       → retry Companies House search with resolved company name
 */

const VATSENSE_API_KEY = process.env.VATSENSE_API_KEY || '';
const VATSENSE_BASE_URL = 'https://api.vatsense.com/1.0';

export type VatLookupResult = {
    valid: boolean;
    vatNumber: string;
    companyName: string | null;
    companyAddress: string | null;
    countryCode: string | null;
    error?: string;
};

/**
 * Validate and resolve a UK VAT number via Vatsense API.
 * 
 * UK VAT numbers follow the pattern: GB + 9 digits (e.g., GB123456789)
 * Some websites show them without the GB prefix.
 * 
 * Returns the legal entity name and address, which can be used
 * to retry Companies House search with a more precise company name.
 */
export async function lookupVatNumber(vatNumber: string): Promise<VatLookupResult> {
    if (!VATSENSE_API_KEY) {
        return {
            valid: false,
            vatNumber,
            companyName: null,
            companyAddress: null,
            countryCode: null,
            error: 'VATSENSE_API_KEY not configured',
        };
    }

    // Normalise the VAT number
    const normalised = normaliseUkVatNumber(vatNumber);
    if (!normalised) {
        return {
            valid: false,
            vatNumber,
            companyName: null,
            companyAddress: null,
            countryCode: null,
            error: 'Invalid UK VAT number format',
        };
    }

    try {
        const response = await fetch(`${VATSENSE_BASE_URL}/validate?vat_number=${normalised}`, {
            method: 'GET',
            headers: {
                Authorization: `Basic ${Buffer.from(`user:${VATSENSE_API_KEY}`).toString('base64')}`,
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            return {
                valid: false,
                vatNumber: normalised,
                companyName: null,
                companyAddress: null,
                countryCode: null,
                error: `Vatsense API ${response.status}: ${response.statusText}`,
            };
        }

        const data = await response.json();

        if (!data.data || !data.success) {
            return {
                valid: false,
                vatNumber: normalised,
                companyName: null,
                companyAddress: null,
                countryCode: null,
                error: data.error?.message || 'VAT number not found',
            };
        }

        const vatData = data.data;

        return {
            valid: vatData.valid === true,
            vatNumber: normalised,
            companyName: vatData.company?.name || null,
            companyAddress: vatData.company?.address
                ? formatVatsenseAddress(vatData.company.address)
                : null,
            countryCode: vatData.country_code || 'GB',
        };
    } catch (err: any) {
        return {
            valid: false,
            vatNumber: normalised,
            companyName: null,
            companyAddress: null,
            countryCode: null,
            error: err.message,
        };
    }
}

/**
 * Normalise a UK VAT number to the format expected by Vatsense.
 * Handles variations like:
 * - "GB123456789"
 * - "GB 123 456 789" 
 * - "123456789" (missing prefix)
 * - "VAT: GB123456789" (with label)
 */
function normaliseUkVatNumber(input: string): string | null {
    // Strip everything except letters and digits
    const cleaned = input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    // Check if it starts with GB
    if (cleaned.startsWith('GB')) {
        const digits = cleaned.slice(2);
        if (digits.length === 9 && /^\d+$/.test(digits)) {
            return `GB${digits}`;
        }
    }

    // Try as raw 9 digits (assume GB prefix)
    if (/^\d{9}$/.test(cleaned)) {
        return `GB${cleaned}`;
    }

    return null;
}

/**
 * Format a Vatsense address object into a readable string.
 */
function formatVatsenseAddress(address: any): string {
    if (typeof address === 'string') {
        // Vatsense returns newline-separated address e.g. "142 CROMWELL ROAD\nLONDON\nSW7 4EF"
        return address.replace(/\n+/g, ', ').replace(/, ,/g, ',').trim();
    }

    // Fallback for object format
    const parts = [
        address?.line_1,
        address?.line_2,
        address?.line_3,
        address?.city,
        address?.postcode,
        address?.country,
    ].filter(Boolean);

    return parts.join(', ');
}

/**
 * Extract a VAT number from text (typically website footer content).
 * Returns the first VAT number found, or null.
 */
export function extractVatFromText(text: string): string | null {
    // Pattern: "VAT" followed by optional colon/space, then GB + 9 digits or just 9 digits
    const patterns = [
        /VAT\s*(?:registration\s*)?(?:number|no|#)?[:\s]*(?:GB\s?)?(\d[\d\s]{8,12}\d)/i,
        /GB\s?(\d{3}\s?\d{4}\s?\d{2})/,
        /GB(\d{9})/,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const digits = match[1] ? match[1].replace(/\s/g, '') : match[0].replace(/[^0-9]/g, '');
            if (digits.length === 9) {
                return `GB${digits}`;
            }
        }
    }

    return null;
}
