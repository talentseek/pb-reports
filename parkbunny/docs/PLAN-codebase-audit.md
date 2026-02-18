# ParkBunny — Full Codebase Audit & Development Roadmap

> **Date:** 18 February 2026  
> **Scope:** Complete platform analysis — functions, users, USP, and development gaps

---

## 1. What Is ParkBunny?

ParkBunny is a **Parking Revenue Enhancement Platform** that transforms car park assets into multi-stream revenue generators. It does this by:

1. **Discovering** nearby businesses around each car park using Google Places API
2. **Analysing** the revenue uplift potential from local partnerships (hotels, restaurants, gyms, offices, etc.)
3. **Generating** high-fidelity, shareable reports and bespoke proposals for car park operators/investors
4. **Enriching** business contact data via a hybrid AI pipeline (Google Search + Outscraper + Business Analysis)
5. **Enabling outreach** — campaigns to contact nearby businesses and onboard them as parking partners

### Who Is It For?

| User Type | How They Use ParkBunny |
|-----------|----------------------|
| **Car Park Operators** (e.g. Group Nexus, ParkBee, NSL, Buzz Bingo) | Receive bespoke portfolio-wide proposals showing ancillary revenue opportunities (lockers, car wash, EV charging) and local business partnership potential |
| **ParkBunny Internal Team** | Use the Dashboard + Reports + Outreach modules to manage the sales pipeline — creating reports, enriching leads, and running campaigns |
| **Investors** | View the password-protected Investor Deck at `/investordeck` to understand ParkBunny's business model, team, traction, and £400k raise at £4M pre-money |
| **Prospective Partners (public viewers)** | Access shared reports via `/share/[code]` with a password gate to see site-specific opportunity data |

---

## 2. Unique Selling Proposition (USP)

> **"No CapEx, AI-First, Data-Driven Parking Revenue Activation"**

Key differentiators:

- **Hyperlocal Intelligence** — Automated discovery of nearby businesses via Google Places, categorised into 7 groups (Hotels, Food & Drink, Shopping, Services, Health, Entertainment, Sports), with per-site density scoring
- **3-Layer Value Proposition** — Every report presents:
  - **Layer 1 (Baseline):** Current parking revenue (standardised at £50k/site)
  - **Layer 2 (Local Offers Uplift):** 20–50% yield increase from business partnerships, calculated dynamically from place density × category multipliers
  - **Layer 3 (Portfolio Uplift):** Ancillary revenue bolt-ons — lockers (£900/yr), car wash (£10k/yr), EV charging (£24.5k gross profit/yr)
- **Bespoke Proposal Engine** — Custom-branded proposals per client (Nexus Lockers with distance-based pricing, Buzz Bingo multi-stream dashboard, NSL, ParkBee) generated as interactive web dashboards, not static PDFs
- **AI Enrichment Pipeline** — Multi-source business contact discovery (Google Custom Search + Outscraper + chain detection + relevance scoring) that can de-duplicate and filter contacts intelligently
- **Lean AI-First Operations** — CEO states team of 5 delivers what traditionally requires 15–20 people via AI-powered support, outreach automation, and AI-generated reporting

---

## 3. Complete Feature Map

### 3.1 Dashboard (`/dashboard`)

| Feature | Status |
|---------|--------|
| Report list with stats (total, active, archived) | ✅ Complete |
| Location map (all active report locations on Leaflet) | ✅ Complete |
| Business category breakdown (grouped counts from DB) | ✅ Complete |
| Create New Report CTA | ✅ Complete |
| Overview stats cards | ✅ Complete |
| Filters (by status, search) | ✅ Complete |

### 3.2 Reports (`/reports`)

| Feature | Status |
|---------|--------|
| Create new report (name + postcodes) | ✅ Complete |
| Report list view | ✅ Complete |
| Internal report summary (`/reports/[id]`) — uplift totals, per-location breakdowns | ✅ Complete |
| Report settings (radius, caps, per-category uplift/sign-up overrides) | ✅ Complete |
| Google Places fetch (Normal/Force refresh) | ✅ Complete |
| Location status toggle (PENDING → LIVE) | ✅ Complete |
| Archive/unarchive reports | ✅ Complete |
| Export (API endpoint exists) | ✅ Complete |
| Places by category drill-down | ✅ Complete |

### 3.3 Public Sharing (`/share/[code]`)

| Feature | Status |
|---------|--------|
| Password-gated public access | ✅ Complete |
| Cookie-based session persistence | ✅ Complete |
| Modular public report view (6 sub-components) | ✅ Complete |
| Current vs Potential revenue charts (Recharts) | ✅ Complete |
| Business distribution charts | ✅ Complete |
| Interactive Leaflet map with nearby place markers | ✅ Complete |
| Commercial terms table | ✅ Complete |
| View count tracking | ✅ Complete |
| Rate-limit password attempts | ❌ Not implemented |
| View analytics in internal UI | ❌ Not implemented |
| Visual polish pass | ❌ Not implemented |

### 3.4 Bespoke Proposals (5 Client-Specific Pages)

| Proposal | Route | Data Source | Key Logic |
|----------|-------|-------------|-----------|
| **Nexus Lockers** | `/nexuslockerproposal` | `lockers-data.json` (89 sites) | Distance-based pricing: £1,600 (city centre) → £900 (outer), linear decay over 5 miles. Leaflet map + searchable sidebar |
| **Buzz Bingo** | `/buzzbingoproposal` | `buzzbingo-data.json` | Multi-stream analysis: Lockers (£900/yr), Car Wash (£10k/yr), EV Charging (£25k/yr GP). Regional grouping |
| **NSL** | `/nslproposal` | `nsl-data.json` | Lockers + Car Wash portfolio rollout, flat pricing |
| **ParkBee** | `/parkbeeproposal` | `parkbee-data.json` | Lockers + Car Wash with min/max range (£10k–£20k/yr per site) |
| **Jolly Sailor** | `/jollysailor` | `jollysailor-data.ts` | Site-specific proposal |

All proposals share:
- Client-side password protection
- Co-branded headers (ParkBunny + Client logos)
- Leaflet.js interactive maps
- postcodes.io geocoding
- Portfolio summary calculations with £50k/site baseline

### 3.5 Investor Deck (`/investordeck`)

| Feature | Status |
|---------|--------|
| Password-protected (`parkbunny2026`) | ✅ Complete |
| Team profiles (4 members with photos) | ✅ Complete |
| Partner logos (Savills, CP Plus, APCOA, Group Nexus, etc.) | ✅ Complete |
| Revenue model (1.5% + 20p per transaction) | ✅ Complete |
| Investment ask (£400k at £4M pre-money) | ✅ Complete |
| AI Operations section | ✅ Complete |
| Track record (100k spaces added in <2 years) | ✅ Complete |

### 3.6 Outreach Module (`/outreach`)

| Feature | Status |
|---------|--------|
| Location cards showing live locations with businesses | ✅ Complete |
| Per-location detail page (`/outreach/[locationId]`) | ✅ Complete |
| Campaign creation and listing (`/outreach/campaigns`) | ✅ Complete |
| Campaign workflow steps (Select → Enrich → Launch) | ✅ Complete |
| AI Enrichment step — triggers hybrid enrichment pipeline | ✅ Complete |
| Launch step — email template generation per category | ✅ Complete |
| Contact person selection with email deduplication | ✅ Complete |
| CSV export of selected contacts | ✅ Complete |
| Inbox page (`/outreach/inbox`) | 🟡 Shell only |
| Actual email sending integration | ❌ Not implemented |
| LinkedIn/Unipile integration | ❌ Not implemented |
| Click/response tracking | ❌ Not implemented |
| Pipeline board with status columns | ❌ Not implemented |

### 3.7 Enrichment Pipeline (Backend Services)

| Service | Role | Status |
|---------|------|--------|
| `BusinessAnalyzer` | Profiles businesses (complexity scoring, chain detection, category mapping) and recommends enrichment strategy | ✅ Complete |
| `GoogleSearchService` | Custom Search API for contact discovery (names, titles, LinkedIn profiles) | ✅ Complete |
| `OutscraperService` | Website scraping with smart filtering (MINIMAL/MODERATE/AGGRESSIVE levels) and relevance scoring | ✅ Complete |
| `HybridEnrichmentService` | Orchestrates all three sources, combines contacts, deduplicates, and scores relevance | ✅ Complete |

### 3.8 Supporting Features

| Feature | Status |
|---------|--------|
| Clerk authentication (invite-only, no public sign-up) | ✅ Complete |
| Feedback widget (Bug/Feature submission) | ✅ Complete |
| UK postcode normalisation and deduplication | ✅ Complete |
| Google Places caching (12h staleness window) | ✅ Complete |
| Haversine distance filtering | ✅ Complete |
| PDF download button | 🟡 Shell exists (jsPDF + html2canvas installed) |

---

## 4. Technical Architecture

### Stack
- **Framework:** Next.js 14 (App Router)
- **Auth:** Clerk (invite-only)
- **Database:** Prisma ORM → PostgreSQL (Vercel Postgres)
- **Styling:** Tailwind CSS + ShadcnUI
- **Maps:** Leaflet.js + react-leaflet
- **Charts:** Recharts
- **Enrichment APIs:** Google Places API, Google Custom Search API, Outscraper API
- **Geocoding:** postcodes.io (UK postcodes)
- **PDF:** jsPDF + html2canvas-pro (installed but minimal usage)
- **Validation:** Zod

### Database Schema (8 Models)

```mermaid
erDiagram
    User ||--o{ Report : owns
    Report ||--o{ Business : has
    Report ||--o{ ReportLocation : contains
    ReportLocation ||--o{ ReportLocationPlace : links
    Place ||--o{ ReportLocationPlace : "linked via"
    ReportLocationPlace ||--o{ CampaignBusiness : "added to"
    Campaign ||--o{ CampaignBusiness : contains
    Feedback : standalone
```

### Key Enums
- `LocationStatus`: PENDING → LIVE
- `EnrichmentStatus`: NOT_ENRICHED → ENRICHING → ENRICHED / FAILED
- `CampaignStatus`: CREATED → ENRICHING → ENRICHED → READY_TO_LAUNCH → LAUNCHED

---

## 5. What's Missing — Development Roadmap

### 🔴 Critical Gaps (Revenue-Blocking)

| Gap | Impact | Effort |
|-----|--------|--------|
| **No email sending** — outreach campaigns generate templates and CSV but can't actually send emails | Partners never get contacted automatically | Medium — integrate Resend/Postmark |
| **No pipeline board** — no CRM-style tracking of outreach status per business (Queued → Contacted → Interested → Live) | Sales team has no visibility on campaign progress | Medium |
| **Mock data in outreach** — enrichment progress and contacted counts use `getMockProgress()` with seed-based fake numbers | Misleading dashboard stats | Small — replace with real DB queries |

### 🟡 Important Gaps (Product Quality)

| Gap | Impact | Effort |
|-----|--------|--------|
| **No tests** — zero test files exist anywhere in the codebase | Fragile; any refactor risks breaking features | Medium |
| **PDF export incomplete** — jsPDF installed but only a shell `DownloadPdfButton` exists | Operators can't offline-share reports | Medium |
| **No rate limiting on share passwords** — brute-force risk on public reports | Security vulnerability | Small |
| **No share analytics in UI** — view counts tracked in DB but not displayed anywhere | Can't assess report engagement | Small |
| **Inbox is a shell** — `/outreach/inbox` route exists but has no real functionality | Can't track responses/replies | Medium |
| **Visual polish** — shared public reports need typography/spacing pass | First impression for clients | Small |

### 🟢 Strategic Enhancements (Growth)

| Enhancement | Description | Effort |
|-------------|-------------|--------|
| **Templated proposal generator** — DRY the 5 bespoke proposal pages into a single configurable template system | Currently each client gets hand-coded pages; doesn't scale | Large |
| **Multi-tenant/organisation support** — Clerk organisations to let operators self-serve their own reports | Currently single-user internal tool | Large |
| **Webhook reply ingestion** — receive and route email replies from outreach campaigns | Closes the outreach loop | Medium |
| **GDPR compliance module** — opt-out handling, audit log for mailings, processing notes | Required before scaling outreach | Medium |
| **Dynamic pricing engine evolution** — the pricing models are hardcoded per proposal; needs to become configurable | Each new client requires code changes | Medium |
| **API test suite** — Vitest or Jest for API handlers and calculation logic | Essential for CI/CD confidence | Medium |
| **LinkedIn outreach integration** — connect via Unipile for multi-channel outreach | Higher response rates | Medium |
| **Real-time notifications** — webhook or polling for enrichment completion | Better UX during long enrichment runs | Small |
| **Geocode duplicated code** — `geocodePostcode()` is duplicated across 4+ files | Technical debt | Small |

### 🔵 Code Quality Notes

1. **Duplicated logic** — `geocodePostcode()`, `formatCurrency()`, `calculatePortfolioSummary()` are copy-pasted across `buzzbingo-logic.ts`, `nsl-logic.ts`, `parkbee-logic.ts`, and `locker-logic.ts`
2. **`placesFetchFixed.ts`** is a 1:1 duplicate of `placesFetch.ts` — dead code
3. **`convert-data.ts`** and `debug-xlsx.ts` in root are one-off utility scripts that should be in `/scripts`
4. **Legacy category mapping** — both `PLACE_CATEGORIES` and `LEGACY_PLACE_CATEGORIES` exist in `placesCategories.ts`; the legacy set appears unused
5. **Mock data pattern** — `mockData.ts` and `getMockProgress()` are used in production views, creating false impressions

---

## 6. Summary

ParkBunny is a functional **data-driven sales tool** with a sophisticated backend (Places API integration, multi-source enrichment pipeline, dynamic pricing models) and impressive bespoke proposal generation. The core value loop — **discover → analyse → present → outreach** — is 80% complete.

**The biggest gap is closing the outreach loop**: the system can discover businesses, enrich contacts, generate personalised email templates, and export CSVs, but **cannot actually send emails, track responses, or manage a sales pipeline**. This is the single highest-impact development area.

The second priority is **productising the proposal engine** — currently each client (Nexus, Buzz Bingo, NSL, ParkBee, Jolly Sailor) has its own hand-coded page. A templated system would allow the team to onboard new clients without developer intervention.
