import type { EnrichmentResult, Place, Report, ReportLocation } from '@prisma/client';

// --- Sector Detection & Personalisation ---

type SectorKey = 'hotel' | 'restaurant' | 'health' | 'retail' | 'office' | 'generic';

const SECTOR_MAP: Record<string, SectorKey> = {
    'Lodging (Hotels)': 'hotel',
    'Food and Drink': 'restaurant',
    'Health and Wellness': 'health',
    'Shopping (Retail)': 'retail',
    'Business and Professional Services': 'office',
};

const SECTOR_NOUNS: Record<SectorKey, string> = {
    hotel: 'guests',
    restaurant: 'diners',
    health: 'members',
    retail: 'customers',
    office: 'staff',
    generic: 'customers',
};

const SECTOR_PAIN: Record<SectorKey, string> = {
    hotel: 'parking is one of the first things guests ask about when booking',
    restaurant: 'convenient parking makes a real difference to evening bookings',
    health: 'easy parking helps with member retention',
    retail: 'hassle-free parking drives more footfall to your store',
    office: 'staff parking is always a headache and a big cost',
    generic: 'convenient, affordable parking is something your customers value',
};

function getSectorKey(category: string): SectorKey {
    return SECTOR_MAP[category] ?? 'generic';
}

// --- Template Variables ---

export interface TemplateVars {
    firstName: string | null;
    businessName: string;
    carParkName: string;
    postcode: string;
    role: string | null;
    sectorNoun: string;
    sectorPain: string;
    discountLevel: string;
}

export function buildTemplateVars(
    enrichment: EnrichmentResult & { place: Place },
    report: Report,
    location: ReportLocation,
    category: string,
    discountLevel: string,
): TemplateVars {
    const sector = getSectorKey(category);
    let firstName: string | null = null;
    if (enrichment.ownerName) {
        firstName = enrichment.ownerName.split(' ')[0];
    }

    return {
        firstName,
        businessName: enrichment.place.name,
        carParkName: report.name,
        postcode: location.postcode,
        role: enrichment.ownerRole,
        sectorNoun: SECTOR_NOUNS[sector],
        sectorPain: SECTOR_PAIN[sector],
        discountLevel,
    };
}

// --- Email Templates ---

interface EmailStep {
    subject: string;
    body: string;
}

function greeting(v: TemplateVars): string {
    if (v.firstName) return `Hi ${v.firstName},`;
    return `Hi there,`;
}

function signOff(): string {
    return `Best,\nThe ParkBunny Team`;
}

// Email 1: Intro — who we are, what we're offering
function email1(v: TemplateVars): EmailStep {
    const subject = v.firstName
        ? `Parking discount for ${v.businessName} ${v.sectorNoun}`
        : `Partnership opportunity for ${v.businessName}`;

    const body = `${greeting(v)}

I'm reaching out because ParkBunny now manages parking near ${v.businessName} in ${v.postcode}, and I thought this could be useful for you.

We'd like to offer your ${v.sectorNoun} and staff a ${v.discountLevel} discount on parking — ${v.sectorPain}, and we want to make it easier.

There's no cost to you. We simply set up a discount code your ${v.sectorNoun} can use when parking with us.

Would this be of interest? Happy to explain more if you reply to this email.

${signOff()}`;

    return { subject, body };
}

// Email 2: Follow-up — different angle, staff benefit
function email2(v: TemplateVars): EmailStep {
    const subject = v.firstName
        ? `Quick follow up — ${v.firstName}`
        : `Following up — parking for ${v.businessName}`;

    const body = `${greeting(v)}

Just following up on my previous email about discounted parking for ${v.businessName}.

As well as ${v.sectorNoun} parking, this also works really well as a staff benefit — your team would get ${v.discountLevel} off every time they park with us, which can add up quite quickly.

It takes about 5 minutes to set up and there's genuinely no catch — we want more people using our car park, and your ${v.sectorNoun} and staff are the perfect fit.

Worth a quick chat?

${signOff()}`;

    return { subject, body };
}

// Email 3: Break-up — final, short, leaves door open
function email3(v: TemplateVars): EmailStep {
    const subject = v.firstName
        ? `Last one from me, ${v.firstName}`
        : `Last one from me — ${v.businessName}`;

    const body = `${greeting(v)}

I don't want to clog up your inbox, so this will be my last email.

If discounted parking for your ${v.sectorNoun} and staff ever becomes useful, the offer stands — just reply to this email whenever you're ready.

All the best,
The ParkBunny Team`;

    return { subject, body };
}

// --- Public API ---

export function generateSequence(v: TemplateVars): EmailStep[] {
    return [email1(v), email2(v), email3(v)];
}

/**
 * Build the Instantly-compatible sequence format.
 * 3 steps, 3 working days (approximately 5 calendar days with weekends) between each.
 */
export function buildInstantlySequence(v: TemplateVars) {
    const steps = generateSequence(v);

    return {
        steps: steps.map((step, i) => ({
            type: 'email' as const,
            delay: i === 0 ? 0 : 3, // 3 days delay after first email
            variants: [{
                subject: step.subject,
                body: step.body,
            }],
            delay_unit: 'days' as const,
        })),
    };
}
