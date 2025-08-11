# Development Plan

- [ ] M1: POC UI + Mock Data
  - [x] Dashboard list with links to reports
  - [x] UK postcode validation/normalization/dedupe
  - [x] Scaffold Next.js 14 App Router with TS & Tailwind
  - [x] Initialize Prisma (SQLite)
  - [x] Set up Clerk auth shell
  - [x] Routes: /dashboard, /reports/new, /reports/[id], /settings
  - [ ] Components: ReportForm, ReportView (ReportList done)
  - [ ] Extract ReportForm and ReportView into src/components/report and wire pages
  - [x] Lib: db client, mockData, calculations
  - [x] API: POST /api/reports, GET /api/reports, GET /api/reports/[id]
  - [x] Basic calculation: uplift x signUpRate x base per business
  - [ ] Basic error/loading states
- [ ] M2: Persistence + Settings
  - [x] Defaults surfaced in settings UI when absent
  - [x] Persist businesses and reports with Prisma
  - [x] Per-report settings JSON field
  - [x] Settings page to edit uplift and sign-up rates (and estimatedRevenuePerPostcode)
  - [x] Use settings in calculations
- [ ] M3: Polish
  - [x] Auth-protected routes with Clerk
  - [ ] Empty states and optimistic UX
  - [ ] Basic PDF export stub
  - [ ] Simple tests for API handlers
- [ ] M4: Post-POC Enhancements
  - [ ] Google Places API integration (0.75 miles)
  - [ ] Charts and ROI calculators
  - [ ] Outreach integration (Unipile)

## Tracking
- We will check off items as they are implemented and tested.


- [ ] Public share links (Option A)
  - [x] Default shared link + password on report creation
  - [x] DB fields (enabled, code, password hash, expiry, counters)
  - [x] API to enable/disable/regenerate and set password
  - [x] Public route /share/[code] with password gate and cookie
  - [x] Manage link from report settings page
  - [ ] View analytics counters in internal UI
  - [ ] Rate limit password attempts

## P1: Report Pages (Showcase + Internal Summary)

- [ ] Shared Report Showcase (/share/[code])
  - [ ] Executive summary with headline metrics (total businesses, projected revenue range)
  - [ ] Assumptions section (estimated revenue per postcode × count, uplift %, sign-up rates)
  - [ ] Business breakdown section (by category), concise and print-friendly
  - [ ] Basic branding polish and clear sectioning
  - [ ] Print/export-friendly layout (print CSS; PDF later)

- [ ] Internal Report Summary (/reports/[id])
  - [ ] Summary panel mirroring public executive summary (readable at a glance)
  - [ ] Quick actions: edit settings, regenerate link, copy public link/password
  - [ ] After-create banner showing the public link and copy actions

## P1: Search Controls (implemented)

- [x] Default radius 0.75 miles with UI control (min 0.5, max 10) on `/reports/new`
- [x] Testing cap: max results per category (`placesMaxPerType`, default 10, clamp 1–50) on `/reports/new`

## P2: Google Places Data Integration (preview-safe)

- [ ] Category grouping (initial)
  - Hotels & Accommodation (lodging: hotel, motel, b&b, resort)
  - Restaurants & Cafes (restaurant, cafe)
  - Bars & Nightlife (bar, night_club)
  - Fitness & Wellness (gym, spa)
  - Offices & Coworking (POI + keywords: coworking, shared workspace, office space)
  - Events & Conferences (POI + keywords: event venue, conference center, wedding venue)
  - Entertainment & Venues (POI + keywords: entertainment venue)
  - Retail & Services (store + keywords: retail space, catering service)
  - Community & Public (POI + keywords: community center)
- [ ] Schema
  - [ ] `Place` (placeId unique, name, types[], rating, priceLevel, lat/lng, minimal normalized fields, raw JSON)
  - [ ] `ReportLocation` (reportId, postcode, lat/lng, radiusMeters, lastFetchedAt, params)
  - [ ] `ReportLocationPlace` (join + metadata for category assignment)
- [ ] Server fetcher (server-only)
  - [ ] Geocode postcode → lat/lng
  - [ ] Per-category Nearby/Text Search with `placesMaxPerType` cap
  - [ ] Place Details fetch with field mask (rating, price_level, hours, contact)
  - [ ] TTL cache (24h) and backoff
- [ ] De-duplication
  - [ ] Dedup across categories and across locations by `placeId`
- [ ] UI wiring
  - [ ] Per-postcode sections render real counts and top categories
  - [ ] Keep overall summary at top
  - [ ] Fallback to placeholders when cache empty
