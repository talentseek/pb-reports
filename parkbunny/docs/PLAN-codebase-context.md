# ParkBunny — Full Codebase Context Report

> Comprehensive audit of the ParkBunny platform: purpose, architecture, features, data model, routes, and development status.

---

## 1. What Is ParkBunny?

**ParkBunny** is a **Parking Revenue Enhancement Platform** that transforms car parking facilities into diversified revenue streams. The core business thesis:

> Car parks are underutilised real estate. By activating partnerships with nearby local businesses (restaurants, hotels, gyms, offices) and deploying ancillary infrastructure (lockers, EV chargers, self-service car washes), ParkBunny can deliver **20–50% revenue uplift** on top of existing parking income — with **zero CAPEX** for the operator.

### Who It's For

| Stakeholder | Value |
|-------------|-------|
| **Car park operators** (Euro Car Parks, Group Nexus, NSL, ParkBee, etc.) | Revenue reports proving uplift potential + plug-and-play ancillary services |
| **Local businesses** | Discounted parking validation to drive footfall |
| **ParkBunny investors** | Platform scalability across 10,000+ UK sites via partner portfolios |

### How It Works

1. **Report Creation** — Operator enters car park postcodes → ParkBunny fetches nearby businesses via Google Places API
2. **Revenue Modelling** — A 3-layer pricing engine calculates uplift from local partnerships + ancillary streams
3. **Bespoke Proposals** — Interactive, password-gated reports delivered to prospects (Buzz Bingo, NSL, ParkBee, etc.)
4. **Outreach** — AI voice agent ("Sarah") cold-calls businesses near LIVE car parks to acquire partners
5. **Demo App** — Configurable interactive demo simulating the driver experience (Find → Pay → Get Rewards)

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 14** (App Router, TypeScript) |
| Auth | **Clerk** (sign-in only, no public sign-up) |
| Database | **Prisma ORM** → PostgreSQL (Vercel Postgres in prod, SQLite locally) |
| Styling | **Tailwind CSS** + **shadcn/ui** (Radix primitives) |
| Mapping | **Leaflet.js** (`react-leaflet@4.2.1` for React 18 compat) |
| Charts | **Recharts** |
| PDF Export | **html2canvas-pro** + **jspdf** |
| Phone Parsing | **libphonenumber-js** (E.164 formatting for voice outreach) |
| Validation | **Zod** |
| Deployment | **Vercel** (GitHub: `talentseek/pb-reports`, `main` branch) |
| Domain | `parkbunny.app` |

---

## 3. Database Schema (15 Models)

### Core Models

| Model | Purpose |
|-------|---------|
| `User` | Clerk-authenticated users (clerkId, email) |
| `Report` | A car park portfolio — name, postcodes, settings (JSON), sharing fields |
| `Business` | Legacy mock businesses (from POC, pre-Google Places) |
| `ReportLocation` | A single postcode within a report — geocoded lat/lng, status (PENDING/LIVE) |
| `Place` | A Google Places result — placeId, name, types, rating, website, phone, enrichment data |
| `ReportLocationPlace` | Join table: which Places are linked to which Locations (with `included` flag) |

### Revenue & Proposals

| Model | Purpose |
|-------|---------|
| `RevenueStream` | Configurable ancillary streams per report (LOCKER, CAR_WASH, EV_CHARGING, FARMERS_MARKET) |
| `RevenueStreamExclusion` | Per-location opt-out from a stream (exclusion pattern) |

### Outreach & Voice

| Model | Purpose |
|-------|---------|
| `Campaign` | An outreach campaign targeting a business type at a specific location |
| `CampaignBusiness` | Per-business call tracking — vapiCallId, callStatus, transcript, extracted data |
| `VoiceConfig` | Global Twilio/Vapi credentials and calling settings |

### Utility

| Model | Purpose |
|-------|---------|
| `Feedback` | Bug/feature feedback from users (type, title, details, status) |

### Key Enums

- `LocationStatus`: PENDING, LIVE
- `EnrichmentStatus`: NOT_ENRICHED, ENRICHING, ENRICHED, FAILED
- `CampaignStatus`: CREATED → ENRICHING → ENRICHED → READY_TO_LAUNCH → LAUNCHED → CALLING → PAUSED → COMPLETED
- `CallStatus`: PENDING → QUEUED → IN_PROGRESS → (LEAD_CAPTURED | CALLBACK_BOOKED | NOT_INTERESTED | VOICEMAIL | GATEKEEPER_BLOCKED | NO_ANSWER | INVALID_NUMBER | FAILED | CTPS_BLOCKED)
- `StreamType`: LOCKER, CAR_WASH, EV_CHARGING, FARMERS_MARKET

---

## 4. Application Routes

### Internal (Clerk-authenticated)

| Route | Purpose |
|-------|---------|
| `/` | Redirect to dashboard |
| `/dashboard` | Report list with overview stats, location map, filters |
| `/reports/new` | Create new report (name + postcodes) |
| `/reports/[id]` | Report detail — summary, quick actions, places data |
| `/reports/[id]/settings` | Report settings — uplift rates, radius, revenue streams toggles |
| `/settings` | App-level settings |
| `/outreach` | Voice Outreach Hub — per-location calling progress |
| `/outreach/[locationId]` | Per-location business drill-down |
| `/outreach/campaigns/*` | Campaign management — creation, control room, call logs |
| `/outreach/voice-config` | Twilio/Vapi credentials and calling settings |
| `/outreach/inbox` | (Scaffold) Future email follow-up inbox |

### Public / Password-Gated

| Route | Password | Purpose |
|-------|----------|---------|
| `/share/[code]` | Per-report password | Public shared report with full visual showcase |
| `/nexuslockerproposal` | `nexuspb2026` | 89-site Group Nexus locker proposal with dynamic pricing |
| `/buzzbingoproposal` | `nexusbuzz2026` | 23-site Buzz Bingo multi-stream proposal (Lockers+CarWash+EV+Markets) |
| `/nslproposal` | `nslpb2026` | 12-site NSL West London portfolio proposal |
| `/parkbeeproposal` | `parkbeepb2026` | 2-site ParkBee proposal (Liverpool + Lanark Road) |
| `/jollysailor` | — | Bespoke site report (44KB component) |
| `/demo/[slug]` | None (open) | Interactive app demo (ECP ParkBuddy: 7-screen driver journey) |
| `/investordeck` | — | Full investor pitch deck (56KB component, PDF download) |

### API Routes

| Route | Purpose |
|-------|---------|
| `POST/GET /api/reports` | CRUD for reports |
| `GET /api/reports/[id]` | Single report with full data |
| `PATCH /api/reports/[id]/settings` | Update report settings |
| `*/api/reports/[id]/locations` | Location management |
| `*/api/reports/[id]/places` | Google Places fetch/refresh |
| `*/api/reports/[id]/placesByCategory` | Category-filtered places |
| `*/api/reports/[id]/categories` | Category aggregation |
| `*/api/reports/[id]/export` | Data export |
| `*/api/reports/[id]/share` | Share link management |
| `*/api/reports/[id]/streams/*` | Revenue stream CRUD + exclusions |
| `*/api/reports/[id]/archive` | Report archival |
| `*/api/outreach/campaigns/*` | Campaign CRUD |
| `*/api/outreach/enrich` | Outscraper enrichment pipeline |
| `*/api/outreach/voice/*` | Voice calling operations (start/pause/resume/screen) |
| `POST /api/webhooks/vapi` | Vapi webhook handler (public, secret-verified) |
| `*/api/feedback` | Bug/feature feedback |

---

## 5. Revenue Model (3-Layer Hierarchy)

The platform uses a standardised 3-layer revenue projection model:

### Layer 1: Baseline

Existing parking turnover. Standard: **£50,000/site/year** (configurable per report).

### Layer 2: Local Offers Uplift

Data-backed percentage increase from nearby business partnerships:

- Google Places API fetches businesses within configurable radius (default 0.75 miles)
- Businesses grouped into categories with standard multipliers:

| Category | Sign-Up Rate | Uplift Multiplier |
|----------|-------------|-------------------|
| Food & Drink | 5% | 8% |
| Entertainment | 5% | 7% |
| Shopping | 5% | 6% |
| Health & Wellness | 5% | 6% |
| Sports | 5% | 6% |
| Lodging | 5% | 5% |
| Services | 5% | 5% |

- **Target range**: 20–50% uplift (£10k–£25k/site/year)

### Layer 3: Additional Portfolio Uplift (Ancillary Streams)

| Stream | Rate | CAPEX |
|--------|------|-------|
| Smart Lockers | £900/site/year (min) | Zero |
| Self-Service Car Wash | £10k–£20k/site/year | Zero |
| EV Charging | ~£3,600/site/year (15% rev share) | Zero (rev share) |
| Farmers Markets | £1k–£2.5k/day | Zero |

---

## 6. Key Lib Modules

| File | Purpose |
|------|---------|
| `db.ts` | Prisma client singleton |
| `calculations.ts` | Core uplift calculation engine |
| `placesFetch.ts` | Google Places API integration — searchNearby + geocoding |
| `placesCategories.ts` | Category grouping and normalization |
| `placesSummary.ts` | Places data aggregation |
| `postcode.ts` | UK postcode utilities via postcodes.io |
| `businessAnalyzer.ts` | Business analysis and scoring |
| `outscraper.ts` | Outscraper API integration for enrichment |
| `hybridEnrichmentService.ts` | Multi-source enrichment pipeline |
| `googleSearchService.ts` | Google Search enrichment fallback |
| `revenue-streams.ts` | Revenue stream defaults, types, calculations |
| `voice-agent.ts` | Vapi integration, E.164 formatting, call dispatch |
| `voice-queue.ts` | Call scheduling, stats aggregation, retry logic |
| `ctps-check.ts` | CTPS (UK cold-call compliance) register screening |
| `share.ts` | Share code generation |
| `locker-logic.ts` | Nexus locker proposal — geocoding + distance-based pricing |
| `buzzbingo-logic.ts` | Buzz Bingo — geocoding + multi-stream revenue |
| `buzzbingo-places.ts` | Buzz Bingo — batch Google Places fetcher (also reused by NSL + ParkBee) |
| `nsl-logic.ts` | NSL proposal — 12-site West London logic |
| `parkbee-logic.ts` | ParkBee proposal — 2-site logic with car wash range |
| `demo-places.ts` | Demo app — Google Places distance fetcher for deals |
| `investor-data.ts` | Investor deck static content and metrics |
| `jollysailor-data.ts` | Jolly Sailor bespoke report data |

---

## 7. Development Status

### Completed Milestones

| Milestone | Status |
|-----------|--------|
| M1: POC UI + Mock Data | ✅ Complete |
| M2: Persistence + Settings | ✅ Complete |
| M3: Public Sharing (share codes, password gates, cookies) | ✅ Complete |
| M4: Google Places Integration (caching, radius, de-dup) | ✅ Complete |
| Nexus Locker Proposal (89 sites, dynamic pricing) | ✅ Deployed |
| Buzz Bingo Proposal (23 sites, multi-stream V3) | ✅ Deployed |
| NSL Proposal (12 sites, West London) | ✅ Deployed |
| ParkBee Proposal (2 sites, Liverpool + London) | ✅ Deployed |
| Investor Deck (15 slides, PDF download) | ✅ Deployed |
| Interactive Demo (ECP ParkBuddy, 7 screens) | ✅ Deployed |
| Revenue Streams (DB-backed, per-site toggles) | ✅ Deployed |
| Voice Outreach (Vapi/Twilio, CTPS, campaigns) | ✅ Schema + logic deployed |
| Outscraper Enrichment Pipeline | ✅ Deployed |
| Feedback Widget | ✅ Deployed |

### Outstanding Items

| Item | Notes |
|------|-------|
| Public report visual polish | Typography, spacing, responsive |
| Share view analytics in internal UI | DB fields exist, UI not built |
| Rate-limit share password attempts | Not implemented |
| PDF export for standard reports | Client print CSS or server PDF |
| API/calculation tests | No test files exist |
| Outreach email sending | Behind feature flag, not started |
| Outreach pipeline board | Manual status updates |
| GDPR/compliance processing | Opt-out handling, audit log |
| Investor Deck V2 | CEO feedback (£400k raise, partner logos, messaging rewrites) |

---

## 8. Static Assets (public/)

**53 files** including:

- **Brand logos**: ParkBunny (`logo.png`), Group Nexus, NSL, ParkBee, Buzz Bingo, Euro Car Parks, Savills, Agena Group, Newpark, Wise Parking, Britannia, Anchor Group, Intelli-Park
- **Product photos**: `lockerphoto.webp`, `selfservicecarwash.webp`, `carwash.webp`, `signage.jpg`, `dashboard.webp`, `mockup.png`, `rabbit.webp`
- **Investor materials**: 2 PDFs (V6 January + earlier), `Bizplanchanges.docx`
- **Demo assets**: ECP ParkBuddy logos and brand deal logos in `public/demo/`
- **Team photos**: 11 files in `public/team/`
- **PWA/SEO**: favicon, manifest, robots.txt, webmanifest

---

## 9. Architectural Patterns

### 1. Password-Gated Proposals

All client proposals follow the same pattern:
- **`page.tsx`** — Server component: fetches data (JSON + optional Google Places), renders ClientProposal
- **`ClientProposal.tsx`** — Client component: password gate → interactive dashboard
- **`*Map.tsx`** — Leaflet map with branded markers, fly-to on selection

### 2. Lightweight Demand Modelling

For high-volume proposals (20+ sites), the platform avoids database persistence:
- Batch-controlled (size 5) Google Places fetch at render time
- Category grouping with yield multipliers
- Demand Scores (1–10) based on business density
- Data returned as `PostcodePlaces[]` — consumed directly by components

### 3. Static Data Extraction

Excel/spreadsheet data → static JSON → bundled import (avoids Vercel filesystem issues):
- `lockers.xlsx` → `lockers-data.json` (via `convert-data.ts`)
- All proposal data is static JSON (buzzbingo-data, nsl-data, parkbee-data)

### 4. Co-Branding Pipeline

Header pattern: `[ParkBunny Logo] | [Partner Logo] | [Client Logo]` with scaled visual weight.

### 5. Exclusion-Based Revenue Streams

"All sites get all enabled streams by default" — operator deselects per-site via `RevenueStreamExclusion` join table. Avoids N×M row creation.

---

## 10. Origins

ParkBunny's architecture was pioneered by **The Store Room** demand modelling project — an interactive Leaflet map tool for identifying self-storage facility locations. That project established the core patterns (data ingestion → postcode geocoding → visual strategy → ROI projection) that ParkBunny scaled into a multi-stream parking revenue platform.
