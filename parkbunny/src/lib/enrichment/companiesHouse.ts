/**
 * Companies House API Service
 * 
 * Searches for UK companies by name/postcode and retrieves
 * officers (directors) to resolve business identity.
 * 
 * API docs: https://developer.company-information.service.gov.uk/
 * Rate limit: 600 requests per 5 minutes
 */

const CH_API_KEY = process.env.COMPANIES_HOUSE_API_KEY || '';
const CH_BASE_URL = 'https://api.company-information.service.gov.uk';

export type CompanySearchResult = {
    companyNumber: string;
    companyName: string;
    companyType: string; // "ltd", "llp", "plc", etc.
    companyStatus: string; // "active", "dissolved", etc.
    registeredAddress: string;
    sicCodes: string[];
    matchScore: number; // 0-100, how well this matches our business
};

export type CompanyOfficer = {
    name: string;
    role: string; // "director", "secretary", "member"
    appointedOn: string;
    resignedOn: string | null;
    nationality: string | null;
    occupation: string | null;
};

export type CompanyLookupResult = {
    found: boolean;
    company: CompanySearchResult | null;
    officers: CompanyOfficer[];
    bestDirector: CompanyOfficer | null;
    error?: string;
};

/**
 * Make an authenticated request to the Companies House API.
 */
async function chFetch(path: string): Promise<any> {
    if (!CH_API_KEY) {
        throw new Error('COMPANIES_HOUSE_API_KEY not configured');
    }

    const response = await fetch(`${CH_BASE_URL}${path}`, {
        headers: {
            Authorization: `Basic ${Buffer.from(`${CH_API_KEY}:`).toString('base64')}`,
        },
        signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
        if (response.status === 429) {
            // Rate limited — wait and retry
            await delay(5000);
            return chFetch(path);
        }
        throw new Error(`Companies House API ${response.status}: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Search for companies matching a business name, optionally near a postcode.
 */
export async function searchCompanies(
    businessName: string,
    postcode?: string | null,
): Promise<CompanySearchResult[]> {
    try {
        // Clean the business name for search
        const cleanName = businessName
            .replace(/\b(Ltd|Limited|PLC|LLP|Inc)\b/gi, '')
            .replace(/[^\w\s]/g, '')
            .trim();

        const query = encodeURIComponent(cleanName);
        const data = await chFetch(`/search/companies?q=${query}&items_per_page=5`);

        if (!data.items || data.items.length === 0) {
            return [];
        }

        return data.items
            .filter((item: any) => item.company_status === 'active')
            .map((item: any) => {
                const address = item.registered_office_address
                    ? [
                        item.registered_office_address.address_line_1,
                        item.registered_office_address.locality,
                        item.registered_office_address.postal_code,
                    ]
                        .filter(Boolean)
                        .join(', ')
                    : '';

                return {
                    companyNumber: item.company_number,
                    companyName: item.title,
                    companyType: normaliseCompanyType(item.company_type),
                    companyStatus: item.company_status,
                    registeredAddress: address,
                    sicCodes: item.sic_codes || [],
                    matchScore: calculateMatchScore(businessName, item.title, postcode, item.registered_office_address?.postal_code),
                };
            })
            .sort((a: CompanySearchResult, b: CompanySearchResult) => b.matchScore - a.matchScore);
    } catch (err: any) {
        console.error(`Companies House search failed for "${businessName}":`, err.message);
        return [];
    }
}

/**
 * Get officers (directors) for a specific company number.
 */
export async function getOfficers(companyNumber: string): Promise<CompanyOfficer[]> {
    try {
        const data = await chFetch(`/company/${companyNumber}/officers`);

        if (!data.items) return [];

        return data.items
            .filter((item: any) => !item.resigned_on) // Active officers only
            .map((item: any) => ({
                name: item.name,
                role: item.officer_role,
                appointedOn: item.appointed_on || '',
                resignedOn: item.resigned_on || null,
                nationality: item.nationality || null,
                occupation: item.occupation || null,
            }));
    } catch (err: any) {
        console.error(`Companies House officers failed for ${companyNumber}:`, err.message);
        return [];
    }
}

/**
 * Full company lookup: search → best match → get officers → pick best director.
 */
export async function lookupCompany(
    businessName: string,
    postcode?: string | null,
    companyNumber?: string | null,
): Promise<CompanyLookupResult> {
    try {
        let company: CompanySearchResult | null = null;

        // If we already have a company number, use it directly
        if (companyNumber) {
            try {
                const data = await chFetch(`/company/${companyNumber}`);
                company = {
                    companyNumber: data.company_number,
                    companyName: data.company_name,
                    companyType: normaliseCompanyType(data.type),
                    companyStatus: data.company_status,
                    registeredAddress: '',
                    sicCodes: data.sic_codes || [],
                    matchScore: 100,
                };
            } catch {
                // Fall through to search
            }
        }

        // Otherwise search by name
        if (!company) {
            const results = await searchCompanies(businessName, postcode);
            if (results.length === 0) {
                return { found: false, company: null, officers: [], bestDirector: null };
            }
            // Only use the result if match score is reasonable
            company = results[0].matchScore >= 40 ? results[0] : null;
            if (!company) {
                return { found: false, company: null, officers: [], bestDirector: null };
            }
        }

        // Get officers
        const officers = await getOfficers(company.companyNumber);

        // Pick the best director
        const bestDirector = pickBestDirector(officers);

        return {
            found: true,
            company,
            officers,
            bestDirector,
        };
    } catch (err: any) {
        return {
            found: false,
            company: null,
            officers: [],
            bestDirector: null,
            error: err.message,
        };
    }
}

/**
 * Pick the best director to contact from a list of officers.
 * Priority: Managing Director > Director (longest serving) > Secretary
 */
function pickBestDirector(officers: CompanyOfficer[]): CompanyOfficer | null {
    if (officers.length === 0) return null;

    // Prefer directors over secretaries
    const directors = officers.filter(o => o.role === 'director');
    const pool = directors.length > 0 ? directors : officers;

    // Sort by appointment date (longest serving first — more likely the owner)
    return pool.sort((a, b) => {
        const dateA = a.appointedOn ? new Date(a.appointedOn).getTime() : 0;
        const dateB = b.appointedOn ? new Date(b.appointedOn).getTime() : 0;
        return dateA - dateB; // Earliest appointment = likely founder
    })[0];
}

/**
 * Calculate match score between business name and Companies House result.
 */
function calculateMatchScore(
    businessName: string,
    companyName: string,
    businessPostcode?: string | null,
    companyPostcode?: string | null,
): number {
    let score = 0;

    const bizLower = businessName.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const coLower = companyName.toLowerCase().replace(/[^\w\s]/g, '').replace(/\b(ltd|limited|plc|llp)\b/g, '').trim();

    // Exact match
    if (bizLower === coLower) {
        score += 60;
    }
    // Contains match
    else if (coLower.includes(bizLower) || bizLower.includes(coLower)) {
        score += 40;
    }
    // Word overlap
    else {
        const bizWords = new Set(bizLower.split(/\s+/));
        const coWords = new Set(coLower.split(/\s+/));
        const overlap = Array.from(bizWords).filter(w => coWords.has(w) && w.length > 2).length;
        score += Math.min(30, overlap * 10);
    }

    // Postcode match bonus
    if (businessPostcode && companyPostcode) {
        const bizPC = businessPostcode.replace(/\s/g, '').toUpperCase();
        const coPC = companyPostcode.replace(/\s/g, '').toUpperCase();
        if (bizPC === coPC) {
            score += 30;
        } else if (bizPC.slice(0, 4) === coPC.slice(0, 4)) {
            score += 15;
        }
    }

    return Math.min(100, score);
}

function normaliseCompanyType(type: string): string {
    const typeMap: Record<string, string> = {
        'ltd': 'ltd',
        'private-limited-guarant-nsc': 'ltd',
        'private-limited-guarant-nsc-limited-exemption': 'ltd',
        'private-unlimited': 'ltd',
        'llp': 'llp',
        'limited-liability-partnership': 'llp',
        'plc': 'plc',
        'public-limited-company': 'plc',
    };
    return typeMap[type] || type;
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
