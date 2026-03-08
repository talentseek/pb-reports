/**
 * Apollo.io People Search & Enrichment Service
 * 
 * Two-step flow per Apollo docs:
 * 1. Search: /people/api_search — find people (no emails/phones returned)
 * 2. Enrich: /people/match — get email/phone (costs 1 credit per person)
 * 
 * Docs: https://docs.apollo.io/reference/people-api-search
 *       https://docs.apollo.io/reference/people-enrichment
 */

const APOLLO_API_KEY = process.env.APOLLO_API_KEY || '';
const APOLLO_BASE_URL = 'https://api.apollo.io/api/v1';

export type ApolloPersonResult = {
    name: string;
    firstName: string;
    lastName: string;
    title: string;
    email: string | null;
    emailStatus: string | null;
    phone: string | null;
    linkedinUrl: string | null;
    companyName: string | null;
    apolloId: string | null;
    confidence: 'high' | 'medium' | 'low';
};

export type ApolloSearchResult = {
    found: boolean;
    people: ApolloPersonResult[];
    bestMatch: ApolloPersonResult | null;
    creditsUsed: number;
    error?: string;
};

/**
 * Search for people at a company by domain, then enrich the best match.
 * Step 1: Search (free, no credits)
 * Step 2: Enrich best match (1 credit)
 */
export async function searchPeopleByDomain(
    domain: string,
    titles?: string[],
): Promise<ApolloSearchResult> {
    if (!APOLLO_API_KEY) {
        return { found: false, people: [], bestMatch: null, creditsUsed: 0, error: 'Apollo API key not configured' };
    }

    try {
        // Step 1: Search (no credits, no emails returned)
        const searchResponse = await fetch(`${APOLLO_BASE_URL}/mixed_people/api_search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': APOLLO_API_KEY,
            },
            body: JSON.stringify({
                q_organization_domains: domain,
                person_titles: titles || ['owner', 'director', 'manager', 'founder', 'managing director', 'general manager'],
                per_page: 5,
                person_locations: ['United Kingdom'],
            }),
            signal: AbortSignal.timeout(15000),
        });

        if (!searchResponse.ok) {
            const errorText = await searchResponse.text();
            return { found: false, people: [], bestMatch: null, creditsUsed: 0, error: `Apollo search ${searchResponse.status}: ${errorText}` };
        }

        const searchData = await searchResponse.json();
        const searchPeople = (searchData.people || []).map(mapSearchPerson);

        if (searchPeople.length === 0) {
            return { found: false, people: [], bestMatch: null, creditsUsed: 0 };
        }

        // Step 2: Pick best candidate and enrich for email/phone (1 credit)
        const bestCandidate = pickBestPerson(searchPeople);
        const enriched = await enrichPersonByDetails(bestCandidate);

        if (enriched) {
            return {
                found: true,
                people: searchPeople,
                bestMatch: enriched,
                creditsUsed: 1,
            };
        }

        // Enrichment failed — return search results without email
        return {
            found: true,
            people: searchPeople,
            bestMatch: bestCandidate,
            creditsUsed: 0,
        };
    } catch (err: any) {
        return { found: false, people: [], bestMatch: null, creditsUsed: 0, error: err.message };
    }
}

/**
 * Search for people by company name. Fallback when domain is unavailable.
 */
export async function searchPeopleByCompany(
    companyName: string,
    location?: string,
): Promise<ApolloSearchResult> {
    if (!APOLLO_API_KEY) {
        return { found: false, people: [], bestMatch: null, creditsUsed: 0, error: 'Apollo API key not configured' };
    }

    try {
        const searchResponse = await fetch(`${APOLLO_BASE_URL}/mixed_people/api_search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': APOLLO_API_KEY,
            },
            body: JSON.stringify({
                q_organization_name: companyName,
                person_titles: ['owner', 'director', 'manager', 'founder', 'managing director'],
                per_page: 5,
                person_locations: location ? [location] : ['United Kingdom'],
            }),
            signal: AbortSignal.timeout(15000),
        });

        if (!searchResponse.ok) {
            return { found: false, people: [], bestMatch: null, creditsUsed: 0, error: `Apollo search ${searchResponse.status}` };
        }

        const searchData = await searchResponse.json();
        const searchPeople = (searchData.people || []).map(mapSearchPerson);

        if (searchPeople.length === 0) {
            return { found: false, people: [], bestMatch: null, creditsUsed: 0 };
        }

        const bestCandidate = pickBestPerson(searchPeople);
        const enriched = await enrichPersonByDetails(bestCandidate);

        if (enriched) {
            return {
                found: true,
                people: searchPeople,
                bestMatch: enriched,
                creditsUsed: 1,
            };
        }

        return {
            found: true,
            people: searchPeople,
            bestMatch: bestCandidate,
            creditsUsed: 0,
        };
    } catch (err: any) {
        return { found: false, people: [], bestMatch: null, creditsUsed: 0, error: err.message };
    }
}

/**
 * Enrich a person using their details (name + domain/company).
 * This is the People Enrichment endpoint — returns email and phone.
 * Costs 1 credit.
 */
async function enrichPersonByDetails(person: ApolloPersonResult): Promise<ApolloPersonResult | null> {
    try {
        const body: Record<string, any> = {
            reveal_personal_emails: false,
        };

        // Provide as much identifying info as possible
        if (person.firstName) body.first_name = person.firstName;
        if (person.lastName) body.last_name = person.lastName;
        if (person.companyName) body.organization_name = person.companyName;
        if (person.linkedinUrl) body.linkedin_url = person.linkedinUrl;
        if (person.apolloId) body.id = person.apolloId;

        const response = await fetch(`${APOLLO_BASE_URL}/people/match`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': APOLLO_API_KEY,
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
            console.error(`Apollo enrich failed: ${response.status}`);
            return null;
        }

        const data = await response.json();
        if (!data.person) return null;

        return mapEnrichedPerson(data.person);
    } catch (err: any) {
        console.error(`Apollo enrichment error: ${err.message}`);
        return null;
    }
}

/**
 * Map a search result person (no email/phone).
 */
function mapSearchPerson(person: any): ApolloPersonResult {
    return {
        name: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
        firstName: person.first_name || '',
        lastName: person.last_name || '',
        title: person.title || '',
        email: null, // Search endpoint does NOT return emails
        emailStatus: null,
        phone: null, // Search endpoint does NOT return phones
        linkedinUrl: person.linkedin_url || null,
        companyName: person.organization?.name || null,
        apolloId: person.id || null,
        confidence: 'low',
    };
}

/**
 * Map an enriched person (has email/phone).
 */
function mapEnrichedPerson(person: any): ApolloPersonResult {
    const emailStatus = person.email_status || null;
    const hasVerifiedEmail = emailStatus === 'verified' || emailStatus === 'guessed';

    return {
        name: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
        firstName: person.first_name || '',
        lastName: person.last_name || '',
        title: person.title || '',
        email: person.email || null,
        emailStatus,
        phone: person.phone_numbers?.[0]?.sanitized_number
            || person.organization?.phone || null,
        linkedinUrl: person.linkedin_url || null,
        companyName: person.organization?.name || null,
        apolloId: person.id || null,
        confidence: hasVerifiedEmail ? 'high' : person.email ? 'medium' : 'low',
    };
}

/**
 * Pick the best person from search results for enrichment.
 * For independents: prioritize owner/director.
 * For chains: prioritize branch/area/club manager — skip HQ-level contacts.
 */
function pickBestPerson(people: ApolloPersonResult[], isChain = false): ApolloPersonResult {
    const scored = people.map(p => {
        let score = 0;
        const titleLower = p.title.toLowerCase();

        if (isChain) {
            // Chain scoring: local managers >> everything else
            // HQ roles are USELESS for chains — actively deprioritize
            if (titleLower.includes('branch manager') || titleLower.includes('club manager')
                || titleLower.includes('hotel manager') || titleLower.includes('store manager')
                || titleLower.includes('restaurant manager')) score += 30;
            if (titleLower.includes('area manager') || titleLower.includes('regional manager')) score += 25;
            if (titleLower.includes('general manager') || titleLower.includes('duty manager')) score += 20;
            if (titleLower.includes('manager') && !titleLower.includes('ceo') && !titleLower.includes('director')) score += 15;
            // Deprioritize HQ roles
            if (titleLower.includes('ceo') || titleLower.includes('founder') || titleLower.includes('owner')
                || titleLower.includes('chairman') || titleLower.includes('chief')) score -= 20;
            if (titleLower.includes('director') && !titleLower.includes('area')) score -= 15;
        } else {
            // Independent scoring: owners/directors are the right people
            const ownerTitles = ['owner', 'founder', 'managing director', 'director', 'co-founder', 'ceo'];
            if (ownerTitles.some(t => titleLower.includes(t))) score += 20;
            if (titleLower.includes('manager') || titleLower.includes('head')) score += 10;
        }

        if (p.linkedinUrl) score += 5;
        if (p.apolloId) score += 3;
        return { person: p, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].person;
}

/**
 * Search for branch/area managers at a chain company.
 * Uses local manager titles per chain research — NOT owner/director/founder.
 */
export async function searchChainBranchManager(
    domain: string,
    chainName: string,
    location?: string,
): Promise<ApolloSearchResult> {
    if (!APOLLO_API_KEY) {
        return { found: false, people: [], bestMatch: null, creditsUsed: 0, error: 'Apollo API key not configured' };
    }

    // Chain-specific titles per the research doc
    const chainTitles = [
        'branch manager', 'club manager', 'hotel manager',
        'store manager', 'restaurant manager', 'area manager',
        'regional manager', 'general manager', 'duty manager',
        'site manager', 'venue manager',
    ];

    try {
        const searchResponse = await fetch(`${APOLLO_BASE_URL}/mixed_people/api_search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': APOLLO_API_KEY,
            },
            body: JSON.stringify({
                q_organization_domains: domain,
                person_titles: chainTitles,
                per_page: 10, // More results for chains — London density
                person_locations: location ? [location] : ['United Kingdom'],
            }),
            signal: AbortSignal.timeout(15000),
        });

        if (!searchResponse.ok) {
            const errorText = await searchResponse.text();
            return { found: false, people: [], bestMatch: null, creditsUsed: 0, error: `Apollo chain search ${searchResponse.status}: ${errorText}` };
        }

        const searchData = await searchResponse.json();
        const searchPeople = (searchData.people || []).map(mapSearchPerson);

        if (searchPeople.length === 0) {
            return { found: false, people: [], bestMatch: null, creditsUsed: 0 };
        }

        // Pick the best LOCAL manager (not HQ director)
        const bestCandidate = pickBestPerson(searchPeople, true);
        const enriched = await enrichPersonByDetails(bestCandidate);

        if (enriched) {
            return {
                found: true,
                people: searchPeople,
                bestMatch: enriched,
                creditsUsed: 1,
            };
        }

        return {
            found: true,
            people: searchPeople,
            bestMatch: bestCandidate,
            creditsUsed: 0,
        };
    } catch (err: any) {
        return { found: false, people: [], bestMatch: null, creditsUsed: 0, error: err.message };
    }
}
