# 🧠 Brainstorm: Spatial-to-Identity Enrichment UI & Pipeline

## Context

ParkBunny has ~10,115 nearby businesses across all car park reports. The goal is to build a **Spatial-to-Identity pipeline** that resolves Google Places pins into verified decision-makers with contact details. **Outreach is deferred** — focus is on data extraction accuracy.

### What Already Exists

The codebase already has an outreach section with a 3-step flow:

```
Select Businesses → Enrich Data → Launch Campaign
```

**Existing components:**
- `BusinessSelectionClient.tsx` — checkbox list of businesses, grouped by category, with select all/deselect
- `EnrichmentStep.tsx` — enrichment progress tracker with status badges (pending/enriching/done/failed)
- `AIOutreachClient.tsx` — campaign launcher with email/phone/LinkedIn channels
- Routes: `/outreach`, `/outreach/[locationId]`, `/outreach/campaigns/*`, `/outreach/inbox`
- API: `/api/outreach/enrich`, `/api/outreach/campaigns`

**Existing data model on Place:** `name`, `types`, `address`, `rating`, `userRatingCount`, `priceLevel`, `website`, `phone`, `businessStatus`, `googleMapsUri`

---

## Part 1: Enrichment UI — Where Does It Live?

### Option A: Enhance the Existing Outreach Section

Build on the existing `/outreach` flow. Redesign it as a dedicated "Enrichment Dashboard" that sits alongside the report, not inside it.

**Flow:**
```
/outreach → Pick a Report → Filter by Business Type → Run Enrichment → Review Results
```

✅ **Pros:**
- Already has the scaffolding (routes, components, API endpoints)
- Familiar to the user — they've already seen this section
- Clear separation: reports = data viewing, outreach = data enrichment

❌ **Cons:**
- Outreach section is conceptually about "sending messages" — enrichment is a pre-step
- User has to navigate away from the report to trigger enrichment
- Existing flow is campaign-oriented (outreach-first), not enrichment-first

📊 **Effort:** Low — mostly extending existing components

---

### Option B: Embed in Each Report Page (New Tab)

Add an "Enrichment" tab to each individual report page. When viewing a report, there's a new tab alongside existing tabs showing businesses with their enrichment status.

**Flow:**
```
/reports/[id] → "Enrichment" tab → Filter by type → Run pipeline → Review results inline
```

**What the tab shows:**
- Table of all businesses in this report
- Type filter checkboxes (hotels, restaurants, gyms, etc.)
- Enrichment status per business (not started / in progress / resolved / failed / needs review)
- Expandable row showing all discovered data (owner name, email, company #, confidence score, data sources)
- "Enrich Selected" button to trigger the pipeline
- Summary stats: X resolved, Y failed, Z need review

✅ **Pros:**
- Contextual — you see enrichment data right where the report lives
- Natural workflow: look at report → see businesses → enrich them
- Easy to visualise which businesses in THIS car park are resolved
- Aligns with "per-report processing" user decision

❌ **Cons:**
- Report page gets more complex
- Need to build a new tab component
- Doesn't show a global view across all reports

📊 **Effort:** Medium — new tab + enrichment table component

---

### Option C: Hybrid — Report Tab + Global Dashboard

Report page gets an "Enrichment" tab (Option B) for per-report work. Plus a top-level `/enrichment` page showing a global dashboard across ALL reports.

**Report tab** = trigger enrichment for this report, review results
**Global dashboard** = overall stats, cross-report deduplication view, batch operations

**Flow:**
```
Report Tab: /reports/[id]#enrichment → Per-report enrichment
Global:     /enrichment → Stats, queue, cross-report view
```

✅ **Pros:**
- Best of both worlds
- Per-report contextual view + bird's-eye view
- Global dashboard enables cross-report deduplication
- Can prioritise reports by enrichment status

❌ **Cons:**
- Most effort
- Two surfaces to maintain
- Could build the global dashboard later

📊 **Effort:** High initially — but can be phased (Phase 1: report tab, Phase 2: global)

---

## 💡 Recommendation: Option C (Phased)

**Phase 1:** Report tab (Option B) — start enriching per-report
**Phase 2:** Global dashboard — add when there's enough enriched data to warrant it

This matches the user's "per-report with type selection" decision and provides immediate value.

---

## Part 2: Trigger Mechanism

### Option A: Manual Button Per Report

User navigates to report → clicks "Enrich" tab → filters business types → clicks "Enrich Selected"

✅ **Pros:** Full control, human-in-the-loop, can select specific types per car park
❌ **Cons:** Manual work for each report, no batch processing
📊 **Effort:** Low

### Option B: API Endpoint + Dashboard Button

API endpoint `/api/reports/[id]/enrich` that accepts type filters. Dashboard button triggers it. Could also be called from a script or cron job for batch processing.

✅ **Pros:** Flexible — UI button or script or cron, supports both manual and batch
❌ **Cons:** Need to build the API and the UI trigger
📊 **Effort:** Medium

### Option C: Queue-Based with Dashboard Controls

Submit enrichment jobs to a processing queue. Dashboard shows queue status, can pause/resume/cancel. Each job = one report with selected types.

✅ **Pros:** Can process multiple reports simultaneously, robust error handling, resume on failure
❌ **Cons:** More infrastructure (queue system), more complex
📊 **Effort:** High

---

## 💡 Recommendation: Option B

API endpoint + button. Start with manual triggering per report, but the API design supports batch processing later (just loop through report IDs).

---

## Part 3: Web Scraping Tool — Crawl4AI vs Firecrawl

| Feature | **Crawl4AI** | **Firecrawl** |
|---------|-------------|---------------|
| **Type** | Open-source Python library (self-hosted) | API SaaS (managed service) |
| **Price** | **Free** (MIT license) — pay only for hosting + LLM API | $16-333/mo (credit-based, 1 page = 1 credit) |
| **JS Rendering** | ✅ Playwright-based | ✅ Built-in |
| **Anti-bot** | Manual proxy setup needed | ✅ Handled automatically |
| **LLM Integration** | ✅ Schema-based extraction, any LLM | ✅ Native "zero-selector" prompt extraction |
| **Output Format** | Markdown, JSON, HTML | Markdown, JSON, HTML, screenshots |
| **Parallel Crawling** | ✅ (limited by your hardware) | ✅ (managed infrastructure) |
| **Scaling** | Limited by server resources | Built for millions of pages |
| **Setup Complexity** | Medium — Python env, Playwright, proxies | Low — API key and go |
| **Data Sovereignty** | ✅ Everything stays on your server | ❌ Data passes through Firecrawl servers |

### Cost Comparison for ParkBunny

| Scenario | Crawl4AI Cost | Firecrawl Cost |
|----------|--------------|----------------|
| 10,000 pages (3 per business) | ~$0 (self-hosted) + LLM costs | $83/mo (Standard plan) |
| LLM extraction per page | ~$0.001 (GPT-4o-mini) | Included in Extract plan ($89/mo) |
| Proxies (if needed) | ~$10-20/mo | Included |
| **Total first run** | **~$10-30** (mostly LLM) | **$83-89** |
| **Monthly ongoing** | **~$2-5** | **$16-89/mo** |

### The Real Decision

**Crawl4AI** is significantly cheaper but requires:
- Python environment (ParkBunny is Node.js/Next.js)
- Running as a separate service (Docker or Python process)
- Manual proxy management for anti-bot
- More DevOps responsibility

**Firecrawl** is simpler but:
- Costs real money per month
- Data passes through their servers
- Credit system can be opaque (complex pages = more credits)

### Hybrid Approach

Use **Crawl4AI** as a Docker service for the heavy lifting (bulk page scraping), and keep the option to fall back to **Firecrawl** for sites that need stronger anti-bot handling.

1. Set up Crawl4AI in a Docker container alongside ParkBunny
2. Call it via HTTP from Next.js API routes
3. If a site blocks Crawl4AI (403, CAPTCHA), retry with Firecrawl API as fallback
4. Both return Markdown → feed to same LLM extraction step

---

## 💡 Recommendation: Crawl4AI (Primary) + Firecrawl (Fallback)

**Cost savings:** ~$70-80/mo saved vs Firecrawl-only
**Reliability:** Firecrawl catches the 5-10% of sites that resist open-source scraping
**Architecture:** Both produce Markdown → same downstream LLM extraction pipeline

---

## Part 4: Schema Design (Option B — Confirmed)

Separate `EnrichmentResult` model linked to `Place`. Zero risk to existing data.

```prisma
model EnrichmentResult {
  id                  String   @id @default(cuid())
  placeId             String
  place               Place    @relation(fields: [placeId], references: [id])
  reportId            String?  // Which report triggered this enrichment
  
  // Classification
  businessType        String?  // Primary Google type
  chainClassification String?  // "independent" | "local_group" | "national_chain"
  chainName           String?  // "Travelodge", "PureGym", etc.
  classificationConfidence String? // "high" | "medium" | "low"
  
  // Resolved Identity
  ownerName           String?
  ownerRole           String?  // "Owner", "Director", "Manager"
  ownerEmail          String?
  ownerPhone          String?
  ownerLinkedIn       String?
  
  // Company Data
  companiesHouseNumber String?
  companyName         String?
  companyType         String?  // "ltd" | "llp" | "sole_trader" | "unknown"
  directors           Json?    // Array of director objects
  
  // Email Verification
  emailVerified       Boolean  @default(false)
  emailVerificationResult String? // "valid" | "invalid" | "catch_all" | "unknown"
  
  // Confidence & Source
  overallConfidence   String?  // "high" | "medium" | "low"
  dataSources         Json?    // ["website", "companies_house", "apollo"]
  enrichmentLayers    Json?    // Which layers ran and what they found
  
  // Pipeline Status
  status              String   @default("pending") // "pending" | "in_progress" | "resolved" | "failed" | "needs_review"
  failureReason       String?
  lastEnrichedAt      DateTime?
  
  // Raw Data
  websiteMarkdown     String?  @db.Text // Raw scraped content
  websitePages        Json?    // Which pages were scraped
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@unique([placeId, reportId]) // One enrichment per place per report
  @@index([status])
  @@index([chainClassification])
  @@index([reportId])
}
```

**Key design decisions:**
- `@@unique([placeId, reportId])` — prevents duplicate enrichment per place per report
- `enrichmentLayers` as JSON — stores what each layer found (for debugging and audit)
- `websiteMarkdown` as `@db.Text` — stores raw scraped content for re-extraction
- `dataSources` — tracks provenance of each data point
- Separate from Place model — existing functionality completely untouched

---

## Summary of Recommendations

| Decision | Recommendation |
|----------|---------------|
| **UI Location** | Option C (Phased) — Report tab first, global dashboard later |
| **Trigger** | Option B — API endpoint + dashboard button |
| **Scraping Tool** | Crawl4AI primary + Firecrawl fallback |
| **Schema** | Option B — Separate `EnrichmentResult` model |
| **businessAnalyzer.ts** | Evaluate and likely redesign — existing keyword matching is too basic for production chain detection |

### Next Step

If these recommendations look good, the next step is a proper implementation plan (`PLAN-spatial-identity.md`) with phased task breakdown, dependencies, and verification criteria.
