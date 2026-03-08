/**
 * Website Scraper Service
 * 
 * Orchestrates website scraping via Crawl4AI (primary) and Firecrawl (fallback).
 * Returns raw Markdown content for LLM extraction.
 * 
 * For chains: scrapes the branch-specific URL first (e.g. /gym/cricklewood),
 * then tries generic pages. For independents: scrapes homepage + about + contact.
 */

const CRAWL4AI_URL = process.env.CRAWL4AI_URL || 'http://localhost:11235';
const CRAWL4AI_TOKEN = process.env.CRAWL4AI_API_TOKEN || '';
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || '';

export type ScrapedPage = {
    url: string;
    markdown: string;
    statusCode: number;
    error?: string;
};

export type ScrapeResult = {
    domain: string;
    pages: ScrapedPage[];
    method: 'crawl4ai' | 'firecrawl' | 'failed';
    totalContent: string;
    error?: string;
};

/**
 * Build the list of URLs to scrape.
 * 
 * Key insight: Google Places gives us the BRANCH page URL for chains
 * (e.g. energiefitness.com/gym/cricklewood). We MUST scrape this first
 * because it contains the local manager name and branch email.
 * 
 * For independents, we also try /about and /contact pages.
 */
function buildPageUrls(websiteUrl: string, isChain: boolean): string[] {
    try {
        const url = new URL(websiteUrl);
        const base = `${url.protocol}//${url.host}`;
        const branchPath = url.pathname;

        const urls: string[] = [];

        if (isChain) {
            // For chains: branch page first (most important!), then contact pages, then root fallback
            urls.push(websiteUrl.split('?')[0]); // Branch page without query params

            // Try contact page at the same level
            if (branchPath && branchPath !== '/') {
                const cleanPath = branchPath.replace(/\/$/, '');
                urls.push(`${base}${cleanPath}/contact`);
                urls.push(`${base}${cleanPath}/contact-us`);
            }

            // Root pages as fallback (in case branch page is JS-rendered/blocked)
            urls.push(`${base}/contact`);
            urls.push(`${base}/contact-us`);
            urls.push(`${base}/`);
        } else {
            // For independents: homepage first, then about + contact
            urls.push(`${base}/`);
            urls.push(`${base}/about`);
            urls.push(`${base}/about-us`);
            urls.push(`${base}/contact`);
            urls.push(`${base}/contact-us`);
        }

        // Deduplicate
        return Array.from(new Set(urls));
    } catch {
        return [websiteUrl];
    }
}

/**
 * Scrape a single page via Crawl4AI Docker service.
 */
async function scrapeCrawl4AI(url: string): Promise<ScrapedPage | null> {
    try {
        const response = await fetch(`${CRAWL4AI_URL}/crawl`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(CRAWL4AI_TOKEN ? { Authorization: `Bearer ${CRAWL4AI_TOKEN}` } : {}),
            },
            body: JSON.stringify({
                urls: url,
                priority: 5,
                word_count_threshold: 20,
                extraction_config: { type: 'basic' },
            }),
            signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
            return { url, markdown: '', statusCode: response.status, error: `Crawl4AI HTTP ${response.status}` };
        }

        const data = await response.json();
        const result = data.result || data;

        return {
            url,
            markdown: result.markdown || result.cleaned_html || '',
            statusCode: result.status_code || 200,
        };
    } catch (err: any) {
        return { url, markdown: '', statusCode: 0, error: err.message };
    }
}

/**
 * Scrape a single page via Firecrawl API (fallback).
 */
async function scrapeFirecrawl(url: string): Promise<ScrapedPage | null> {
    if (!FIRECRAWL_API_KEY) {
        return { url, markdown: '', statusCode: 0, error: 'No Firecrawl API key configured' };
    }

    try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            },
            body: JSON.stringify({
                url,
                formats: ['markdown'],
                timeout: 30000,
            }),
            signal: AbortSignal.timeout(35000),
        });

        if (!response.ok) {
            return { url, markdown: '', statusCode: response.status, error: `Firecrawl HTTP ${response.status}` };
        }

        const data = await response.json();

        return {
            url,
            markdown: data.data?.markdown || '',
            statusCode: data.data?.metadata?.statusCode || 200,
        };
    } catch (err: any) {
        return { url, markdown: '', statusCode: 0, error: err.message };
    }
}

/**
 * Scrape a business website.
 * 
 * For chains: scrapes the branch-specific URL first (this is where
 * the local manager name and branch email live), then tries contact pages.
 * 
 * For independents: scrapes homepage, about, contact.
 */
export async function scrapeWebsite(websiteUrl: string, isChain = false): Promise<ScrapeResult> {
    const domain = extractDomainFromUrl(websiteUrl);
    const pageUrls = buildPageUrls(websiteUrl, isChain);
    const pages: ScrapedPage[] = [];
    let method: 'crawl4ai' | 'firecrawl' | 'failed' = 'crawl4ai';

    // Try Crawl4AI first
    let useFallback = false;

    for (const url of pageUrls.slice(0, 3)) {
        const result = await scrapeCrawl4AI(url);
        if (result) {
            if (result.markdown && result.markdown.length > 100) {
                pages.push(result);
            } else if (result.statusCode === 403 || result.statusCode === 0) {
                useFallback = true;
                break;
            }
        }
        await delay(500);
    }

    // Fallback to Firecrawl if Crawl4AI was blocked
    if (useFallback || (pages.length === 0 && FIRECRAWL_API_KEY)) {
        method = 'firecrawl';
        pages.length = 0;

        for (const url of pageUrls.slice(0, 3)) {
            const result = await scrapeFirecrawl(url);
            if (result && result.markdown && result.markdown.length > 100) {
                pages.push(result);
            }
            await delay(500);
        }
    }

    if (pages.length === 0) {
        method = 'failed';
    }

    const totalContent = pages.map(p => `\n--- PAGE: ${p.url} ---\n${p.markdown}`).join('\n');

    return {
        domain,
        pages,
        method,
        totalContent,
        error: pages.length === 0 ? 'No content scraped from any page' : undefined,
    };
}

export function extractDomainFromUrl(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
}

/**
 * Lightweight raw HTML fetch to extract mailto: links.
 * Fallback for when Firecrawl/Crawl4AI strip mailto: href attributes
 * from their markdown output (e.g., social icon email links).
 */
export async function fetchMailtoEmails(url: string): Promise<string[]> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
            },
            signal: AbortSignal.timeout(10000),
            redirect: 'follow',
        });

        if (!response.ok) return [];

        const html = await response.text();

        // Extract all mailto: links from raw HTML
        const mailtoRegex = /mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi;
        const matches: string[] = [];
        let match;

        while ((match = mailtoRegex.exec(html)) !== null) {
            const email = match[1].toLowerCase();
            // Skip junk
            if (email.includes('noreply') || email.includes('no-reply')) continue;
            if (email.includes('example.com')) continue;
            if (!matches.includes(email)) {
                matches.push(email);
            }
        }

        return matches;
    } catch {
        return [];
    }
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
