# NSL Portfolio Revenue Enhancement Proposal

ParkBunny multi-stream revenue report for **12 Marston NSL car parks** across West London (Hounslow, Feltham, Isleworth, Chiswick). Modelled on the Buzz Bingo proposal architecture but tailored for the NSL portfolio.

## Key Decisions

> [!IMPORTANT]
> **Branding**: Dual (ParkBunny + NSL) — not triple like Buzz Bingo.
> **Password**: `nslpb2026`
> **Route**: `/nslproposal`
> **Locker Pricing**: Flat £900/site (£10,800 P.A. total for 12 sites)
> **Car Wash**: £10k/yr/site, zero CAPEX (same model as Buzz Bingo)
> **EV / Farmers Markets**: Included as optional informational extras

---

## Proposed Changes

### Data Layer

#### [NEW] [nsl-data.json](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/lib/nsl-data.json)

Static JSON with the 12 approved NSL sites. Structure mirrors `buzzbingo-data.json`:

```json
[
  {
    "id": "blenheim-centre",
    "name": "Blenheim Centre, 632 Prince Regent Rd",
    "postcode": "TW3 1NN",
    "region": "Hounslow",
    "streams": ["locker", "carwash"]
  }
]
```

Sites (all "approved subject to survey"):

| # | Name | Postcode | Region |
|---|------|----------|--------|
| 1 | Blenheim Centre, 632 Prince Regent Rd | TW3 1NN | Hounslow |
| 2 | Bell Road | TW3 3NX | Hounslow |
| 3 | Bethany Waye | TW14 8BU | Feltham |
| 4 | Bridge House, Crendon Ct | TW13 5DD | Feltham |
| 5 | Chiswick Common Road | W4 1SA | Chiswick |
| 6 | Inwood Road | TW3 1XA | Hounslow |
| 7 | 11 Montague Rd East | TW3 1JY | Hounslow |
| 8 | 26 Montague Rd West | TW3 1LD | Hounslow |
| 9 | 15 Prince Regent Rd | TW3 1NU | Hounslow |
| 10 | Redlees | TW7 6EE | Hounslow |
| 11 | Wisdom Court, 65 South St | TW7 7AA | Isleworth |
| 12 | Chiswick House, A4 | W4 2AQ | Chiswick |

**Rejected**: Kingsley Road, TW3 1QD — excluded from data.

---

#### [NEW] [nsl-logic.ts](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/lib/nsl-logic.ts)

Adapted from `buzzbingo-logic.ts`. Key differences:
- **No EV stream in core calculations** (included as informational text only)
- **Flat locker rate**: £900/site (no distance-based pricing)
- **Region grouping**: Simplified since all sites are West London (Hounslow / Feltham / Chiswick / Isleworth)
- Same geocoding via `postcodes.io`, same `formatCurrency` helper

---

### Google Places Integration

Reuses `buzzbingo-places.ts` directly — no new file needed. The `fetchAllBuzzBingoPlaces()` function is generic (takes `{postcode, name}[]`). We'll rename the export in `nsl-logic.ts` for clarity but call the same underlying functions.

> [!NOTE]
> Since all 12 sites are in a tight West London cluster, Google Places API calls will likely return overlapping nearby businesses. This is expected and actually strengthens the demand density argument.

---

### App Route

#### [NEW] [page.tsx](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/app/nslproposal/page.tsx)

Server component, same pattern as `buzzbingoproposal/page.tsx`:
- Import `getNSLData()` from `nsl-logic.ts`
- Import `fetchAllBuzzBingoPlaces()` from `buzzbingo-places.ts`
- Render `<ClientProposal />` with data + placesData

#### [NEW] [ClientProposal.tsx](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/app/nslproposal/ClientProposal.tsx)

Adapted from `buzzbingoproposal/ClientProposal.tsx` (~536 lines). Key changes:

| Aspect | Buzz Bingo | NSL |
|--------|-----------|------|
| Password | `nexusbuzz2026` | `nslpb2026` |
| Branding | Triple (ParkBunny / Group Nexus / Buzz Bingo) | Dual (ParkBunny / NSL) |
| Logo pipeline | 3 logos in header | 2 logos: ParkBunny (`/logo.png`) + NSL (`/nsl-logo.svg`) |
| Locker pricing | £900/site (flat) | £900/site (flat) — same |
| Car wash | £10k/site | £10k/site — same |
| EV section | Full toggle | Informational text (optional extra) |
| Farmers Markets | Informational | Informational (optional extra) |
| Map center | UK-wide (`[53.5, -2.0]`, zoom 6) | West London focus (`[51.46, -0.35]`, zoom 12) |
| Region labels | Yorkshire, Midlands, etc. | Hounslow, Feltham, Chiswick, Isleworth |

Sections in the report:
1. **Login screen** — Dual-branded, password gate
2. **Portfolio Summary** — Hero cards (total sites, estimated uplift, locker + car wash revenue)
3. **Interactive Map** — Leaflet centered on West London with all 12 markers
4. **Local Offers Uplift** — Per-site Google Places demand analysis (Layer 2)
5. **Ancillary Revenue** — Lockers (£10,800 P.A.) + Car Wash (£120,000 P.A.)
6. **Optional Extras** — EV Charging + Farmers Markets (informational only)
7. **Commercial Terms** — Summary with next steps
8. **Full Site List** — Scrollable grid of all 12 sites with projected uplift

#### [NEW] [NSLMap.tsx](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/app/nslproposal/NSLMap.tsx)

Adapted from `BuzzBingoMap.tsx` (~75 lines). Changes:
- Blue markers (NSL brand) instead of red
- Default center: West London `[51.46, -0.35]`, zoom 12
- Popup prefix: "NSL" instead of "Buzz Bingo"

---

### Assets

#### [NEW] [nsl-logo.svg](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/public/nsl-logo.svg)

✅ Already downloaded from Marston Holdings website.

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| NEW | `src/lib/nsl-data.json` | 12-site static data |
| NEW | `src/lib/nsl-logic.ts` | Revenue calculation + geocoding |
| NEW | `src/app/nslproposal/page.tsx` | Server component |
| NEW | `src/app/nslproposal/ClientProposal.tsx` | Main report UI |
| NEW | `src/app/nslproposal/NSLMap.tsx` | Leaflet map |
| NEW | `public/nsl-logo.svg` | NSL logo (already downloaded) |
| — | `src/lib/buzzbingo-places.ts` | Reused as-is (no changes) |

**Total new files: 6** (1 already created). No existing files modified.

---

## Verification Plan

### Browser Testing

1. **Start dev server**: `npm run dev`
2. **Navigate to** `http://localhost:3000/nslproposal`
3. **Password gate**: Verify `nslpb2026` grants access, wrong password shows error
4. **Dual branding**: Confirm ParkBunny + NSL logos render correctly in header and login screen
5. **Portfolio summary**: Verify 12 sites shown, locker total = £10,800, car wash total = £120,000
6. **Map**: All 12 markers visible on West London map, fly-to works on click
7. **Google Places data**: At least some sites show demand scores and business counts
8. **Local Offers Uplift**: Per-site uplift values calculated (Layer 2)
9. **Optional extras**: EV + Farmers Markets show as informational sections, not interactive toggles
10. **Responsive**: Check on mobile viewport (390px width)

### Production Build

```bash
npm run build
```

Verify no build errors on the new route.
