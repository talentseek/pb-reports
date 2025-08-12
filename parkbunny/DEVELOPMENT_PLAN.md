# Development Plan

We track implemented work and what remains. Checked items are complete and available in the app.

- [x] M1: POC UI + Mock Data
  - [x] Dashboard list with links to reports
  - [x] UK postcode normalization/dedupe
  - [x] Scaffold Next.js App Router with TS & Tailwind
  - [x] Initialize Prisma (SQLite for local)
  - [x] Clerk auth shell (sign-in only; public sign-up removed)
  - [x] Routes: `/dashboard`, `/reports/new`, `/reports/[id]`, `/reports/[id]/settings`
  - [x] Components: `ReportForm`, `ReportList`, `ReportView`
  - [x] Lib: db client, calculations
  - [x] API: POST/GET `/api/reports`, GET `/api/reports/[id]`
  - [x] Basic projection: uplift × signUpRate × base, per included business

- [x] M2: Persistence + Settings
  - [x] Per-report `settings` JSON with defaults (estimatedRevenuePerPostcode £50k, radiusMiles 0.75, placesMaxPerType 10)
  - [x] Settings page: uplift/sign-up per category, radius, caps
  - [x] Calculations use included businesses and per-category overrides

- [x] M3: Public Sharing
  - [x] Default shared link and password on report creation
  - [x] DB fields: enabled, code, password hash, expiry, counters
  - [x] API to enable/disable/regenerate and set password
  - [x] Public route `/share/[code]` with password gate and cookie
  - [ ] View analytics counters in internal UI
  - [ ] Rate-limit password attempts

- [x] M4: Google Places Integration
  - [x] Schema: `Place`, `ReportLocation`, `ReportLocationPlace` (join + included flag)
  - [x] Geocode postcode → lat/lng (fallback to Places Text Search)
  - [x] Nearby/Text Search per category with `placesMaxPerType` caps
  - [x] Normalized `priceLevel` to integers; stored `parkingOptions`
  - [x] Caching with staleness window (12h) and Force refresh
  - [x] Radius enforcement: hard circle + haversine post-filter
  - [x] De-dup by `placeId` with safe linking per location

## Report Pages (Showcase + Internal Summary)

- [x] Internal Report Summary (`/reports/[id]`)
  - [x] Summary panel with projected uplift, totals, per-location breakdowns
  - [x] Quick actions: settings, refresh places (Normal/Force), copy public link

- [x] Shared Report Showcase (`/share/[code]`)
  - [x] Modular shadcn redesign; sections per `reportstructure.md`
  - [x] Charts: Current vs Potential, Business Type distribution
  - [x] Maps with markers for included places
  - [x] Commercial terms table (uniform styling)
  - [ ] Visual polish and typography pass (Follow-up)

## Search Controls

- [x] Default radius 0.75 miles with UI control (min 0.5, max 10)
- [x] Testing cap: max results per category (`placesMaxPerType`, default 10, clamp 1–50)
- [x] Strict radius handling across fetch and persistence

## Security & Auth

- [x] Clerk middleware configured (`src/middleware.ts`), app wrapped in `ClerkProvider`
- [x] Public sign-up removed (no `/sign-up` route; header link removed)
- [x] Public share page runs without Clerk UI and requires password

## Follow-ups (tracked)

- [ ] Public Showcase: comprehensive visual polish with shadcn, spacing, and responsive typography
- [ ] View analytics counters (share views) in internal UI
- [ ] Rate-limit share password attempts
- [ ] PDF export (client print CSS first; server PDF later)
- [ ] Tests for API handlers and calculations

## Stage 2: Outreach (Planning)

Goal: Turn discovered nearby businesses into a prioritized outreach pipeline per location and category.

- Data pipeline
  - [ ] Export outreach-ready list per report/location: business name, category, address, lat/lng, website/phone
  - [ ] Optional enrichment: website scraping for contact emails, LinkedIn lookup, company sizing
  - [ ] De-dup across locations; tag with nearest car park and category

- Targeting & templates
  - [ ] Message templates per category (Hotels, Gyms, Offices, Restaurants, Venues, Retail, Community)
  - [ ] Personalization tokens: `{business_name}`, `{postcode}`, `{category_benefit}`, `{offer_example}`
  - [ ] Sequences: intro → value → offer (validated parking / Instant Deals) → close

- Delivery channels
  - [ ] Email delivery integration (e.g., Resend, Postmark) with rate limiting
  - [ ] LinkedIn/manual assist workflow (optional Unipile integration)
  - [ ] Click/response tracking and reply ingestion (mailbox webhook)

- Operator workflow
  - [ ] Outreach dashboard: status columns (Queued, Contacted, Interested, Live)
  - [ ] One-click generate unique validation links/codes per merchant
  - [ ] Auto-attach location and offer type to each outreach item

- Compliance
  - [ ] GDPR-friendly processing notes; opt-out handling; audit log for mailings

Deliverables for Stage 2

- [ ] Minimal “Outreach” tab on report: export CSV + template preview
- [ ] Email sending integration behind feature flag
- [ ] Basic pipeline board per report with manual status updates
