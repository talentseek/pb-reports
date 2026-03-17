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

// --- Email Templates using Instantly {{variable}} syntax ---
// These use Instantly's merge tag syntax so each lead gets personalised content.
// Variables available on each lead: {{first_name}}, {{company_name}}
// Custom variables: {{businessName}}, {{carParkName}}, {{postcode}},
//                   {{sectorNoun}}, {{sectorPain}}, {{discountLevel}}

interface EmailStep {
    subject: string;
    body: string;
}

function email1(): EmailStep {
    const subject = `Parking discount for {{company_name}} {{sectorNoun}}`;

    const body = `Hi {{first_name | there}},

I'm reaching out because ParkBunny now manages parking near {{company_name}} in {{postcode}}, and I thought this could be useful for you.

We'd like to offer your {{sectorNoun}} and staff a {{discountLevel}} discount on parking — {{sectorPain}}, and we want to make it easier.

There's no cost to you. We simply set up a discount code your {{sectorNoun}} can use when parking with us.

Would this be of interest? Happy to explain more if you reply to this email.

Best,
The ParkBunny Team`;

    return { subject, body };
}

function email2(): EmailStep {
    const subject = `Quick follow up — parking for {{company_name}}`;

    const body = `Hi {{first_name | there}},

Just following up on my previous email about discounted parking for {{company_name}}.

As well as {{sectorNoun}} parking, this also works really well as a staff benefit — your team would get {{discountLevel}} off every time they park with us, which can add up quite quickly.

It takes about 5 minutes to set up and there's genuinely no catch — we want more people using our car park, and your {{sectorNoun}} and staff are the perfect fit.

Worth a quick chat?

Best,
The ParkBunny Team`;

    return { subject, body };
}

function email3(): EmailStep {
    const subject = `Last one from me — {{company_name}}`;

    const body = `Hi {{first_name | there}},

I don't want to clog up your inbox, so this will be my last email.

If discounted parking for your {{sectorNoun}} and staff ever becomes useful, the offer stands — just reply to this email whenever you're ready.

All the best,
The ParkBunny Team`;

    return { subject, body };
}

// --- Public API ---

export function generateSequence(v: TemplateVars): EmailStep[] {
    // These are for preview purposes — replace merge tags with actual values
    const steps = [email1(), email2(), email3()];
    return steps.map(step => ({
        subject: replaceTags(step.subject, v),
        body: replaceTags(step.body, v),
    }));
}

function replaceTags(template: string, v: TemplateVars): string {
    return template
        .replace(/\{\{first_name \| there\}\}/g, v.firstName ?? 'there')
        .replace(/\{\{first_name\}\}/g, v.firstName ?? '')
        .replace(/\{\{company_name\}\}/g, v.businessName)
        .replace(/\{\{businessName\}\}/g, v.businessName)
        .replace(/\{\{carParkName\}\}/g, v.carParkName)
        .replace(/\{\{postcode\}\}/g, v.postcode)
        .replace(/\{\{sectorNoun\}\}/g, v.sectorNoun)
        .replace(/\{\{sectorPain\}\}/g, v.sectorPain)
        .replace(/\{\{discountLevel\}\}/g, v.discountLevel);
}

/**
 * Build the Instantly-compatible sequence format.
 * Uses {{variable}} merge tags — Instantly interpolates per-lead at send time.
 * 3 steps, 3 working days between each.
 */
export function buildInstantlySequence(_v: TemplateVars) {
    // Use raw templates with merge tags — Instantly personalises per lead
    const steps = [email1(), email2(), email3()];

    return {
        steps: steps.map((step, i) => ({
            type: 'email' as const,
            delay: i === 0 ? 0 : 3,
            variants: [{
                subject: step.subject,
                body: step.body,
            }],
            delay_unit: 'days' as const,
        })),
    };
}
