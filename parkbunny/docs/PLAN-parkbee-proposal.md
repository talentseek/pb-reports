# ParkBee Revenue Enhancement Proposal

Co-branded ParkBunny + ParkBee report for 2 locations: **Liverpool** (`L1 4AT`) and **Lanark Road** (`W9 1UB`).

## Key Decisions

| Decision | Value |
|----------|-------|
| Route | `/parkbeeproposal` |
| Password | `parkbeepb2026` |
| Branding | Dual: ParkBunny + ParkBee |
| Layout | Per-location cards (inspired by `MultiLocationSection` in the standard reports) — each site gets its own map + business breakdown |
| Lockers | £900 + VAT/yr **minimum**, "can dramatically increase subject to location and footfall", 1yr contract, no power, fully serviced & insured |
| Car Wash | £10k–£20k range, **"Subject to survey"** in bold, Zero CAPEX |
| EV Charging | Keep as optional (same as NSL — Tesla etc.) |
| Farmers Markets | Keep as optional |
| Waterless Car Wash | **Removed** — not included |

> [!IMPORTANT]
> Locker copy is updated for ParkBee only. NSL report stays unchanged.

---

## Proposed Changes

### Assets

#### [NEW] [parkbee-logo.svg](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/public/parkbee-logo.svg)
Download ParkBee logo from their website (`parkbee.com`). Save to `public/parkbee-logo.svg` or `.png`.

---

### Data Layer

#### [NEW] [parkbee-data.json](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/lib/parkbee-data.json)
2-site JSON array, same schema as `nsl-data.json`:
```json
[
  { "id": "liverpool", "name": "Liverpool", "postcode": "L1 4AT", "region": "Liverpool", "streams": ["locker", "carwash"] },
  { "id": "lanark-road", "name": "Lanark Road", "postcode": "W9 1UB", "region": "London", "streams": ["locker", "carwash"] }
]
```

#### [NEW] [parkbee-logic.ts](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/lib/parkbee-logic.ts)
Adapted from `nsl-logic.ts` with key changes:
- **Car wash**: range object `{ min: 10000, max: 20000 }` instead of flat `10000`
- Updated locker copy constants for display
- `calculatePortfolioSummary()` returns car wash as min/max range
- Reuses geocoding from `buzzbingo-places.ts`

---

### App Route (`/parkbeeproposal`)

#### [NEW] [page.tsx](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/app/parkbeeproposal/page.tsx)
Server component — same pattern as NSL `page.tsx`. Fetches site data + Google Places data.

#### [NEW] [ParkBeeMap.tsx](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/app/parkbeeproposal/ParkBeeMap.tsx)
Leaflet map component. Since sites are far apart (Liverpool + London), default to **UK-wide zoom (6)** instead of NSL's West London zoom. Use green markers to match ParkBee brand.

#### [NEW] [ClientProposal.tsx](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/app/parkbeeproposal/ClientProposal.tsx)
Main report UI — adapted from NSL `ClientProposal.tsx` with these changes:

1. **Login screen**: Dual ParkBunny + ParkBee branding, password `parkbeepb2026`
2. **Header**: Dual logos (ParkBunny | ParkBee)
3. **Hero**: "2 Sites", updated baseline, car wash range messaging
4. **Per-location sections** (new layout):
   - Each site gets its own card with a Leaflet map (zoomed to ~14), Google Places business breakdown, and per-site uplift summary
   - Inspired by `MultiLocationSection` pattern from system reports
5. **Lockers section**: Updated copy per Jon's instructions:
   - "Minimum revenue £900 + VAT per year — this can dramatically increase subject to location and footfall"
   - "Per locker, per location. 1 year contract. No power required. Fully serviced and insured."
6. **Car wash section**: Range display `£10,000–£20,000/yr`, **"Subject to survey"** in bold, Zero CAPEX
7. **No waterless car wash** — removed entirely
8. **EV + Farmers Markets**: Kept as optional extras (same pattern as NSL)
9. **Summary table**: Car wash shows range, total as midpoint (£30k) or conservative (£20k–£40k)

---

## Verification Plan

### Build Test
```bash
cd /Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny && npm run build
```
Expect: exit code 0, `/parkbeeproposal` route listed in output.

### Browser Test
1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:3000/parkbeeproposal`
3. Verify login screen shows ParkBunny + ParkBee dual branding
4. Enter password `parkbeepb2026` → report loads
5. Verify hero shows "2 Sites"
6. Verify per-location sections show individual maps for Liverpool and Lanark Road
7. Verify both sites show non-zero business counts and uplift values
8. Verify locker copy reads: "Minimum revenue £900 + VAT per year..."
9. Verify car wash shows range (£10k–£20k) with **Subject to survey** in bold
10. Verify **no waterless car wash** section exists
11. Verify EV + Farmers Markets appear as optional extras
12. Verify summary table totals are correct
