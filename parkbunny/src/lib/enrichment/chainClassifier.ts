/**
 * UK Chain Lookup Table
 * 
 * Used by the chain classifier to detect national/regional chains
 * by matching business name or website domain.
 * 
 * Generated programmatically — review quarterly for rebrands.
 */
const UK_CHAINS: Record<string, { name: string; domains: string[]; aliases?: string[] }[]> = {
    hospitality: [
        { name: "Travelodge", domains: ["travelodge.co.uk"] },
        { name: "Premier Inn", domains: ["premierinn.com"], aliases: ["Premier Inn"] },
        { name: "Holiday Inn", domains: ["ihg.com"], aliases: ["Holiday Inn Express"] },
        { name: "Hilton", domains: ["hilton.com"], aliases: ["DoubleTree", "Hampton by Hilton", "Hilton Garden Inn"] },
        { name: "Marriott", domains: ["marriott.com"], aliases: ["Courtyard by Marriott", "Residence Inn"] },
        { name: "Best Western", domains: ["bestwestern.co.uk"] },
        { name: "Novotel", domains: ["novotel.com", "accor.com"], aliases: ["ibis", "ibis budget", "Mercure"] },
        { name: "easyHotel", domains: ["easyhotel.com"] },
        { name: "Jurys Inn", domains: ["jurysinn.com", "leonardohotels.com"], aliases: ["Leonardo Hotel"] },
        { name: "Whitbread", domains: ["whitbread.co.uk"] },
        { name: "IHG", domains: ["ihg.com"], aliases: ["Crowne Plaza", "Staybridge Suites"] },
        { name: "Moxy Hotels", domains: ["marriott.com"] },
        { name: "citizenM", domains: ["citizenm.com"] },
        { name: "Radisson", domains: ["radissonhotels.com"], aliases: ["Radisson Blu", "Park Inn by Radisson"] },
    ],
    pubs_and_bars: [
        { name: "Wetherspoons", domains: ["jdwetherspoon.com"], aliases: ["JD Wetherspoon", "J D Wetherspoon"] },
        { name: "Greene King", domains: ["greeneking.co.uk"], aliases: ["Greene King Pub"] },
        { name: "Mitchells & Butlers", domains: ["mbplc.com"], aliases: ["Harvester", "Toby Carvery", "All Bar One", "Miller & Carter", "Sizzling Pubs", "Stonehouse", "Ember Inns", "Browns", "Nicholson's"] },
        { name: "Stonegate Group", domains: ["stonegatepubs.com"], aliases: ["Slug & Lettuce", "Walkabout", "Be At One", "Yates's", "Classic Inns"] },
        { name: "Marston's", domains: ["marstons.co.uk"], aliases: ["Marston's Pub"] },
        { name: "Punch Pubs", domains: ["punchpubs.com"] },
        { name: "Star Pubs & Bars", domains: ["starpubs.co.uk"] },
        { name: "Ei Group", domains: ["eigroup.co.uk"] },
        { name: "Young's", domains: ["youngs.co.uk"] },
        { name: "Fuller's", domains: ["fullers.co.uk"] },
        { name: "Shepherd Neame", domains: ["shepherdneame.co.uk"] },
        { name: "Revolution Bars", domains: ["revolution-bars.co.uk"] },
    ],
    restaurants: [
        { name: "McDonald's", domains: ["mcdonalds.com", "mcdonalds.co.uk"] },
        { name: "KFC", domains: ["kfc.co.uk"] },
        { name: "Burger King", domains: ["burgerking.co.uk"] },
        { name: "Nando's", domains: ["nandos.co.uk"] },
        { name: "Pizza Hut", domains: ["pizzahut.co.uk"] },
        { name: "Domino's", domains: ["dominos.co.uk"] },
        { name: "Subway", domains: ["subway.com", "subway.co.uk"] },
        { name: "Pizza Express", domains: ["pizzaexpress.com"] },
        { name: "Wagamama", domains: ["wagamama.com"] },
        { name: "Five Guys", domains: ["fiveguys.co.uk"] },
        { name: "Byron", domains: ["byron.co.uk"] },
        { name: "GBK", domains: ["gbk.co.uk"], aliases: ["Gourmet Burger Kitchen"] },
        { name: "Pret A Manger", domains: ["pret.co.uk", "pret.com"] },
        { name: "Greggs", domains: ["greggs.co.uk"] },
        { name: "Costa Coffee", domains: ["costa.co.uk"] },
        { name: "Starbucks", domains: ["starbucks.co.uk"] },
        { name: "Caffè Nero", domains: ["caffenero.com"], aliases: ["Caffe Nero"] },
        { name: "Leon", domains: ["leon.co"] },
        { name: "Honest Burgers", domains: ["honestburgers.co.uk"] },
        { name: "Tortilla", domains: ["tortilla.co.uk"] },
        { name: "itsu", domains: ["itsu.com"] },
        { name: "Wasabi", domains: ["wasabi.uk.com"] },
        { name: "Franco Manca", domains: ["francomanca.co.uk"] },
        { name: "The Restaurant Group", domains: ["trgplc.com"], aliases: ["Frankie & Benny's", "Chiquito", "Garfunkel's"] },
        { name: "Yo! Sushi", domains: ["yosushi.com"] },
        { name: "Bella Italia", domains: ["bellaitalia.co.uk"] },
        { name: "Zizzi", domains: ["zizzi.co.uk"] },
        { name: "ASK Italian", domains: ["askitalian.co.uk"] },
        { name: "Prezzo", domains: ["prezzorestaurants.co.uk"] },
        { name: "TGI Friday's", domains: ["tgifridays.co.uk"], aliases: ["TGI Fridays"] },
        { name: "Beefeater", domains: ["beefeater.co.uk"] },
        { name: "Brewers Fayre", domains: ["brewersfayre.co.uk"] },
        { name: "Table Table", domains: ["tabletable.co.uk"] },
        { name: "GAIL's", domains: ["gails.com"], aliases: ["GAIL's Bakery", "Gails Bakery", "Gail's"] },
    ],
    retail: [
        { name: "Tesco", domains: ["tesco.com"], aliases: ["Tesco Express", "Tesco Extra", "Tesco Metro"] },
        { name: "Sainsbury's", domains: ["sainsburys.co.uk"], aliases: ["Sainsbury's Local"] },
        { name: "ASDA", domains: ["asda.com"] },
        { name: "Morrisons", domains: ["morrisons.com"] },
        { name: "Aldi", domains: ["aldi.co.uk"] },
        { name: "Lidl", domains: ["lidl.co.uk"] },
        { name: "Waitrose", domains: ["waitrose.com"], aliases: ["Waitrose & Partners"] },
        { name: "M&S", domains: ["marksandspencer.com"], aliases: ["Marks & Spencer", "Marks and Spencer", "M&S Simply Food"] },
        { name: "Co-op", domains: ["coop.co.uk"], aliases: ["The Co-operative"] },
        { name: "Boots", domains: ["boots.com"] },
        { name: "Superdrug", domains: ["superdrug.com"] },
        { name: "WHSmith", domains: ["whsmith.co.uk"], aliases: ["WH Smith"] },
        { name: "Next", domains: ["next.co.uk"] },
        { name: "Primark", domains: ["primark.com"] },
        { name: "Sports Direct", domains: ["sportsdirect.com"], aliases: ["Frasers Group"] },
        { name: "B&M", domains: ["bmstores.co.uk"], aliases: ["B&M Bargains"] },
        { name: "Home Bargains", domains: ["homebargains.co.uk"] },
        { name: "Poundland", domains: ["poundland.co.uk"] },
        { name: "Wilko", domains: ["wilko.com"] },
        { name: "Argos", domains: ["argos.co.uk"] },
        { name: "Currys", domains: ["currys.co.uk"], aliases: ["Currys PC World"] },
        { name: "John Lewis", domains: ["johnlewis.com"], aliases: ["John Lewis & Partners"] },
        { name: "Halfords", domains: ["halfords.com"] },
        { name: "B&Q", domains: ["diy.com"] },
        { name: "Homebase", domains: ["homebase.co.uk"] },
        { name: "The Range", domains: ["therange.co.uk"] },
        { name: "TK Maxx", domains: ["tkmaxx.com"] },
        { name: "Card Factory", domains: ["cardfactory.co.uk"] },
        { name: "Holland & Barrett", domains: ["hollandandbarrett.com"] },
        { name: "Specsavers", domains: ["specsavers.co.uk"] },
    ],
    fitness: [
        { name: "PureGym", domains: ["puregym.com"] },
        { name: "The Gym Group", domains: ["thegymgroup.com"] },
        { name: "David Lloyd", domains: ["davidlloyd.co.uk"] },
        { name: "Virgin Active", domains: ["virginactive.co.uk"] },
        { name: "Nuffield Health", domains: ["nuffieldhealth.com"] },
        { name: "Bannatyne", domains: ["bannatyne.co.uk"] },
        { name: "Anytime Fitness", domains: ["anytimefitness.co.uk"] },
        { name: "JD Gyms", domains: ["jdgyms.co.uk"] },
        { name: "Energie Fitness", domains: ["energiefitness.com"] },
        { name: "Snap Fitness", domains: ["snapfitness.com"] },
        { name: "énergie Fitness", domains: ["energiefitness.com"] },
        { name: "Fitness First", domains: ["fitnessfirst.co.uk"] },
    ],
    healthcare: [
        { name: "Boots Opticians", domains: ["bootsonline.com", "boots.com"] },
        { name: "Vision Express", domains: ["visionexpress.com"] },
        { name: "Bupa", domains: ["bupa.co.uk"], aliases: ["Bupa Dental Care", "Bupa Health Clinics"] },
        { name: "Lloyds Pharmacy", domains: ["lloydspharmacy.com"] },
        { name: "Well Pharmacy", domains: ["well.co.uk"] },
        { name: "mydentist", domains: ["mydentist.co.uk"] },
        { name: "Superdrug Health Clinic", domains: ["superdrug.com"] },
    ],
    automotive: [
        { name: "Kwik Fit", domains: ["kwik-fit.com"] },
        { name: "Halfords Autocentres", domains: ["halfords.com"] },
        { name: "National Tyres", domains: ["national.co.uk"] },
        { name: "Arnold Clark", domains: ["arnoldclark.com"] },
        { name: "Evans Halshaw", domains: ["evanshalshaw.com"] },
        { name: "Lookers", domains: ["lookers.co.uk"] },
        { name: "Pendragon", domains: ["pendragon.uk.com"], aliases: ["Stratstone", "Evans Halshaw"] },
        { name: "Enterprise Rent-A-Car", domains: ["enterprise.co.uk"] },
        { name: "Europcar", domains: ["europcar.co.uk"] },
        { name: "Sixt", domains: ["sixt.co.uk"] },
    ],
    services: [
        { name: "Royal Mail", domains: ["royalmail.com"] },
        { name: "Hermes", domains: ["evri.com"], aliases: ["Evri"] },
        { name: "DPD", domains: ["dpd.co.uk"] },
        { name: "Barclays", domains: ["barclays.co.uk"] },
        { name: "HSBC", domains: ["hsbc.co.uk"] },
        { name: "NatWest", domains: ["natwest.com"] },
        { name: "Lloyds Bank", domains: ["lloydsbank.com"] },
        { name: "Halifax", domains: ["halifax.co.uk"] },
        { name: "Nationwide", domains: ["nationwide.co.uk"] },
        { name: "Santander", domains: ["santander.co.uk"] },
    ],
    coworking: [
        { name: "WeWork", domains: ["wework.com"] },
        { name: "Regus", domains: ["regus.com", "regus.co.uk"] },
        { name: "IWG", domains: ["iwgplc.com"], aliases: ["Spaces", "HQ", "Signature"] },
    ],
};

// Build fast lookup indexes
function buildLookups() {
    const nameIndex = new Map<string, { sector: string; chain: string }>();
    const domainIndex = new Map<string, { sector: string; chain: string }>();

    for (const [sector, chains] of Object.entries(UK_CHAINS)) {
        for (const chain of chains) {
            // Index by canonical name (lowercase)
            nameIndex.set(chain.name.toLowerCase(), { sector, chain: chain.name });

            // Index by aliases
            if (chain.aliases) {
                for (const alias of chain.aliases) {
                    nameIndex.set(alias.toLowerCase(), { sector, chain: chain.name });
                }
            }

            // Index by domain
            for (const domain of chain.domains) {
                domainIndex.set(domain.toLowerCase(), { sector, chain: chain.name });
            }
        }
    }

    return { nameIndex, domainIndex };
}

const { nameIndex, domainIndex } = buildLookups();

export type ChainClassification = {
    classification: 'independent' | 'local_group' | 'national_chain';
    chainName: string | null;
    confidence: 'high' | 'medium' | 'low';
    method: 'lookup_table' | 'domain_cluster' | 'google_chains' | 'heuristic' | 'default';
    sector: string | null;
};

/**
 * Extract the root domain from a full URL.
 * e.g. "https://www.travelodge.co.uk/hotels/123" → "travelodge.co.uk"
 */
function extractRootDomain(url: string): string | null {
    try {
        const hostname = new URL(url).hostname.replace(/^www\./, '');
        // Handle subdomains: keep last 2 parts (or 3 for .co.uk)
        const parts = hostname.split('.');
        if (parts.length >= 3 && parts[parts.length - 2] === 'co') {
            return parts.slice(-3).join('.');
        }
        return parts.slice(-2).join('.');
    } catch {
        return null;
    }
}

// Domains that are platforms, not business websites
const PLATFORM_DOMAINS = new Set([
    'booking.com', 'hotels.com', 'tripadvisor.com', 'trivago.co.uk',
    'justeat.co.uk', 'deliveroo.co.uk', 'ubereats.com',
    'facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com',
    'yelp.com', 'google.com', 'yell.com', 'checkatrade.com',
    'wix.com', 'squarespace.com', 'weebly.com', 'wordpress.com',
    'shopify.com', 'godaddy.com', 'ionos.com', '123-reg.co.uk',
    'opentable.com', 'resy.com', 'designmynight.com',
    'treatwell.co.uk', 'fresha.com', 'mindbodyonline.com',
    'gumtree.com', 'yell.com', 'thomsonlocal.com',
]);

/**
 * Classify a business as independent, local group, or national chain.
 * Uses a multi-signal approach:
 * 1. Lookup table match (highest confidence)
 * 2. Domain match against known chain domains
 * 3. Name substring match against chain names/aliases
 * 4. Default to independent
 */
export function classifyBusiness(
    name: string,
    website: string | null | undefined,
    types: string | string[]
): ChainClassification {
    const nameLower = name.toLowerCase().trim();
    const typesArray = Array.isArray(types) ? types : types.split(',').map(t => t.trim());

    // 1. Exact name match against lookup table
    const exactMatch = nameIndex.get(nameLower);
    if (exactMatch) {
        return {
            classification: 'national_chain',
            chainName: exactMatch.chain,
            confidence: 'high',
            method: 'lookup_table',
            sector: exactMatch.sector,
        };
    }

    // 2. Domain match
    if (website) {
        const domain = extractRootDomain(website);
        if (domain) {
            // Skip platform domains
            if (PLATFORM_DOMAINS.has(domain)) {
                // Platform domain means we can't determine from website
                // Fall through to name matching
            } else {
                const domainMatch = domainIndex.get(domain);
                if (domainMatch) {
                    return {
                        classification: 'national_chain',
                        chainName: domainMatch.chain,
                        confidence: 'high',
                        method: 'lookup_table',
                        sector: domainMatch.sector,
                    };
                }
            }
        }
    }

    // 3. Substring name match (e.g., "Travelodge London Cricklewood" contains "Travelodge")
    for (const [key, value] of Array.from(nameIndex)) {
        if (nameLower.includes(key) && key.length >= 4) {
            return {
                classification: 'national_chain',
                chainName: value.chain,
                confidence: 'medium',
                method: 'lookup_table',
                sector: value.sector,
            };
        }
    }

    // 4. Default — independent
    return {
        classification: 'independent',
        chainName: null,
        confidence: 'low',
        method: 'default',
        sector: null,
    };
}

/**
 * Get chain classification stats for a batch of businesses.
 */
export function classifyBatch(businesses: { name: string; website: string | null; types: string }[]): {
    results: (ChainClassification & { businessName: string })[];
    stats: { independent: number; national_chain: number; local_group: number };
} {
    const results = businesses.map(b => ({
        ...classifyBusiness(b.name, b.website, b.types),
        businessName: b.name,
    }));

    const stats = {
        independent: results.filter(r => r.classification === 'independent').length,
        national_chain: results.filter(r => r.classification === 'national_chain').length,
        local_group: results.filter(r => r.classification === 'local_group').length,
    };

    return { results, stats };
}

export { UK_CHAINS, PLATFORM_DOMAINS, extractRootDomain };
