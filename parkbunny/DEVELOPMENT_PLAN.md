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
