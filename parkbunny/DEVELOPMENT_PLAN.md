# Development Plan

- [ ] M1: POC UI + Mock Data
  - [ ] Scaffold Next.js 14 App Router with TS & Tailwind
  - [ ] Initialize Prisma (SQLite)
  - [ ] Set up Clerk auth shell
  - [ ] Routes: /dashboard, /reports/new, /reports/[id], /settings
  - [ ] Components: ReportForm, ReportList, ReportView
  - [ ] Lib: db client, mockData, calculations
  - [ ] API: POST /api/reports, GET /api/reports, GET /api/reports/[id]
  - [ ] Basic calculation: uplift x signUpRate x base per business
  - [ ] Basic error/loading states
- [ ] M2: Persistence + Settings
  - [ ] Persist businesses and reports with Prisma
  - [ ] Per-report settings JSON field
  - [ ] Settings page to edit uplift and sign-up rates
  - [ ] Use settings in calculations
- [ ] M3: Polish
  - [ ] Auth-protected routes with Clerk
  - [ ] Empty states and optimistic UX
  - [ ] Basic PDF export stub
  - [ ] Simple tests for API handlers
- [ ] M4: Post-POC Enhancements
  - [ ] Google Places API integration (0.75 miles)
  - [ ] Charts and ROI calculators
  - [ ] Outreach integration (Unipile)

## Tracking
- We will check off items as they are implemented and tested.
