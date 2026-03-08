/**
 * Pipeline Test Script — 10 diverse businesses
 * 
 * Tests the enrichment pipeline on a broader mix:
 * pubs, restaurants, hotels, dental, guest houses, retail, chains
 * 
 * Usage: npx tsx src/scripts/test-pipeline-10.ts
 */

import prisma from '../lib/db';
import { enrichBusiness, type PipelineResult } from '../lib/enrichment/pipeline';
import { classifyBusiness } from '../lib/enrichment/chainClassifier';

// Hand-picked diverse businesses from the database
const TARGET_NAMES = [
    // Restaurants/food (independents)
    'Demi\'s Nigerian Restaurant & Bar',
    'Taste of fish',
    'Amouage Lounge',
    // Pubs
    'The Beaten Docket London',
    // Hotels (mix of independent & chain)
    'Best Western Palm Hotel',
    'Travelodge London Cricklewood',
    'Gladstone Lodge Guest House',
    // Medical
    'Cricklewood Dental Practice',
    // Retail (chains)
    'GAIL\'s Bakery Willesden Green',
    // Entertainment
    'Zombie Games Cafe & Bar',
];

async function main() {
    console.log('=== Spatial-to-Identity Pipeline Test — 10 Diverse Businesses ===\n');

    const allPlaces = await prisma.place.findMany({
        where: { website: { not: null } },
        select: { id: true, name: true, types: true, website: true, address: true, phone: true },
    });

    // Match target names
    const testBatch = TARGET_NAMES
        .map(target => allPlaces.find(p => p.name.includes(target.substring(0, 15))))
        .filter(Boolean) as typeof allPlaces;

    console.log(`Found ${testBatch.length}/${TARGET_NAMES.length} target businesses\n`);

    const results: { name: string; result: PipelineResult; elapsed: string }[] = [];

    for (let i = 0; i < testBatch.length; i++) {
        const place = testBatch[i];
        const classification = classifyBusiness(place.name, place.website, place.types);

        console.log(`--- [${i + 1}/${testBatch.length}] ${place.name} ---`);
        console.log(`  Type: ${JSON.parse(place.types || '[]')[0] || '?'}`);
        console.log(`  Website: ${place.website || 'N/A'}`);
        console.log(`  Classification: ${classification.classification} (${classification.confidence})`);
        if (classification.chainName) console.log(`  Chain: ${classification.chainName}`);
        console.log('');

        try {
            const start = Date.now();
            const result = await enrichBusiness({
                id: place.id,
                name: place.name,
                types: place.types,
                website: place.website,
                address: place.address,
                phone: place.phone,
            });
            const elapsed = ((Date.now() - start) / 1000).toFixed(1);

            printResult(result, elapsed);
            results.push({ name: place.name, result, elapsed });
        } catch (err: any) {
            console.log(`  ❌ ERROR: ${err.message}`);
        }

        console.log('');
    }

    // Summary
    console.log('\n=== SUMMARY ===');
    const resolved = results.filter(r => r.result.status === 'resolved').length;
    const partial = results.filter(r => r.result.status === 'partial').length;
    const failed = results.filter(r => r.result.status === 'failed').length;
    const skipped = results.filter(r => r.result.status === 'skipped').length;

    console.log(`✅ Resolved: ${resolved}/${results.length}`);
    console.log(`🟡 Partial:  ${partial}/${results.length}`);
    console.log(`❌ Failed:   ${failed}/${results.length}`);
    if (skipped > 0) console.log(`⏭️ Skipped:  ${skipped}/${results.length}`);

    console.log('\n--- Detail ---');
    for (const { name, result } of results) {
        const icon = result.status === 'resolved' ? '✅' : result.status === 'partial' ? '🟡' : result.status === 'skipped' ? '⏭️' : '❌';
        const email = result.ownerEmail || 'no email';
        const owner = result.ownerName || 'no name';
        console.log(`${icon} ${name.substring(0, 35).padEnd(35)} | ${owner.padEnd(25)} | ${email}`);
    }

    console.log('\n=== Test Complete ===');
    await prisma.$disconnect();
}

function printResult(result: PipelineResult, elapsed: string) {
    const statusIcon: Record<string, string> = {
        resolved: '✅', partial: '🟡', failed: '❌', needs_review: '🔍', skipped: '⏭️',
    };

    console.log(`  Status: ${statusIcon[result.status]} ${result.status} (${elapsed}s)`);
    console.log(`  Confidence: ${result.overallConfidence}`);
    console.log(`  Data sources: [${result.dataSources.join(', ')}]`);

    if (result.ownerName) console.log(`  👤 Owner: ${result.ownerName} (${result.ownerRole || 'N/A'})`);
    if (result.ownerEmail) console.log(`  📧 Email: ${result.ownerEmail} (verified: ${result.emailVerified})`);
    if (result.ownerPhone) console.log(`  📞 Phone: ${result.ownerPhone}`);
    if (result.ownerLinkedIn) console.log(`  🔗 LinkedIn: ${result.ownerLinkedIn}`);
    if (result.companiesHouseNumber) console.log(`  🏛️  CH#: ${result.companiesHouseNumber}`);
    if (result.companyName) console.log(`  🏢 Company: ${result.companyName} (${result.companyType || '?'})`);

    const lr = result.layerResults;
    if (lr.websiteScrape) {
        console.log(`  [L1] Scrape: ${lr.websiteScrape.method}, ${lr.websiteScrape.pagesScraped} pages ${lr.websiteScrape.error ? '⚠️ ' + lr.websiteScrape.error : ''}`);
    }
    if (lr.llmExtraction) {
        console.log(`  [L1] LLM: confidence=${lr.llmExtraction.confidence}, name=${lr.llmExtraction.foundName}, email=${lr.llmExtraction.foundEmail}, CH#=${lr.llmExtraction.foundCompanyNumber}, VAT=${lr.llmExtraction.foundVatNumber}`);
    }
    if (lr.companiesHouse) {
        console.log(`  [L2] CH: found=${lr.companiesHouse.found}, score=${lr.companiesHouse.matchScore}, officers=${lr.companiesHouse.officerCount} ${lr.companiesHouse.error ? '⚠️ ' + lr.companiesHouse.error : ''}`);
    }
    if (lr.vatTrace) {
        console.log(`  [L5] VAT: found=${lr.vatTrace.found}, number=${lr.vatTrace.vatNumber}, company=${lr.vatTrace.companyName || 'N/A'} ${lr.vatTrace.error ? '⚠️ ' + lr.vatTrace.error : ''}`);
    }
    if (lr.apollo) {
        console.log(`  [L3] Apollo: found=${lr.apollo.found}, people=${lr.apollo.peopleCount}, credits=${lr.apollo.creditsUsed} ${lr.apollo.error ? '⚠️ ' + lr.apollo.error : ''}`);
    }
    if (lr.emailConstruction) {
        console.log(`  [L4] Email construction: attempted=[${lr.emailConstruction.attempted.join(', ')}], valid=[${lr.emailConstruction.validEmails.join(', ')}]`);
    }
    if (lr.emailVerification) {
        console.log(`  [Verify] ${lr.emailVerification.email} → ${lr.emailVerification.result}`);
    }
    if (result.error) {
        console.log(`  ⚠️ Error: ${result.error}`);
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
