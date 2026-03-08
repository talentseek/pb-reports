# PLAN: Spatial-to-Identity Enrichment Pipeline

> Resolve Google Places pins into verified decision-makers with contact details.

## Background

ParkBunny has ~10,115 businesses across car park reports. Currently, the platform has a partial enrichment system built on **Outscraper** (which failed) and a basic chain classifier (`businessAnalyzer.ts`). This plan replaces that with a multi-source waterfall pipeline that maximises identity resolution accuracy.

### What Exists (and What We're Replacing)

| Component | Current State | Action |
|-----------|--------------|--------|
| `hybridEnrichmentService.ts` | Outscraper + Google Search hybrid | **Replace** — new waterfall pipeline |
| `businessAnalyzer.ts` | Keyword-based chain detection (4-tier) | **Replace** — new chain classifier with lookup table + domain clustering |
| `outscraper.ts` | Outscraper API client | **Remove** — not used in new pipeline |
| `googleSearchService.ts` | Google Custom Search API | **Keep** — useful as supplementary data |
| `EnrichmentStep.tsx` | Campaign-centric enrichment UI | **Redesign** — report-centric enrichment tab |
| `BusinessSelectionClient.tsx` | Business selection with checkboxes | **Reuse** — adapt for enrichment selection |
| Place model enrichment fields | `email`, `phone`, `socialLinks`, `enrichedAt`, `enrichmentStatus` | **Keep** — add `EnrichmentResult` model alongside |
| `/api/outreach/enrich` | Campaign-based POST endpoint | **Replace** — report-based enrichment API |

### Key Decisions (From Brainstorm)

- **UI**: Report tab (Phase 1) + Global dashboard (Phase 2)
- **Trigger**: API endpoint + dashboard button
- **Scraping**: Crawl4AI (primary, free) + Firecrawl (fallback, paid)
- **Schema**: Separate `EnrichmentResult` model (Option B)
- **Verification**: Reoon (user has credits)
- **People Search**: Apollo.io (upgrading to Basic $49/mo)
- **Company Data**: Companies House API (user has key)
- **Processing**: Per-report with business type selection
- **Review**: Human in the loop for low-scoring prospects

---

## Phase 1: Foundation (Schema + Chain Classifier)

> Goal: Classify all businesses and build the data layer. No API calls yet.

### 1.1 Database Schema

#### [NEW] `prisma/schema.prisma` — Add `EnrichmentResult` model

```prisma
model EnrichmentResult {
  id                  String   @id @default(cuid())
  placeId             String
  place               Place    @relation(fields: [placeId], references: [id])
  reportId            String?
  report              Report?  @relation(fields: [reportId], references: [id])
  
  // Classification
  businessType        String?  // Primary Google type (from type priority order)
  allTypes            Json?    // All Google types array
  chainClassification String?  // "independent" | "local_group" | "national_chain"
  chainName           String?  // "Travelodge", "PureGym", etc.
  classificationConfidence String? // "high" | "medium" | "low"
  classificationMethod String? // "lookup_table" | "domain_cluster" | "google_chains" | "manual"
  
  // Resolved Identity
  ownerName           String?
  ownerRole           String?
  ownerEmail          String?
  ownerPhone          String?
  ownerLinkedIn       String?
  
  // Company Data
  companiesHouseNumber String?
  companyName         String?
  companyType         String?  // "ltd" | "llp" | "plc" | "sole_trader" | "unknown"
  sicCodes            Json?
  directors           Json?
  
  // Email Verification
  emailVerified       Boolean  @default(false)
  emailVerificationResult String?
  
  // Confidence & Source Tracking
  overallConfidence   String?  // "high" | "medium" | "low"
  dataSources         Json?    // ["website", "companies_house", "apollo"]
  layerResults        Json?    // What each waterfall layer found
  
  // Pipeline Status
  status              String   @default("pending")
  failureReason       String?
  lastEnrichedAt      DateTime?
  
  // Raw Data (for re-extraction)
  websiteMarkdown     String?  @db.Text
  websitePages        Json?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@unique([placeId, reportId])
  @@index([status])
  @@index([chainClassification])
  @@index([reportId])
}
```

Also add relation on `Place` model:
```prisma
model Place {
  // ... existing fields
  enrichmentResults EnrichmentResult[]
}
```

And on `Report` model:
```prisma
model Report {
  // ... existing fields
  enrichmentResults EnrichmentResult[]
}
```

#### Migration command:
```bash
npx prisma migrate dev --name add_enrichment_result
```

### 1.2 Chain Classifier Service

#### [NEW] `src/lib/enrichment/chainClassifier.ts`

Replace `businessAnalyzer.ts` keyword matching with a proper classifier:

1. **Lookup table** (~200 UK chains) — generated programmatically from public data
2. **Domain clustering** — group businesses by website domain across reports
3. **Platform exclusion** — ignore booking.com, wix.com, etc.
4. **Google `chains` field** — consume when available (after field mask update)

**Input**: Place record (name, website, types)
**Output**: `{ classification, chainName?, confidence, method }`

### 1.3 Chain Lookup Table

#### [NEW] `src/data/uk-chains.json`

Generate ~200 UK chain names with their domains, grouped by sector:
```json
{
  "hospitality": [
    { "name": "Travelodge", "domains": ["travelodge.co.uk"] },
    { "name": "Premier Inn", "domains": ["premierinn.com"] }
  ],
  "fitness": [
    { "name": "PureGym", "domains": ["puregym.com"] },
    { "name": "The Gym Group", "domains": ["thegymgroup.com"] }
  ]
}
```

### 1.4 Business Type Priority

#### [NEW] `src/lib/enrichment/typePriority.ts`

Define the priority order for multi-type Google Places classification:
```
hotel > gym > restaurant > bar > cafe > store > office > medical > ...
```

Provides `getPrimaryType(types: string[])` function.

---

## Phase 2: Scraping Layer (Crawl4AI + Firecrawl)

> Goal: Scrape business websites and extract identity data using LLM.

### 2.1 Crawl4AI Docker Setup

#### [NEW] `docker-compose.yml` (or extend existing)

Run Crawl4AI as a Docker sidecar:
```yaml
services:
  crawl4ai:
    image: unclecode/crawl4ai:latest
    ports:
      - "11235:11235"
    environment:
      - CRAWL4AI_API_TOKEN=${CRAWL4AI_API_TOKEN}
```

### 2.2 Website Scraper Service

#### [NEW] `src/lib/enrichment/websiteScraper.ts`

Orchestrates website scraping:
1. Try Crawl4AI first (free) — call Docker service HTTP API
2. If Crawl4AI fails (403, timeout, CAPTCHA) → fall back to Firecrawl API
3. Scrape up to 3 pages per site: `/`, `/about` or `/about-us`, `/contact`
4. Return raw Markdown for each page

**Rate limiting**: Max 5 concurrent scrapes, 1-second delay between requests.

### 2.3 LLM Extraction Service

#### [NEW] `src/lib/enrichment/llmExtractor.ts`

Extract structured identity data from scraped Markdown using GPT-4o-mini:

**Prompt**: Extract from this business website:
- Owner/manager name and role
- Email addresses (all found)
- Phone numbers (all found)
- Company registration number
- VAT number
- Social media links

**Output schema**: Typed JSON with confidence levels per field.

**Cost**: ~$0.001 per page × 3 pages × ~10,000 businesses = ~$30

---

## Phase 3: Resolution Layers (Companies House + Apollo)

> Goal: Fill gaps left by website scraping using external data sources.

### 3.1 Companies House Service

#### [NEW] `src/lib/enrichment/companiesHouse.ts`

- Search by postcode + business name
- Fetch company details and officers
- Match score algorithm (name similarity + address proximity)
- Extract active directors with roles and appointment dates
- Multi-director resolution: pick managing director or longest-serving

**API key**: Already available (user confirmed).

### 3.2 Apollo People Search Service

#### [NEW] `src/lib/enrichment/apolloService.ts`

- Search by domain or company name + location
- Find people with owner/director/manager titles
- Enrich for email + phone
- Respect rate limits (Apollo Basic: 60k records/mo)

### 3.3 Email Verification Service

#### [NEW] `src/lib/enrichment/emailVerifier.ts`

- Verify all discovered emails via Reoon API
- Handle catch-all domains
- Constructed email validation (info@, contact@, {location}@chain)

---

## Phase 4: Waterfall Pipeline Orchestrator

> Goal: Connect all layers into a sequential waterfall with early exit.

### 4.1 Pipeline Orchestrator

#### [NEW] `src/lib/enrichment/pipeline.ts`

The core engine. For each business:

```
1. CLASSIFY → Chain or Independent?
2. IF INDEPENDENT:
   a. Layer 1: Scrape website → LLM extract (name, email, company #)
      → If resolved (name + email) → STOP ✅
   b. Layer 2: Companies House lookup (by company # or name + postcode)
      → If name + email available → STOP ✅
   c. Layer 3: Apollo search (by domain or name)
      → If verified email found → STOP ✅  
   d. Layer 4: Construct info@/contact@ → verify with Reoon
      → If valid → FALLBACK ⚠️
   e. Layer 5: VAT trace → retry Layer 2 with company number
3. IF CHAIN:
   a. Try location-specific email ({area}@chain)
   b. Scrape branch-specific page for manager name/email
   c. Apollo people search by title + domain
4. VERIFY email with Reoon
5. SAVE EnrichmentResult with all layer data
```

**Concurrency**: Process 5 businesses in parallel per batch.
**Rate limiting**: Respect all API rate limits (Apollo, Companies House, Crawl4AI).
**Error handling**: Retry 3x with exponential backoff. Log all failures.

### 4.2 Pipeline API Endpoint

#### [NEW] `src/app/api/reports/[id]/enrich/route.ts`

- `POST` — Start enrichment for a report with type filters
  - Body: `{ types?: string[], placeIds?: string[] }`
  - Validates report exists and user has access
  - Creates `EnrichmentResult` records with status "pending"
  - Starts pipeline processing (non-blocking)
  - Returns job ID for status polling

- `GET` — Get enrichment status for a report
  - Returns: counts by status, recent results, error summary

---

## Phase 5: Report Enrichment UI

> Goal: Add an "Enrichment" tab to each report page.

### 5.1 Enrichment Tab Component

#### [NEW] `src/components/report/EnrichmentTab.tsx`

The main enrichment interface within a report page:

- **Summary bar**: X total businesses | Y enriched | Z failed | W needs review
- **Type filter**: Checkboxes for business types (hotel, restaurant, gym, etc.)
- **Business table**: Sortable/filterable list showing:
  - Business name + address
  - Chain classification badge (independent / chain / local group)
  - Enrichment status badge (pending / in progress / resolved / failed / needs review)
  - Resolved contact preview (name, email, confidence)
  - Expandable row showing full layer-by-layer results
- **Action buttons**:
  - "Enrich Selected" — triggers pipeline for checked businesses
  - "Enrich All [Type]" — quick-enrich all hotels, all gyms, etc.
  - "Re-enrich Failed" — retry failed businesses
- **Confidence filter**: Show only high/medium/low confidence results

### 5.2 Enrichment Detail Drawer

#### [NEW] `src/components/report/EnrichmentDetail.tsx`

Expandable panel showing full enrichment results for a single business:

- Layer-by-layer breakdown (what each source found)
- Source attribution (website vs Companies House vs Apollo)
- Confidence score visualization
- Raw scraped data preview
- "Flag for Review" / "Mark as Resolved" manual controls

### 5.3 Report Page Integration

#### [MODIFY] Report page layout

Add "Enrichment" tab alongside existing content. Tab shows the `EnrichmentTab` component, fetching data from the new API.

---

## Phase 6: Cross-Report Features

> Goal: Handle deduplication and global view.

### 6.1 Deduplication Service

#### [NEW] `src/lib/enrichment/deduplication.ts`

- On enrichment, check if this `placeId` already has an enrichment result from another report
- If yes: share the existing result (don't re-scrape, don't re-call APIs)
- Track which reports share the same business via the `EnrichmentResult` relations

### 6.2 Google `chains` Field

#### [MODIFY] `src/lib/placesFetch.ts`

Add `'places.chains'` to the `PLACES_FIELD_MASK` array. This enables Google's native chain detection for new fetches.

---

## Phase 7: Testing & Validation

> Goal: Prove the pipeline works before scaling.

### 7.1 Staged Testing Plan

| Stage | Scope | Goal |
|-------|-------|------|
| **Stage 1** | 5 hand-picked businesses (2 independent, 2 chain, 1 edge case) | Validate each waterfall layer works |
| **Stage 2** | 1 full report (~50-100 businesses) | Validate end-to-end flow, measure resolution rate |
| **Stage 3** | 5 reports from different areas | Validate consistency across geographies |
| **Stage 4** | All reports | Full batch run |

### 7.2 Verification Criteria

| Metric | Target |
|--------|--------|
| Chain classification accuracy | >90% (spot-check 50 businesses) |
| Email resolution rate (independents) | >60% |
| Email resolution rate (chains) | >40% |
| Email verification pass rate | >80% of discovered emails |
| Pipeline completion (no crashes) | 100% |
| Average time per business | <30 seconds |
| False positive rate (wrong person) | <10% |

### 7.3 Manual Verification Steps

1. **Pick 10 resolved businesses** → manually Google each → verify the contact name matches the website/LinkedIn
2. **Check 5 chain classifications** → manually confirm chain vs independent
3. **Send test emails to 5 verified addresses** → confirm deliverability
4. **Review 5 "needs review" flagged results** → verify the pipeline correctly identified low-confidence results

---

## Implementation Order

```
Phase 1 ─── Foundation (Schema + Classifier) ─── ~2-3 days
  │
Phase 2 ─── Scraping Layer (Crawl4AI + LLM) ─── ~2-3 days
  │
Phase 3 ─── Resolution Layers (CH + Apollo) ──── ~2-3 days
  │
Phase 4 ─── Pipeline Orchestrator ────────────── ~2-3 days
  │
Phase 5 ─── Report UI Tab ─────────────────────── ~2-3 days
  │
Phase 6 ─── Cross-Report Features ─────────────── ~1-2 days
  │
Phase 7 ─── Testing & Validation ──────────────── ~2-3 days
```

**Total estimate: ~15-20 working days**

---

## New Files Summary

| File | Purpose |
|------|---------|
| `src/lib/enrichment/chainClassifier.ts` | Chain vs independent detection |
| `src/lib/enrichment/typePriority.ts` | Multi-type business primary type |
| `src/lib/enrichment/websiteScraper.ts` | Crawl4AI + Firecrawl orchestrator |
| `src/lib/enrichment/llmExtractor.ts` | GPT-4o-mini structured extraction |
| `src/lib/enrichment/companiesHouse.ts` | Companies House API client |
| `src/lib/enrichment/apolloService.ts` | Apollo.io people search + enrichment |
| `src/lib/enrichment/emailVerifier.ts` | Reoon email verification |
| `src/lib/enrichment/pipeline.ts` | Waterfall orchestrator |
| `src/lib/enrichment/deduplication.ts` | Cross-report dedup |
| `src/data/uk-chains.json` | Chain lookup table |
| `src/app/api/reports/[id]/enrich/route.ts` | Enrichment API endpoint |
| `src/components/report/EnrichmentTab.tsx` | Report enrichment tab |
| `src/components/report/EnrichmentDetail.tsx` | Enrichment detail drawer |
| `docker-compose.yml` | Crawl4AI Docker service |

## Modified Files

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `EnrichmentResult` model + relations |
| `src/lib/placesFetch.ts` | Add `chains` to field mask |
| Report page layout | Add "Enrichment" tab |

## Environment Variables Needed

```env
# Existing (confirmed available)
COMPANIES_HOUSE_API_KEY=xxx
OPENAI_API_KEY=xxx    # Already exists
GOOGLE_PLACES_API_KEY=xxx  # Already exists

# New - Required
APOLLO_API_KEY=xxx
CRAWL4AI_API_TOKEN=xxx     # For Docker service auth
REOON_API_KEY=xxx

# New - Optional (Firecrawl fallback)
FIRECRAWL_API_KEY=xxx
```

## Cost Summary (Per Full Run of ~10,000 Businesses)

| Service | Cost |
|---------|------|
| Crawl4AI scraping | Free (self-hosted) |
| LLM extraction (GPT-4o-mini) | ~$30 |
| Companies House API | Free |
| Apollo.io (Basic plan) | $49/mo |
| Reoon verification | Credits available |
| Firecrawl fallback (~5-10%) | ~$8-16 |
| **Total first run** | **~$90-100** |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Crawl4AI Docker fails on Mac | Can't scrape | Firecrawl fallback covers 100% |
| Apollo rate limits hit | Slow enrichment | Queue + backoff + batch overnight |
| Companies House API downtime | Missing company data | Cache results, retry next day |
| LLM hallucinations in extraction | Wrong contact data | Confidence scoring + manual review queue |
| Website scraping blocked (CAPTCHA) | Can't get website data | Firecrawl fallback |
| Database migration breaks existing data | Data loss | Separate model (Option B), no column changes |
| Docker not available in deployment (Vercel) | Can't run Crawl4AI | External Crawl4AI instance or Firecrawl-only mode |

> **Vercel Note:** Crawl4AI Docker service may need to run on a separate VPS (e.g., Railway, Fly.io, or the user's own server) if ParkBunny is deployed on Vercel. The pipeline would call it via HTTP. Alternatively, use Firecrawl-only for the managed approach.
