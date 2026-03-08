/**
 * Spatial-to-Identity Pipeline Orchestrator
 * 
 * Connects all enrichment layers into a sequential waterfall
 * with early exit on resolution. This is the core engine.
 * 
 * Waterfall (Independent):
 * 1. Website scrape → LLM extract → (name + email = STOP)
 * 2. Companies House lookup → (director name = continue)
 * 3. Apollo search → (verified email = STOP)
 * 4. Construct info@/contact@ → verify → (valid = FALLBACK)
 * 5. VAT trace → Vatsense → resolve legal entity → retry CH
 * 
 * Waterfall (Chain):
 * 1. Try location-specific email ({area}@chain)
 * 2. Scrape branch page for manager
 * 3. Apollo people search by domain + title
 */

import prisma from '@/lib/db';
import { classifyBusiness, type ChainClassification } from './chainClassifier';
import { getPrimaryType, isNonProspect } from './typePriority';
import { scrapeWebsite, fetchMailtoEmails, extractDomainFromUrl as scrapeDomain, type ScrapeResult } from './websiteScraper';
import { extractIdentity, type ExtractedIdentity } from './llmExtractor';
import { lookupCompany, type CompanyLookupResult } from './companiesHouse';
import { searchPeopleByDomain, searchPeopleByCompany, searchChainBranchManager, type ApolloSearchResult } from './apolloService';
import { verifyEmail, type VerificationResult } from './emailVerifier';
import { lookupVatNumber, extractVatFromText, type VatLookupResult } from './vatLookup';

export type PipelineResult = {
    placeId: string;
    status: 'resolved' | 'partial' | 'failed' | 'needs_review' | 'skipped';
    ownerName: string | null;
    ownerRole: string | null;
    ownerEmail: string | null;
    ownerPhone: string | null;
    ownerLinkedIn: string | null;
    companiesHouseNumber: string | null;
    companyName: string | null;
    companyType: string | null;
    emailVerified: boolean;
    emailVerificationResult: string | null;
    chainClassification: ChainClassification;
    overallConfidence: 'high' | 'medium' | 'low';
    dataSources: string[];
    layerResults: LayerResults;
    websiteMarkdown: string | null;
    websitePages: any[];
    error?: string;
};

type LayerResults = {
    classification: ChainClassification;
    websiteScrape?: { method: string; pagesScraped: number; error?: string };
    llmExtraction?: { confidence: string; foundName: boolean; foundEmail: boolean; foundCompanyNumber: boolean; foundVatNumber: boolean };
    companiesHouse?: { found: boolean; matchScore: number; officerCount: number; error?: string };
    apollo?: { found: boolean; peopleCount: number; creditsUsed: number; error?: string };
    vatTrace?: { found: boolean; vatNumber: string; companyName: string | null; error?: string };
    emailConstruction?: { attempted: string[]; validEmails: string[] };
    chainEmailPattern?: { attempted: string[]; validEmails: string[] };
    emailVerification?: { email: string; result: string };
};

/**
 * Run the full enrichment pipeline for a single business.
 */
export async function enrichBusiness(place: {
    id: string;
    name: string;
    types: string;
    website: string | null;
    address: string | null;
    phone: string | null;
}): Promise<PipelineResult> {
    const dataSources: string[] = [];
    const layerResults: LayerResults = {} as LayerResults;

    // Step 0: Classify
    const classification = classifyBusiness(place.name, place.website, place.types);
    layerResults.classification = classification;
    const isChain = classification.classification === 'national_chain' || classification.classification === 'local_group';

    // Check if non-prospect
    if (isNonProspect(place.types)) {
        return buildResult(place.id, 'skipped', classification, layerResults, dataSources, {
            error: 'Non-prospect business type',
        });
    }

    // Detect government domains — flag for review, don't skip entirely
    const isGovernment = place.website ? isGovernmentDomain(place.website) : false;

    let ownerName: string | null = null;
    let ownerRole: string | null = null;
    let ownerEmail: string | null = null;
    let ownerPhone: string | null = place.phone || null;
    let ownerLinkedIn: string | null = null;
    let companiesHouseNumber: string | null = null;
    let companyName: string | null = null;
    let companyType: string | null = null;
    let vatNumber: string | null = null;
    let websiteMarkdown: string | null = null;
    let websitePages: any[] = [];

    // Step 1: Website Scraping + LLM Extraction
    if (place.website) {
        try {
            const scrapeResult = await scrapeWebsite(place.website, isChain);
            websiteMarkdown = scrapeResult.totalContent || null;
            websitePages = scrapeResult.pages.map(p => ({ url: p.url, statusCode: p.statusCode }));

            layerResults.websiteScrape = {
                method: scrapeResult.method,
                pagesScraped: scrapeResult.pages.length,
                error: scrapeResult.error,
            };

            if (scrapeResult.totalContent && scrapeResult.totalContent.length > 100) {
                dataSources.push('website');

                const extracted = await extractIdentity(scrapeResult.totalContent, place.name, place.address, isChain);

                layerResults.llmExtraction = {
                    confidence: extracted.confidence,
                    foundName: !!extracted.ownerName,
                    foundEmail: extracted.emails.length > 0,
                    foundCompanyNumber: !!extracted.companyRegistration,
                    foundVatNumber: !!extracted.vatNumber,
                };

                // Apply extracted data
                if (extracted.ownerName) ownerName = extracted.ownerName;
                if (extracted.ownerRole) ownerRole = extracted.ownerRole;
                if (extracted.companyRegistration) companiesHouseNumber = extracted.companyRegistration;
                if (extracted.companyName) companyName = extracted.companyName;
                if (extracted.vatNumber) vatNumber = extracted.vatNumber;

                // Get best email (prefer personal over generic)
                const personalEmails = extracted.emails.filter(e => !e.isGeneric);
                const genericEmails = extracted.emails.filter(e => e.isGeneric);

                if (personalEmails.length > 0) {
                    ownerEmail = personalEmails[0].email;
                } else if (genericEmails.length > 0) {
                    ownerEmail = genericEmails[0].email;
                }

                // Social links
                if (extracted.socialLinks?.linkedin) ownerLinkedIn = extracted.socialLinks.linkedin;

                // Early exit: high confidence resolution
                if (ownerName && ownerEmail && extracted.confidence === 'high') {
                    dataSources.push('llm_extraction');
                    const verified = await verifyAndRecord(ownerEmail, layerResults);
                    return buildResult(place.id, 'resolved', classification, layerResults, dataSources, {
                        ownerName, ownerRole, ownerEmail, ownerPhone, ownerLinkedIn,
                        companiesHouseNumber, companyName, companyType,
                        emailVerified: verified.isDeliverable,
                        emailVerificationResult: verified.status,
                        websiteMarkdown, websitePages,
                    });
                }
            }

            // Regex fallback: catch emails the LLM missed
            if (!ownerEmail && websiteMarkdown) {
                const regexEmails = extractEmailsFromText(websiteMarkdown, place.website ? extractDomainFromUrl(place.website) : '');
                if (regexEmails.length > 0 && !ownerEmail) {
                    // For chains, prefer branch-specific emails over generic
                    if (isChain) {
                        const area = extractAreaFromAddress(place.address || '', place.name);
                        const branchEmail = regexEmails.find(e => area && e.toLowerCase().includes(area));
                        if (branchEmail) {
                            ownerEmail = branchEmail;
                            dataSources.push('regex_extraction');
                        }
                    }
                    // Use first non-generic email found
                    if (!ownerEmail) {
                        const nonGeneric = regexEmails.filter(e => {
                            const local = e.split('@')[0].toLowerCase();
                            return !['info', 'contact', 'hello', 'enquiries', 'support', 'noreply', 'no-reply', 'careers', 'jobs', 'recruitment', 'privacy', 'admin', 'webmaster'].includes(local);
                        });
                        if (nonGeneric.length > 0) {
                            ownerEmail = nonGeneric[0];
                            dataSources.push('regex_extraction');
                        } else if (regexEmails.length > 0 && !ownerEmail) {
                            ownerEmail = regexEmails[0];
                            dataSources.push('regex_extraction');
                        }
                    }
                }
            }
        } catch (err: any) {
            layerResults.websiteScrape = { method: 'failed', pagesScraped: 0, error: err.message };
        }
    }

    // Step 1b: Raw HTML mailto: extraction
    // Catches emails hidden in mailto: href attributes that markdown scrapers strip
    if (!ownerEmail && place.website) {
        try {
            const mailtoEmails = await fetchMailtoEmails(place.website);
            if (mailtoEmails.length > 0) {
                // Prefer non-generic emails
                const nonGeneric = mailtoEmails.filter((e: string) => {
                    const local = e.split('@')[0];
                    return !['info', 'contact', 'hello', 'enquiries', 'support', 'admin', 'webmaster', 'privacy', 'careers', 'jobs', 'recruitment'].includes(local);
                });
                const bestEmail = nonGeneric.length > 0 ? nonGeneric[0] : mailtoEmails[0];
                ownerEmail = bestEmail;
                dataSources.push('mailto_extraction');
            }
        } catch { /* skip */ }
    }

    // Step 2: Companies House (INDEPENDENTS ONLY — for chains, CH returns HQ directors who are useless)
    if (!isChain) {
        try {
            // Extract postcode from address if available
            const postcode = extractPostcode(place.address);
            const chResult = await lookupCompany(place.name, postcode, companiesHouseNumber);

            layerResults.companiesHouse = {
                found: chResult.found,
                matchScore: chResult.company?.matchScore || 0,
                officerCount: chResult.officers.length,
                error: chResult.error,
            };

            if (chResult.found && chResult.company) {
                dataSources.push('companies_house');
                companiesHouseNumber = chResult.company.companyNumber;
                companyName = chResult.company.companyName;
                companyType = chResult.company.companyType;

                if (chResult.bestDirector && !ownerName) {
                    ownerName = formatDirectorName(chResult.bestDirector.name);
                    ownerRole = chResult.bestDirector.role === 'director' ? 'Director' : chResult.bestDirector.role;
                }
            }
        } catch (err: any) {
            layerResults.companiesHouse = { found: false, matchScore: 0, officerCount: 0, error: err.message };
        }
    }

    // Step 5: VAT Trace (Layer 5) — fallback when CH fails but VAT number was extracted
    if (!companiesHouseNumber && vatNumber && classification.classification !== 'national_chain') {
        try {
            const vatResult = await lookupVatNumber(vatNumber);

            layerResults.vatTrace = {
                found: vatResult.valid,
                vatNumber: vatResult.vatNumber,
                companyName: vatResult.companyName,
                error: vatResult.error,
            };

            if (vatResult.valid && vatResult.companyName) {
                dataSources.push('vatsense');
                if (!companyName) companyName = vatResult.companyName;

                // Retry Companies House with the resolved company name from VAT
                const postcode = extractPostcode(vatResult.companyAddress || place.address);
                const retryChResult = await lookupCompany(vatResult.companyName, postcode);

                if (retryChResult.found && retryChResult.company) {
                    dataSources.push('companies_house_via_vat');
                    companiesHouseNumber = retryChResult.company.companyNumber;
                    companyName = retryChResult.company.companyName;
                    companyType = retryChResult.company.companyType;

                    if (retryChResult.bestDirector && !ownerName) {
                        ownerName = formatDirectorName(retryChResult.bestDirector.name);
                        ownerRole = retryChResult.bestDirector.role === 'director' ? 'Director' : retryChResult.bestDirector.role;
                    }
                }
            }
        } catch (err: any) {
            layerResults.vatTrace = { found: false, vatNumber: vatNumber || '', companyName: null, error: err.message };
        }
    }
    // Also try extracting VAT from website content if LLM didn't find it
    else if (!companiesHouseNumber && !vatNumber && websiteMarkdown && classification.classification !== 'national_chain') {
        const extractedVat = extractVatFromText(websiteMarkdown);
        if (extractedVat) {
            vatNumber = extractedVat;
            try {
                const vatResult = await lookupVatNumber(extractedVat);
                layerResults.vatTrace = {
                    found: vatResult.valid,
                    vatNumber: vatResult.vatNumber,
                    companyName: vatResult.companyName,
                    error: vatResult.error,
                };

                if (vatResult.valid && vatResult.companyName) {
                    dataSources.push('vatsense');
                    if (!companyName) companyName = vatResult.companyName;

                    const postcode = extractPostcode(vatResult.companyAddress || place.address);
                    const retryChResult = await lookupCompany(vatResult.companyName, postcode);

                    if (retryChResult.found && retryChResult.company) {
                        dataSources.push('companies_house_via_vat');
                        companiesHouseNumber = retryChResult.company.companyNumber;
                        companyName = retryChResult.company.companyName;
                        companyType = retryChResult.company.companyType;

                        if (retryChResult.bestDirector && !ownerName) {
                            ownerName = formatDirectorName(retryChResult.bestDirector.name);
                            ownerRole = retryChResult.bestDirector.role === 'director' ? 'Director' : retryChResult.bestDirector.role;
                        }
                    }
                }
            } catch (err: any) {
                layerResults.vatTrace = { found: false, vatNumber: extractedVat, companyName: null, error: err.message };
            }
        }
    }

    // Step 3: Apollo People Search
    // For chains: use chain-specific search with branch/area manager titles
    // For independents: use standard owner/director search
    if (!ownerEmail || !ownerName) {
        try {
            let apolloResult: ApolloSearchResult;
            const domain = place.website ? extractDomainFromUrl(place.website) : null;
            const isHostedDomain = domain ? isHostedOrProxyDomain(domain) : true;

            if (isChain) {
                // Chain path: search for branch managers with chain-specific titles
                // Extract city from address for location filtering (prevents cross-branch matches)
                const city = extractCityFromAddress(place.address);
                const chainDomain = domain && !isHostedDomain ? domain : null;
                if (chainDomain) {
                    apolloResult = await searchChainBranchManager(
                        chainDomain,
                        classification.chainName || place.name,
                        city || undefined,
                    );
                } else {
                    // Hosted domain — search by FULL business name (not just chain name)
                    // "Best Western Palm Hotel" not "Best Western"
                    apolloResult = await searchPeopleByCompany(
                        place.name,
                        city || undefined,
                    );
                }
            } else if (domain && !isHostedDomain) {
                apolloResult = await searchPeopleByDomain(domain);
            } else {
                apolloResult = await searchPeopleByCompany(companyName || place.name);
            }

            layerResults.apollo = {
                found: apolloResult.found,
                peopleCount: apolloResult.people.length,
                creditsUsed: apolloResult.creditsUsed,
                error: apolloResult.error,
            };

            if (apolloResult.bestMatch) {
                dataSources.push('apollo');
                if (!ownerName && apolloResult.bestMatch.name) {
                    ownerName = apolloResult.bestMatch.name;
                    ownerRole = apolloResult.bestMatch.title || ownerRole;
                }
                if (!ownerEmail && apolloResult.bestMatch.email) {
                    ownerEmail = apolloResult.bestMatch.email;
                }
                if (!ownerLinkedIn && apolloResult.bestMatch.linkedinUrl) {
                    ownerLinkedIn = apolloResult.bestMatch.linkedinUrl;
                }
                if (!ownerPhone && apolloResult.bestMatch.phone) {
                    ownerPhone = apolloResult.bestMatch.phone;
                }

                // If Apollo found a name but no email, try constructing name@domain
                if (ownerName && !ownerEmail && domain && !isHostedDomain) {
                    const nameParts = ownerName.toLowerCase().split(/\s+/);
                    if (nameParts.length >= 2) {
                        const candidates = [
                            `${nameParts[0]}.${nameParts[nameParts.length - 1]}@${domain}`,
                            `${nameParts[0]}@${domain}`,
                            `${nameParts[0][0]}${nameParts[nameParts.length - 1]}@${domain}`,
                        ];
                        for (const candidate of candidates) {
                            const vResult = await verifyEmail(candidate);
                            if (vResult.isDeliverable || vResult.isSafeToSend) {
                                ownerEmail = candidate;
                                dataSources.push('apollo_email_construction');
                                break;
                            }
                        }
                    }
                }
            }
        } catch (err: any) {
            layerResults.apollo = { found: false, peopleCount: 0, creditsUsed: 0, error: err.message };
        }
    }

    // Step 4: Construct common emails and verify
    // Skip if domain is a hosted platform (sites.google.com, wix.com etc)
    if (!ownerEmail && place.website) {
        const domain = extractDomainFromUrl(place.website);
        const hostedDomain = isHostedOrProxyDomain(domain);

        if (!hostedDomain) {
            const commonEmails: string[] = [];

            // For chains: try location-specific email patterns FIRST
            if (isChain && place.address) {
                const area = extractAreaFromAddress(place.address, place.name);
                if (area) {
                    commonEmails.push(
                        `${area}@${domain}`,
                        `sales.${area}@${domain}`,
                        `${area}.manager@${domain}`,
                    );
                }
            }

            // If we have an owner name, try name-based patterns
            if (ownerName) {
                const nameParts = ownerName.toLowerCase().split(/\s+/);
                if (nameParts.length >= 2) {
                    commonEmails.push(
                        `${nameParts[0]}.${nameParts[nameParts.length - 1]}@${domain}`,
                        `${nameParts[0]}@${domain}`,
                    );
                }
            }

            // Generic fallbacks
            commonEmails.push(
                `info@${domain}`,
                `contact@${domain}`,
                `hello@${domain}`,
                `enquiries@${domain}`,
                `bookings@${domain}`,
                `reception@${domain}`,
            );

            const validEmails: string[] = [];
            const attempted: string[] = [];

            for (const email of commonEmails.slice(0, 6)) {
                attempted.push(email);
                const result = await verifyEmail(email);
                if (result.isDeliverable) {
                    validEmails.push(email);
                    ownerEmail = email;
                    break;
                }
                await delay(200);
            }

            layerResults.emailConstruction = { attempted, validEmails };
            if (validEmails.length > 0) {
                dataSources.push('email_construction');
            }
        } // end if (!hostedDomain)
    } // end if (!ownerEmail && place.website)

    // Step 5: Chain Email Pattern Fallback
    // For chains where scraping failed, try known email patterns
    // Accept 'unknown' verification (catch-all domains) since these are high-confidence derived patterns
    if (!ownerEmail && isChain && place.website) {
        const chainPatternEmails = deriveChainEmailPatterns(place.website, place.name, place.address);
        if (chainPatternEmails.length > 0) {
            const attempted: string[] = [];
            const validEmails: string[] = [];

            for (const email of chainPatternEmails) {
                attempted.push(email);
                try {
                    const result = await verifyEmail(email);
                    // Accept deliverable, safeToSend, OR unknown (catch-all chains)
                    if (result.isDeliverable || result.isSafeToSend || result.status === 'unknown') {
                        validEmails.push(email);
                        ownerEmail = email;
                        dataSources.push('chain_email_pattern');
                        break;
                    }
                } catch { /* skip */ }
                await delay(200);
            }

            layerResults.chainEmailPattern = { attempted, validEmails };
        }
    }

    // Final: Verify the best email we found
    if (ownerEmail) {
        const verified = await verifyAndRecord(ownerEmail, layerResults);

        const status = ownerName && ownerEmail ? 'resolved'
            : ownerEmail ? 'partial'
                : 'failed';
        const confidence = ownerName && verified.isDeliverable ? 'high'
            : ownerEmail ? 'medium'
                : 'low';

        return buildResult(place.id, status, classification, layerResults, dataSources, {
            ownerName, ownerRole, ownerEmail, ownerPhone, ownerLinkedIn,
            companiesHouseNumber, companyName, companyType,
            emailVerified: verified.isDeliverable,
            emailVerificationResult: verified.status,
            overallConfidence: confidence,
            websiteMarkdown, websitePages,
        });
    }

    // Partial: have a name but no email
    if (ownerName) {
        return buildResult(place.id, 'partial', classification, layerResults, dataSources, {
            ownerName, ownerRole, ownerPhone, ownerLinkedIn,
            companiesHouseNumber, companyName, companyType,
            overallConfidence: 'low',
            websiteMarkdown, websitePages,
        });
    }

    // Nothing found
    return buildResult(place.id, 'failed', classification, layerResults, dataSources, {
        ownerName, ownerRole, ownerPhone, ownerLinkedIn,
        companiesHouseNumber, companyName, companyType,
        websiteMarkdown, websitePages,
    });
}

/**
 * Process a batch of businesses with concurrency control.
 */
export async function enrichBatch(
    places: { id: string; name: string; types: string; website: string | null; address: string | null; phone: string | null }[],
    concurrency: number = 3,
    onProgress?: (completed: number, total: number, result: PipelineResult) => void,
): Promise<PipelineResult[]> {
    const results: PipelineResult[] = [];
    let completed = 0;

    // Process in chunks
    for (let i = 0; i < places.length; i += concurrency) {
        const chunk = places.slice(i, i + concurrency);
        const chunkResults = await Promise.all(
            chunk.map(place => enrichBusiness(place).catch(err => {
                return buildResult(place.id, 'failed', classifyBusiness(place.name, place.website, place.types), {} as LayerResults, [], {
                    error: err.message,
                });
            }))
        );

        for (const result of chunkResults) {
            results.push(result);
            completed++;
            onProgress?.(completed, places.length, result);
        }

        // Small delay between batches to respect rate limits
        if (i + concurrency < places.length) {
            await delay(1000);
        }
    }

    return results;
}

/**
 * Save pipeline results to the database.
 */
export async function savePipelineResult(
    result: PipelineResult,
    reportId?: string | null,
): Promise<void> {
    const primaryType = getPrimaryType(result.layerResults.classification ? '' : '');

    await prisma.enrichmentResult.upsert({
        where: {
            placeId_reportId: {
                placeId: result.placeId,
                reportId: reportId || '',
            },
        },
        create: {
            placeId: result.placeId,
            reportId: reportId || null,
            status: result.status,
            chainClassification: result.chainClassification.classification,
            chainName: result.chainClassification.chainName,
            classificationConfidence: result.chainClassification.confidence,
            classificationMethod: result.chainClassification.method,
            ownerName: result.ownerName,
            ownerRole: result.ownerRole,
            ownerEmail: result.ownerEmail,
            ownerPhone: result.ownerPhone,
            ownerLinkedIn: result.ownerLinkedIn,
            companiesHouseNumber: result.companiesHouseNumber,
            companyName: result.companyName,
            companyType: result.companyType,
            emailVerified: result.emailVerified,
            emailVerificationResult: result.emailVerificationResult,
            overallConfidence: result.overallConfidence,
            dataSources: result.dataSources,
            layerResults: result.layerResults as any,
            websiteMarkdown: result.websiteMarkdown,
            websitePages: result.websitePages,
            lastEnrichedAt: new Date(),
            failureReason: result.error || null,
        },
        update: {
            status: result.status,
            chainClassification: result.chainClassification.classification,
            chainName: result.chainClassification.chainName,
            classificationConfidence: result.chainClassification.confidence,
            classificationMethod: result.chainClassification.method,
            ownerName: result.ownerName,
            ownerRole: result.ownerRole,
            ownerEmail: result.ownerEmail,
            ownerPhone: result.ownerPhone,
            ownerLinkedIn: result.ownerLinkedIn,
            companiesHouseNumber: result.companiesHouseNumber,
            companyName: result.companyName,
            companyType: result.companyType,
            emailVerified: result.emailVerified,
            emailVerificationResult: result.emailVerificationResult,
            overallConfidence: result.overallConfidence,
            dataSources: result.dataSources,
            layerResults: result.layerResults as any,
            websiteMarkdown: result.websiteMarkdown,
            websitePages: result.websitePages,
            lastEnrichedAt: new Date(),
            failureReason: result.error || null,
        },
    });
}

// --- Helpers ---

async function verifyAndRecord(email: string, layerResults: LayerResults): Promise<VerificationResult> {
    const result = await verifyEmail(email);
    layerResults.emailVerification = { email, result: result.status };
    return result;
}

function buildResult(
    placeId: string,
    status: PipelineResult['status'],
    classification: ChainClassification,
    layerResults: LayerResults,
    dataSources: string[],
    overrides: Partial<PipelineResult> = {},
): PipelineResult {
    return {
        placeId,
        status,
        ownerName: null,
        ownerRole: null,
        ownerEmail: null,
        ownerPhone: null,
        ownerLinkedIn: null,
        companiesHouseNumber: null,
        companyName: null,
        companyType: null,
        emailVerified: false,
        emailVerificationResult: null,
        chainClassification: classification,
        overallConfidence: 'low',
        dataSources,
        layerResults,
        websiteMarkdown: null,
        websitePages: [],
        ...overrides,
    };
}

/**
 * Extract the city from a UK address for Apollo location filtering.
 * e.g. "64-76 Hendon Way, London NW2 2NL, UK" → "London"
 * e.g. "23 High Street, Ilford IG1 1AA" → "Ilford"
 */
function extractCityFromAddress(address: string | null): string | null {
    if (!address) return null;

    const parts = address.split(',').map(p => p.trim());

    // Common pattern: "Street, City PostCode, Country"
    // or "Street, Area, City PostCode"
    for (const part of parts) {
        // Remove postcode from the part
        const withoutPostcode = part.replace(/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/gi, '').trim();
        // Remove "UK" or "United Kingdom"
        const cleaned = withoutPostcode.replace(/\b(UK|United Kingdom)\b/gi, '').trim();

        // Check for known major UK cities
        const majorCities = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool',
            'Sheffield', 'Bristol', 'Newcastle', 'Glasgow', 'Edinburgh', 'Cardiff',
            'Belfast', 'Nottingham', 'Southampton', 'Leicester', 'Coventry', 'Brighton',
            'Plymouth', 'Derby', 'Wolverhampton', 'Reading', 'Aberdeen', 'Sunderland',
            'Doncaster', 'Ilford', 'Croydon', 'Bromley', 'Ealing', 'Barnet'];

        for (const city of majorCities) {
            if (cleaned.toLowerCase().includes(city.toLowerCase())) {
                return city;
            }
        }

        // If the cleaned part is 3-20 chars and starts with uppercase, likely a city
        if (cleaned.length >= 3 && cleaned.length <= 20 && /^[A-Z]/.test(cleaned)) {
            return cleaned;
        }
    }

    return null;
}

function extractPostcode(address: string | null): string | null {
    if (!address) return null;
    const match = address.match(/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/i);
    return match ? match[0] : null;
}

function extractDomainFromUrl(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
}

function formatDirectorName(name: string): string {
    // Companies House format: "SURNAME, Firstname Middlename" (sometimes with titles)
    const titles = ['mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'professor', 'sir', 'dame', 'lord', 'lady', 'rev'];

    const parts = name.split(',').map(p => p.trim());
    if (parts.length >= 2) {
        // Format surname: UPPER → Title Case
        const rawSurname = parts[0];
        const surname = rawSurname.split(/[\s-]+/).map(w => {
            if (w.length <= 2) return w; // Keep 'De', 'Al' etc
            return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
        }).join(rawSurname.includes('-') ? '-' : ' ');

        // Get first name parts, strip titles
        const firstNameParts = parts[1].split(/\s+/).filter(w =>
            !titles.includes(w.toLowerCase().replace(/\./g, ''))
        );
        const firstName = firstNameParts[0] || '';

        if (firstName) return `${firstName} ${surname}`;
    }

    // Fallback: if it's ALL CAPS, title-case it
    if (name === name.toUpperCase() && name.length > 3) {
        return name.split(/\s+/).map(w =>
            w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        ).join(' ');
    }

    return name;
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Detect hosted/proxy domains where searching Apollo by domain would
 * return employees of the host platform, not the business.
 * e.g. a hotel using Google Sites → searching "sites.google.com" on Apollo
 * returns Google employees, not hotel staff.
 */
function isHostedOrProxyDomain(domain: string): boolean {
    const hostedDomains = [
        // Website builders
        'sites.google.com', 'google.com', 'wix.com', 'wixsite.com',
        'squarespace.com', 'weebly.com', 'wordpress.com', 'wordpress.org',
        'godaddy.com', 'shopify.com', 'myshopify.com',
        'webflow.io', 'carrd.co', 'notion.so', 'notion.site',
        // Social media
        'facebook.com', 'fb.com', 'instagram.com', 'twitter.com',
        'linkedin.com', 'tiktok.com', 'youtube.com',
        // Review/listing platforms
        'yelp.com', 'tripadvisor.com', 'booking.com',
        // Marketplace/aggregator
        'justeat.com', 'deliveroo.com', 'ubereats.com',
        // Free hosting
        'blogspot.com', 'tumblr.com', 'github.io', 'netlify.app',
        'vercel.app', 'herokuapp.com', 'fly.dev',
    ];

    const lower = domain.toLowerCase();
    return hostedDomains.some(hosted => lower === hosted || lower.endsWith(`.${hosted}`));
}

/**
 * Detect government/public sector domains that should be flagged for review.
 */
function isGovernmentDomain(url: string): boolean {
    try {
        const hostname = new URL(url).hostname.toLowerCase();
        return (
            hostname.endsWith('.gov.uk') ||
            hostname.endsWith('.nhs.uk') ||
            hostname.endsWith('.police.uk') ||
            hostname.endsWith('.ac.uk') ||
            hostname.endsWith('.mod.uk') ||
            hostname.endsWith('.parliament.uk') ||
            hostname.includes('council') ||
            hostname.includes('borough')
        );
    } catch {
        return false;
    }
}

/**
 * Extract the area/locality name from an address or business name for
 * constructing chain-specific emails like {area}@domain.
 * 
 * For "Energie Fitness Cricklewood" at "23 Cricklewood Broadway, London"
 * → returns "cricklewood"
 *
 * For "David Lloyd Cricklewood Lane" → returns "cricklewoodlane"
 */
function extractAreaFromAddress(address: string, businessName: string): string | null {
    // Try extracting from business name — find the location-specific suffix
    // Common pattern: "[Chain Name] [Location]" e.g. "Energie Fitness Cricklewood"
    const chainWords = ['fitness', 'gym', 'club', 'hotel', 'inn', 'restaurant', 'cafe', 'bar',
        'pub', 'store', 'shop', 'centre', 'center', 'lodge', 'premier', 'travel',
        'david', 'lloyd', 'energie', 'pure', 'the', 'anytime', 'pizza', 'costa',
        'starbucks', 'mcdonalds', 'subway', 'greggs', 'pret', 'nandos', 'a',
        // City/direction words that are NOT the location-specific part
        'london', 'central', 'east', 'west', 'north', 'south', 'greater',
        'uk', 'best', 'western', 'holiday', 'express', 'hilton', 'marriott',
        'ibis', 'novotel', 'accor', 'hyatt', 'radisson', 'ramada', 'days',
        'gails', 'bakery', 'tesco', 'sainsburys', 'lidl', 'aldi', 'greggs',
        'wetherspoon', 'wetherspoons', 'jd', 'beaten', 'docket'];

    const nameParts = businessName.split(/\s+/);
    // Find where the location part starts — skip parts that are chain-name words
    let locationStart = -1;
    for (let i = 0; i < nameParts.length; i++) {
        const word = nameParts[i].toLowerCase().replace(/[^a-z]/g, '');
        if (word.length > 1 && !chainWords.includes(word)) {
            // Could be the location — check if previous words are chain words
            const prevWords = nameParts.slice(0, i).map(w => w.toLowerCase().replace(/[^a-z]/g, ''));
            const allPrevAreChain = prevWords.every(w => chainWords.includes(w) || w.length <= 1);
            if (allPrevAreChain && i > 0) {
                locationStart = i;
                break;
            }
        }
    }

    if (locationStart >= 0) {
        // Combine all remaining words as the location
        const location = nameParts.slice(locationStart)
            .join('')
            .toLowerCase()
            .replace(/[^a-z]/g, '');
        if (location.length > 3) return location;
    }

    // Fallback: extract from address
    if (address) {
        const parts = address.split(',').map(p => p.trim());
        if (parts.length >= 2) {
            const area = parts[1].toLowerCase().replace(/[^a-z\s]/g, '').trim().replace(/\s+/g, '');
            if (area.length > 3 && area !== 'london' && area !== 'unitedkingdom') {
                return area;
            }
        }
    }

    return null;
}

/**
 * Extract emails from raw text using regex.
 * Safety net for when LLM misses emails that are clearly in the content.
 */
function extractEmailsFromText(text: string, businessDomain: string): string[] {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex) || [];

    const seen = new Set<string>();
    const filtered: string[] = [];

    for (const email of matches) {
        const lower = email.toLowerCase();
        if (seen.has(lower)) continue;
        seen.add(lower);

        // Skip junk
        if (lower.includes('noreply') || lower.includes('no-reply')) continue;
        if (lower.includes('example.com') || lower.includes('test.com')) continue;
        if (lower.includes('sentry.io') || lower.includes('wixpress.com')) continue;
        if (/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js)$/i.test(lower)) continue;
        if (lower.includes('@2x')) continue;

        // Prioritize emails from the business domain
        if (businessDomain && lower.endsWith(`@${businessDomain}`)) {
            filtered.unshift(lower);
        } else {
            filtered.push(lower);
        }
    }

    return filtered;
}

/**
 * Derive email patterns for known chain hotels based on URL and business name.
 * These patterns are verified before use — this is a last-resort fallback
 * for chains where Firecrawl fails to scrape the website.
 */
function deriveChainEmailPatterns(websiteUrl: string, businessName: string, address: string | null): string[] {
    const url = websiteUrl.toLowerCase();
    const city = extractCityFromAddress(address)?.toLowerCase() || '';
    const candidates: string[] = [];

    // Accor hotels (ibis, Novotel, Mercure, Pullman, Sofitel)
    // Pattern: h{hotel_code}@accor.com — extract code from URL
    if (url.includes('accor.com')) {
        const codeMatch = url.match(/code_hotel=(\d+)/) || url.match(/hotel\/(\d+)/);
        if (codeMatch) {
            candidates.push(`h${codeMatch[1]}@accor.com`);
            candidates.push(`H${codeMatch[1]}@accor.com`);
        }
    }

    // Radisson (Radisson Blu, Radisson RED, Park Inn)
    // Pattern: info.{city}@radissonblu.com
    if (url.includes('radissonhotels.com') || url.includes('radissonblu.com')) {
        if (city) {
            candidates.push(`info.${city}@radissonblu.com`);
            candidates.push(`reservations.${city}@radissonblu.com`);
        }
        const locMatch = url.match(/radisson-blu-([a-z-]+)/);
        if (locMatch) {
            const loc = locMatch[1].replace(/-/g, '');
            candidates.push(`info.${loc}@radissonblu.com`);
        }
    }

    // Leonardo Hotels
    // Pattern: {City}{Property}@leonardohotels.com
    // URL: /birmingham/leonardo-royal-hotel-birmingham → BirminghamRoyal@leonardohotels.com
    if (url.includes('leonardo-hotels.com')) {
        const pathMatch = url.match(/leonardo-hotels\.com\/([^\/]+)\/leonardo-([^\/\?]+)/);
        if (pathMatch) {
            const urlCity = pathMatch[1].toLowerCase();
            // Filter out 'hotel' AND the city name from the property part to avoid duplication
            const words = pathMatch[2].split('-').filter((w: string) => w !== 'hotel' && w.toLowerCase() !== urlCity);
            const pascalCase = words.map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
            const cityPascal = urlCity.charAt(0).toUpperCase() + urlCity.slice(1);
            candidates.push(`${cityPascal}${pascalCase}@leonardohotels.com`);
        }
        if (city) {
            candidates.push(`${city}@leonardohotels.com`);
        }
    }

    // Premier Inn
    if (url.includes('premierinn.com')) {
        if (city) {
            candidates.push(`${city}@premierinn.com`);
        }
    }

    // Hilton (Hampton, DoubleTree, Hilton Garden Inn)
    if (url.includes('hilton.com')) {
        if (city) {
            candidates.push(`reservations@hilton${city}.com`);
        }
    }

    return Array.from(new Set(candidates));
}
