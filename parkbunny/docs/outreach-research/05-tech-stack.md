# 5. Spatial-to-Identity Tech Stack

[← Back to Index](./README.md)

---

## Pipeline Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    SPATIAL-TO-IDENTITY PIPELINE                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STAGE 1: INGEST              STAGE 2: CLASSIFY                  │
│  ┌──────────────┐            ┌──────────────────┐                │
│  │ Google Places │───────────│ Chain Bifurcation │                │
│  │    API        │            │ (Hybrid A+C)     │                │
│  └──────────────┘            └────────┬─────────┘                │
│                                       │                          │
│                          ┌────────────┴────────────┐             │
│                          ▼                         ▼             │
│                   INDEPENDENT                   CHAIN            │
│                                                                  │
│  STAGE 3a: RESOLVE (Independent)  STAGE 3b: RESOLVE (Chain)     │
│  ┌──────────────┐                 ┌──────────────────┐           │
│  │ Firecrawl    │                 │ Location-Specific│           │
│  │ (website     │                 │ Email Discovery  │           │
│  │  scrape)     │                 │ ({area}@chain)   │           │
│  └──────┬───────┘                 └────────┬─────────┘           │
│         ▼                                  │                     │
│  ┌──────────────┐                 ┌────────┴─────────┐           │
│  │ LLM Extract  │                 │ Branch Web Page  │           │
│  │ (owner name, │                 │ Scrape (manager   │           │
│  │  company #,  │                 │  name + email)   │           │
│  │  VAT, email) │                 └────────┬─────────┘           │
│  └──────┬───────┘                          │                     │
│         ▼                                  ▼                     │
│  ┌──────────────┐                 ┌──────────────────┐           │
│  │ Companies    │                 │ Apollo People    │           │
│  │ House API    │                 │ Search (by title │           │
│  │ (directors)  │                 │  + domain)       │           │
│  └──────┬───────┘                 └────────┬─────────┘           │
│         │                                  │                     │
│  STAGE 4: ENRICH                           │                     │
│  ┌──────────────┐                          │                     │
│  │ Apollo.io    │◄─────────────────────────┘                     │
│  │ (email +     │                                                │
│  │  phone)      │                                                │
│  └──────┬───────┘                                                │
│         ▼                                                        │
│  ┌──────────────┐                                                │
│  │ Email        │                                                │
│  │ Verification │                                                │
│  │ (ZeroBounce) │                                                │
│  └──────┬───────┘                                                │
│         ▼                                                        │
│  ┌──────────────┐                                                │
│  │ ParkBunny DB │  Place model updated with enriched data        │
│  │ (Prisma)     │                                                │
│  └──────────────┘                                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## Tool 1: Google Places API (Already In Use)

**Purpose:** Spatial data ingestion — the starting point of everything.

| Detail | Value |
|--------|-------|
| Status | ✅ In production |
| What we get | Name, address, lat/lng, types, rating, review count, website, phone |
| What we need to add | `places.chains` field to field mask |
| Cost | Already paying — part of existing Google Cloud billing |
| Code location | `src/lib/placesFetch.ts` |

**Action required:** Add `places.chains` to the field mask. One-line change.

---

## Tool 2: Chain Detection (To Build In-House)

**Purpose:** Classify every Place as `independent` or `chain`.

| Component | Implementation | Storage |
|-----------|---------------|---------|
| Google `chains` field | Field mask update in `placesFetch.ts` | New `chainId` and `chainName` fields on Place model |
| Known Chains Lookup Table | Static JSON file or DB table | ~200 entries, curated manually |
| Domain Clustering | Script that groups businesses by root domain | Computed — tag businesses with same domain |

**Schema change needed:**
```prisma
model Place {
  // ... existing fields
  isChain                  Boolean?   // null = not classified yet
  chainName                String?    // "Travelodge", "PureGym", etc.
  chainId                  String?    // Google chain ID if available
  classificationConfidence String?    // "high", "medium", "low"
  classificationMethod     String?    // "lookup_table", "domain_cluster", "google_chains", "manual"
  localGroupId             String?    // Groups local multi-site owners together
}
```

**Cost:** Free (in-house logic)

---

## Tool 3: Firecrawl (Website Scraping)

**Purpose:** Scrape business websites and extract structured data using LLM.

| Detail | Value |
|--------|-------|
| What it does | Scrapes any URL → returns clean Markdown (no nav, no ads, no cookie banners) |
| Why Firecrawl | Returns LLM-ready Markdown, handles JS-rendered sites, built-in proxy rotation |
| Free tier | 500 credits/month (500 pages) |
| Hobby plan | $16/mo for 3,000 credits |
| Standard plan | $83/mo for 100,000 credits |
| Rate limit | Depends on plan — free tier is slower |
| Alternative | Cheerio (free, open-source, but no JS rendering or proxy) |
| Alternative | **CrawlForAI** (open-source, needs evaluation for value vs Firecrawl) |

> **User note:** CrawlForAI is also being considered. Need to evaluate which provides best value for money and actually works for UK SMB websites.

**Pipeline step:**
1. Firecrawl scrapes `/about`, `/contact`, `/team`, and footer of business website
2. Returns Markdown text
3. Pass Markdown to LLM (GPT-4o-mini) with extraction prompt
4. LLM returns structured JSON: `{ ownerName, role, email, companyNumber, vatNumber }`

**LLM extraction prompt (draft):**
```
Extract the following from this business website content:
- Owner/Director/Founder name and role
- Any email addresses (especially owner/manager emails)
- Company registration number (usually "Registered in England: XXXXXXXX")
- VAT number (usually "VAT: GB XXXXXXXXX")

Return as JSON. If a field is not found, return null.
```

**Cost estimate for 6,363 places:**
- Firecrawl: ~6,363 credits = Hobby plan ($16/mo) for 2 months, or Standard ($83/mo) for 1 month
- LLM extraction: ~6,363 × GPT-4o-mini call ≈ $2-5 total (very cheap)

**Where output goes:**
- `siteData` field (raw scraped content)
- `contactPeople` field (extracted owner/director details)
- `businessDetails` field (company number, VAT, etc.)

---

## Tool 4: Companies House API (Free)

**Purpose:** Resolve trading name → legal entity → directors.

| Detail | Value |
|--------|-------|
| Cost | **Completely free** |
| Registration | [developer.company-information.service.gov.uk](https://developer.company-information.service.gov.uk/) |
| Auth | API key via HTTP Basic Auth |
| Rate limit | **600 requests per 5 minutes** (7,200/hour) |
| IP limit | 2,000 requests per 5 minutes |

**Key endpoints:**

| Endpoint | Purpose | Input |
|----------|---------|-------|
| `GET /search/companies?q={query}` | Find companies by name or postcode | Trading name or postcode |
| `GET /company/{number}` | Full company details | Company number (from website scrape) |
| `GET /company/{number}/officers` | Directors list | Company number |
| `GET /company/{number}/registered-office-address` | Registered address | Company number |
| `GET /search/officers?q={name}` | Find directors by name | Person name |

**Resolution strategy (ordered by reliability):**

```
1. Website scrape found company number? ──→ Direct lookup (100% match)
   │
2. No? Search by trading name ──→ Cross-validate against address
   │
3. No match? Search by postcode ──→ Score by name similarity
   │
4. No match? Search by director name (from website scrape) ──→ Find their companies
   │
5. Still nothing? ──→ Sole trader or foreign entity. Skip Companies House.
```

**Cost estimate:** Free. 6,363 lookups at 600/5min = ~53 minutes to process entire database.

**Important 2025 change:** Companies House now requires identity verification for directors. This means director data will be more reliable and verified going forward.

---

## Tool 5: Apollo.io (Already Available)

**Purpose:** People search (find decision-makers by company + title) and email/phone enrichment.

| Detail | Value |
|--------|-------|
| Status | ✅ Account exists |
| Free tier | 10,000 people search records/month, 5 mobile numbers, 10 export credits |
| Basic plan | $49/mo — 60,000 records, 150 mobile credits |

> **✅ User confirmed:** Willing to upgrade to Basic plan ($49/mo).

**Key API endpoints:**

| Endpoint | Purpose | Credits |
|----------|---------|---------|
| `POST /organizations/enrich` | Company data by domain | 1 credit |
| `POST /mixed_people/api_search` | Find people by company + title | **Free** (returns partial data) |
| `POST /people/bulk_match` | Get full contact details | 1 credit per person |
| `POST /people/match` | Single person enrichment | 1 credit |

**Critical insight:** The `mixed_people/api_search` endpoint is **free** — no credits consumed. It returns names, titles, and company info. Only the `bulk_match` step (to get emails/phones) costs credits. This means we can search broadly for free, then selectively enrich only the best matches.

**Usage in pipeline:**

For independents:
- Input: website domain → find owner/director by title
- Titles to search: `owner, founder, director, managing director, proprietor`

For chains:
- Input: chain domain + location → find branch manager
- Titles to search: `general manager, branch manager, store manager, hotel manager, club manager`

**Cost estimate:** Depends on how many people we enrich. If we enrich 1,000 contacts: ~1,000 credits on Basic plan.

---

## Tool 6: Email Verification (ZeroBounce or Reacher)

**Purpose:** Validate discovered/constructed emails before sending outreach.

| Service | Free Tier | Paid | Best For |
|---------|-----------|------|----------|
| **Reoon** | — | Pay-as-you-go | ✅ **Selected** — user has account with plenty of credits |
| **ZeroBounce** | 100/month | $18 per 2,000 ($0.009/email) | Accuracy, GDPR-compliant |
| **Reacher** | 50/month | €69/mo for 10,000 | Open-source, self-hostable |

> **✅ User confirmed:** Has a Reoon account with plenty of credits. Use Reoon as the primary email verification provider.

---

## Tool 7: Vatsense API (Optional — Fallback)

**Purpose:** Resolve VAT number → legal entity when Companies House fails.

| Detail | Value |
|--------|-------|
| Free tier | 100 lookups/month |
| Cost | From €0.01/lookup |
| When to use | Only when website shows VAT number but Companies House lookup failed |

**Likely usage:** Very low volume. Last-resort fallback.

---

## Tool 8: LLM for Extraction (GPT-4o-mini)

**Purpose:** Extract structured data from scraped website Markdown.

| Detail | Value |
|--------|-------|
| Model | GPT-4o-mini (fast, cheap, good enough for extraction) |
| Cost | ~$0.15 per 1M input tokens, $0.60 per 1M output tokens |
| Per website | ~2,000 tokens input, ~200 tokens output = ~$0.0004 per site |
| Total for 6,363 | **~$2.50** |

**What the LLM extracts:**
- Owner/Director name + role
- Email addresses
- Company registration number
- VAT number
- Social media links
- Key business details (employee count, founding date)

---

## Total Cost Estimate

> ⚠️ Multi-page scraping: if we scrape 3-4 pages per business (about, contact, team, footer), that's 3-4 Firecrawl credits each, not 1.

| Tool | One-Time Cost | Monthly Ongoing |
|------|-------------|-----------------|
| Google Places (chains field) | $0 (already paying) | $0 |
| Chain lookup table | $0 (in-house) | $0 |
| Firecrawl (6,363 × 3 pages) | $83 (one month Standard — 100K credits) | $16/mo Hobby for new reports |
| Companies House API | **Free** | **Free** |
| Apollo.io (people search) | $0-49 (depends on tier) | $49/mo Basic |
| LLM extraction | ~$8 (3 pages × 6,363) | ~$1.50 per new report |
| Email verification | ~$90 (10,000 batch) | ~$20 per new report |
| Vatsense (optional) | ~$5 | $0 |

**Total first run: ~$190-240**
**Ongoing per new report: ~$85-100/mo** (Firecrawl + Apollo + verification)

---

## What We Already Have vs What We Need

| Component | Have It? | Action |
|-----------|---------|--------|
| Google Places API | ✅ Yes | Add `chains` to field mask |
| OpenAI API key | ✅ Yes | Use for LLM extraction |
| Apollo.io account | ✅ Yes | Integrate API |
| PostgreSQL + Prisma | ✅ Yes | Add new fields to Place model |
| Firecrawl | ❌ No | Sign up (free tier to start). Also evaluate CrawlForAI. |
| Companies House API key | ✅ Yes | User has key, add to `.env` |
| Reoon account | ✅ Yes | User has account with plenty of credits |
| Chain lookup table | ❌ No | Generate programmatically (~200 UK chains) |
| Pipeline orchestration | ❌ No | Build on existing Next.js infrastructure |
| Platform exclusion list | ❌ No | ~50 domains (booking.com, wix.com, etc.) — generate programmatically |

> **User preference:** Build on existing infrastructure (Next.js + Prisma). Budget confirmed within $190-240 range for first run.

---

## Pipeline Engineering (Missing Piece)

### Orchestration

The 6,363 places can't be processed in a single script run. We need a **job queue** approach:

```
┌─────────────────────────────────────────────┐
│              PIPELINE ORCHESTRATOR           │
├─────────────────────────────────────────────┤
│                                             │
│  1. Fetch unprocessed places (batch of 50)  │
│     └─ WHERE identityResolved = false       │
│        AND lastAttemptedAt < 24h ago        │
│                                             │
│  2. For each place in batch:                │
│     ├─ Run classification (if isChain null) │
│     ├─ Route to independent or chain path   │
│     ├─ Execute layers in waterfall order    │
│     ├─ Store results + update status        │
│     └─ Log success/failure/skip             │
│                                             │
│  3. Rate limit between batches              │
│     ├─ Firecrawl: respect plan limits       │
│     ├─ Companies House: max 600/5min        │
│     ├─ Apollo: respect API limits           │
│     └─ ZeroBounce: respect plan limits      │
│                                             │
│  4. Repeat until all places processed       │
│                                             │
│  Implementation options:                    │
│  ├─ Next.js API route + cron (simple)       │
│  ├─ BullMQ/Redis queue (robust)             │
│  └─ n8n workflow (no-code, visual)          │
└─────────────────────────────────────────────┘
```

### Rate Limiting Strategy

| Service | Rate Limit | Strategy |
|---------|-----------|----------|
| Firecrawl | Plan-dependent (free = slow) | Process 10 sites at a time, 2s delay between |
| Companies House | 600 requests / 5 minutes | Batch 100, then wait. ~53 min for all 6,363 |
| Apollo (search) | Unknown — monitor 429s | Conservative: 1 req/sec |
| Apollo (enrich) | Unknown — monitor 429s | Only enrich when needed |
| ZeroBounce | Plan-dependent | Batch verify after all discovery is complete |

### Error Handling

| Error | Action |
|-------|--------|
| Firecrawl timeout / 5xx | Retry once after 30s. If still fails, mark as `scrape_failed` and fall through to next layer |
| Firecrawl 403/blocked | Mark as `scrape_blocked`. Try Cheerio fallback (basic HTML parsing). If that fails, skip website scraping |
| Companies House 429 | Wait 5 minutes, retry. This is temporary rate limiting |
| Companies House no results | Not an error — mark as `ch_no_match` and fall through |
| Apollo 429 | Back off exponentially. Reduce batch size |
| Apollo no results | Mark as `apollo_no_match`. Fall through to info@ construction |
| LLM extraction returns garbage | Log the raw markdown + response. Flag for manual review |
| Email verification fails | Mark email as `unverified`. Don't use for outreach |

### Data Storage

| Data | Store? | Where | Retention |
|------|--------|-------|-----------|
| Raw Firecrawl Markdown | ✅ Yes — needed for re-extraction if LLM prompt improves | `siteData` field (JSON, compressed) | Until re-scraped |
| LLM extraction results | ✅ Yes | `contactPeople`, `businessDetails` fields | Permanent |
| Companies House raw response | ❌ No — reconstruct from company number | — | Query on demand |
| Apollo search results | ✅ Yes — cache to avoid re-querying | New `apolloCache` field or separate table | 60-90 days |
| Failed layer log | ✅ Yes | `failedLayers` JSON field | Until re-enriched |

---

## Prisma Schema Changes Needed (Updated)

Incorporates fields from docs 02, 03, and 04:

```prisma
model Place {
  // Existing fields...

  // === Chain Classification (doc 02) ===
  isChain                  Boolean?
  chainName                String?
  chainId                  String?    // Google chain ID
  classificationConfidence String?    // "high", "medium", "low"
  classificationMethod     String?    // "lookup_table", "domain_cluster", "google_chains", "manual"
  localGroupId             String?    // Groups local multi-site owners together

  // === Companies House Resolution (doc 03) ===
  companyNumber     String?
  companyName       String?    // Legal name (may differ from trading name)
  companyStatus     String?    // ACTIVE, DISSOLVED, etc.
  sicCodes          String?    // JSON array of SIC codes
  incorporationDate DateTime?
  directors         Json?      // Array of { name, role, appointedDate }

  // === Identity Resolution (doc 03) ===
  identityResolved       Boolean   @default(false)
  resolvedAt             DateTime?
  resolvedMethod         String?    // "website_scrape", "companies_house", "apollo", "info_email", "manual"
  resolvedConfidence     String?    // "high", "medium", "low"
  decisionMakerName      String?
  decisionMakerRole      String?
  decisionMakerEmail     String?
  decisionMakerPhone     String?
  failedLayers           Json?      // ["website_scrape", "companies_house"] — which layers were tried

  // === Pipeline Status ===
  enrichmentStatus       String?    // "pending", "in_progress", "resolved", "unresolvable", "skipped"
  lastEnrichmentAttempt  DateTime?
  enrichmentErrors       Json?      // Log of errors per layer

  // === Data Quality (doc 01) ===
  isViableProspect       Boolean?   // null = not assessed, false = non-prospect (church, school, etc.)
  prospectScore          Float?     // Scoring model output (see gaps doc)
}
```

---

## Implementation Recommendation

**Option C (Hybrid)** — ParkBunny owns the UK-specific intelligence (chain detection, Companies House, website scraping). Apollo handles people-finding.

**Priority order:**
1. Chain detection (lookup table — immediate, free)
2. Firecrawl + LLM extraction (website scraping — ~$85)
3. Companies House API integration (free)
4. Apollo people enrichment (existing account)
5. Email construction + ZeroBounce verification (~$90)
6. Pipeline orchestration (queue system for batch processing)

