/**
 * LLM Extraction Service
 * 
 * Uses GPT-4o-mini via OpenRouter to extract structured identity data
 * from scraped website Markdown content.
 * Uses OpenRouter's OpenAI-compatible API.
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export type ExtractedIdentity = {
    ownerName: string | null;
    ownerRole: string | null;
    emails: ExtractedEmail[];
    phones: ExtractedPhone[];
    companyRegistration: string | null;
    vatNumber: string | null;
    socialLinks: {
        linkedin?: string;
        facebook?: string;
        instagram?: string;
        twitter?: string;
    };
    companyName: string | null;
    confidence: 'high' | 'medium' | 'low';
};

export type ExtractedEmail = {
    email: string;
    context: string;
    isGeneric: boolean;
};

export type ExtractedPhone = {
    phone: string;
    context: string;
};

const EXTRACTION_PROMPT = `You are an expert at extracting business contact information from website content. 
Analyze the following scraped website content and extract:

1. **Owner/Manager Name**: The person who runs this specific business location. Look for "About Us", "Meet the team", "Our story", manager bio sections. Look for first names mentioned in casual context ("Jules, Area Manager").
2. **Role/Title**: Their role (Owner, Director, Manager, Founder, Area Manager, Club Manager, General Manager, etc.)
3. **Email Addresses**: ALL email addresses found, noting context (e.g., "listed on contact page", "found in footer", "branch-specific email")
4. **Phone Numbers**: ALL phone numbers found
5. **Company Registration Number**: UK Companies House number if mentioned (format: 8 digits)
6. **VAT Number**: UK VAT number if mentioned (format: GB followed by 9 digits)
7. **Social Media Links**: LinkedIn, Facebook, Instagram, Twitter URLs
8. **Company Name**: The legal company name if different from trading name

IMPORTANT RULES:
- Do NOT guess or fabricate any information
- If a field is not found, return null
- Mark emails as "generic" if they are info@, contact@, hello@, enquiries@ etc.
- Branch-specific emails like cricklewood@chain.com or sales.location@chain.com are NOT generic — mark them as non-generic
- Prefer personal emails (firstname@, firstname.lastname@) over generic ones
- Prefer branch-specific emails (location@chain, sales.location@chain) over company-wide generic emails
- For phone numbers, include UK country code if not present
- Ignore job application emails (careers@, jobs@, recruitment@)
- Ignore "noreply@" addresses

Return a JSON object matching this exact schema:
{
  "ownerName": string | null,
  "ownerRole": string | null,
  "emails": [{ "email": string, "context": string, "isGeneric": boolean }],
  "phones": [{ "phone": string, "context": string }],
  "companyRegistration": string | null,
  "vatNumber": string | null,
  "socialLinks": { "linkedin": string?, "facebook": string?, "instagram": string?, "twitter": string? },
  "companyName": string | null,
  "confidence": "high" | "medium" | "low"
}

Set confidence to:
- "high" if you found a named person with a direct email
- "medium" if you found emails but no named person, or found a person but no direct email
- "low" if you only found generic contact info or very little data`;

const CHAIN_CONTEXT_PROMPT = `
IMPORTANT — CHAIN BRANCH CONTEXT:
This is a BRANCH of a national chain. We need LOCAL branch information, NOT head office contacts.
- Look specifically for the branch/club/store/hotel manager or area manager for THIS location
- Branch-specific emails like "location@company.com" or "sales.location@company.com" are HIGH VALUE
- Ignore HQ-level generic emails (info@chain.com, customerservice@chain.com)
- Look for names mentioned with local roles ("Jules, Area Manager at Cricklewood")
- If the page says "locally-owned" or "franchised", note the owner/franchisee name
`;

/**
 * Extract identity data from scraped website content using GPT-4o-mini.
 */
export async function extractIdentity(
    websiteContent: string,
    businessName: string,
    businessAddress?: string | null,
    isChain = false,
): Promise<ExtractedIdentity> {
    const maxChars = 12000;
    const truncatedContent = websiteContent.length > maxChars
        ? websiteContent.slice(0, maxChars) + '\n\n[CONTENT TRUNCATED]'
        : websiteContent;

    try {
        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://app.parkbunnyreports.com',
                'X-Title': 'ParkBunny Enrichment Pipeline',
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [
                    { role: 'system', content: EXTRACTION_PROMPT + (isChain ? CHAIN_CONTEXT_PROMPT : '') },
                    {
                        role: 'user',
                        content: `Business: "${businessName}"${businessAddress ? `\nAddress: ${businessAddress}` : ''}\n\n--- WEBSITE CONTENT ---\n${truncatedContent}`,
                    },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.1,
                max_tokens: 1000,
            }),
            signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            return emptyResult();
        }

        const parsed = JSON.parse(content) as ExtractedIdentity;

        return {
            ownerName: parsed.ownerName || null,
            ownerRole: parsed.ownerRole || null,
            emails: Array.isArray(parsed.emails) ? parsed.emails.filter(e => isValidEmail(e.email)) : [],
            phones: Array.isArray(parsed.phones) ? parsed.phones : [],
            companyRegistration: parsed.companyRegistration || null,
            vatNumber: parsed.vatNumber || null,
            socialLinks: parsed.socialLinks || {},
            companyName: parsed.companyName || null,
            confidence: (['high', 'medium', 'low'] as const).includes(parsed.confidence as any)
                ? parsed.confidence
                : 'low',
        };
    } catch (err: any) {
        console.error(`LLM extraction failed for "${businessName}":`, err.message);
        return emptyResult();
    }
}

function emptyResult(): ExtractedIdentity {
    return {
        ownerName: null,
        ownerRole: null,
        emails: [],
        phones: [],
        companyRegistration: null,
        vatNumber: null,
        socialLinks: {},
        companyName: null,
        confidence: 'low',
    };
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
