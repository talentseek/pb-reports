/**
 * Pipeline Test Script
 * 
 * Tests the enrichment pipeline on 5 hand-picked businesses
 * from the database to validate each layer works correctly.
 * 
 * Usage: npx tsx src/scripts/test-pipeline.ts
 */

import prisma from '../lib/db';
import { enrichBusiness, type PipelineResult } from '../lib/enrichment/pipeline';
import { classifyBusiness } from '../lib/enrichment/chainClassifier';

async function main() {
    console.log('=== Spatial-to-Identity Pipeline Test ===\n');

    // Fetch 5 diverse businesses from the DB
    // Mix of: independent with website, chain, no website, different types
    const places = await prisma.place.findMany({
        where: {
            website: { not: null },
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
    });

    if (places.length === 0) {
        console.error('No places found in database. Run a report first.');
        process.exit(1);
    }

    // Pre-classify to get a mix
    const classified = places.map(p => ({
        ...p,
        classification: classifyBusiness(p.name, p.website, p.types),
    }));

    const independents = classified.filter(p => p.classification.classification === 'independent');
    const chains = classified.filter(p => p.classification.classification === 'national_chain');

    // Pick up to 3 independents and 2 chains for diversity
    const testBatch = [
        ...independents.slice(0, 3),
        ...chains.slice(0, 2),
    ].slice(0, 5);

    if (testBatch.length === 0) {
        console.error('Could not build a diverse test batch. Using first 5 places.');
        testBatch.push(...classified.slice(0, 5));
    }

    console.log(`Testing ${testBatch.length} businesses:\n`);

    for (let i = 0; i < testBatch.length; i++) {
        const place = testBatch[i];
        console.log(`--- [${i + 1}/${testBatch.length}] ${place.name} ---`);
        console.log(`  Type: ${place.types}`);
        console.log(`  Website: ${place.website || 'N/A'}`);
        console.log(`  Classification: ${place.classification.classification} (${place.classification.confidence})`);
        if (place.classification.chainName) {
            console.log(`  Chain: ${place.classification.chainName}`);
        }
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
        } catch (err: any) {
            console.log(`  ❌ ERROR: ${err.message}`);
        }

        console.log('');
    }

    // Print summary
    console.log('\n=== Test Complete ===');

    await prisma.$disconnect();
}

function printResult(result: PipelineResult, elapsed: string) {
    const statusIcon = {
        resolved: '✅',
        partial: '🟡',
        failed: '❌',
        needs_review: '🔍',
        skipped: '⏭️',
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

    // Layer details
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
