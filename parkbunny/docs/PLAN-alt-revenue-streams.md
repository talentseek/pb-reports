# Alternative Revenue Streams — Implementation Plan

> Add 9 new "Alternative Revenue Streams" to standard ParkBunny reports. These are informational-only cards — they do **NOT** add to the portfolio total uplift calculation. All are marked **SUBJECT TO SURVEY**.

---

## How The Current System Works

The existing revenue streams flow through a tightly-coupled pipeline:

1. **Prisma `StreamType` enum** — 4 fixed values: `LOCKER`, `CAR_WASH`, `EV_CHARGING`, `FARMERS_MARKET`
2. **`RevenueStream` DB table** — per-report records with `enabled`, `ratePerSite`, `rateMin`, `rateMax`
3. **Settings page** (`/reports/[id]/settings`) — toggles, rate editing, per-location exclusion grid
4. **`STREAM_DEFAULTS`** in `revenue-streams.ts` — hardcoded label, icon, image, description, bullets, default rates, pricing mode (flat | range | text-only)
5. **`AncillaryServices`** in `PublicCommercial.tsx` — renders a card per enabled stream with image + bullets + pricing box
6. **`PublicRevenueSummary`** — dark summary table that **adds stream values to the grand total** (`grandTotal = baseline + localOffersUplift + allStreamTotals`)

### Key Constraint

The **existing 4 streams add to the grand total.** Jon's new streams must **NOT** add to the total. They need to be rendered separately as informational "Alternative Revenue Streams" with no calculation impact.

---

## New Streams to Add

| # | Stream | Revenue | Pricing Mode | Notes |
|---|--------|---------|-------------|-------|
| 1 | **Tesla Demo Vehicles** | £50,000/yr | Flat rate | — |
| 2 | **We Buy Any Car** | £15,000/yr | Flat rate | 10 spaces |
| 3 | **Giant Washing Machines** | £1,500/yr | Flat rate | Revenue share model |
| 4 | **Dog Grooming Stations** | £5k–£10k | Range | Per site per year |
| 5 | **NHS Mobile MRI Scanner** | £7,500/yr | Flat rate | Max 7 days per month |
| 6 | **Unit Base (Film Crew Hosting)** | £5k–£50k | Range | Depending on duration |
| 7 | **Electric Bike Bays** | £5,000+/yr | Text-only | Per bay, quantity TBC |
| 8 | **Waterless Car Wash** | £15k–£45k | Range | Depending on footfall |
| 9 | **Digital Signage** | £10k–£50k+ | Range | Depending on footfall & location |

---

## Design Decisions

| Decision | Answer |
|----------|--------|
| Add to total uplift? | **NO** — informational only |
| Toggleable per report? | **YES** — same settings UI pattern as existing streams |
| Per-location exclusions? | **YES** — same exclusion grid |
| Displayed where? | New **"Alternative Revenue Streams"** section rendered AFTER the existing `AncillaryServices` + `PublicRevenueSummary` |
| Status label | All show **"Subject to Survey"** |
| Images | **Placeholder** initially (grey placeholder cards) — user will supply real images later |
| DB storage | Same `RevenueStream` table — extend `StreamType` enum with 9 new values |
| Rate editing in settings? | Yes, same pattern — flat rate input OR min/max range inputs OR text-only (no editing) |

---

## Proposed Changes

### 1. Database Layer

#### [MODIFY] [schema.prisma](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/prisma/schema.prisma)

Extend the `StreamType` enum with 9 new values:

```diff
 enum StreamType {
   LOCKER
   CAR_WASH
   EV_CHARGING
   FARMERS_MARKET
+  TESLA_DEMO
+  WE_BUY_ANY_CAR
+  GIANT_WASHING_MACHINE
+  DOG_GROOMING
+  NHS_MRI_SCANNER
+  FILM_CREW_HOSTING
+  ELECTRIC_BIKE_BAY
+  WATERLESS_CAR_WASH
+  DIGITAL_SIGNAGE
 }
```

**Migration**: Additive only (no dropping columns). Safe for production.

---

### 2. Shared Logic

#### [MODIFY] [revenue-streams.ts](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/lib/revenue-streams.ts)

**2a. Add 9 new entries to `STREAM_DEFAULTS`:**

Each new stream gets the same metadata structure: `label`, `icon`, `image`, `description`, `bullets`, default rates, `statusLabel`, plus a new flag.

**2b. Add an `isAlternative` flag** to the `STREAM_DEFAULTS` type:

```typescript
isAlternative?: boolean  // If true, stream does NOT add to portfolio total
```

The existing 4 streams remain `isAlternative: false` (or undefined — defaulting to false). All 9 new streams set `isAlternative: true`.

**2c. Add `ALTERNATIVE_STREAM_TYPES` constant** alongside the existing usage:

```typescript
export const CORE_STREAM_TYPES: StreamType[] = ['LOCKER', 'CAR_WASH', 'EV_CHARGING', 'FARMERS_MARKET']
export const ALT_STREAM_TYPES: StreamType[] = [
  'TESLA_DEMO', 'WE_BUY_ANY_CAR', 'GIANT_WASHING_MACHINE', 'DOG_GROOMING',
  'NHS_MRI_SCANNER', 'FILM_CREW_HOSTING', 'ELECTRIC_BIKE_BAY', 'WATERLESS_CAR_WASH', 'DIGITAL_SIGNAGE'
]
export const ALL_STREAM_TYPES: StreamType[] = [...CORE_STREAM_TYPES, ...ALT_STREAM_TYPES]
```

New defaults for each stream:

| Stream | Label | Default Rate | Pricing Mode | Description |
|--------|-------|-------------|-------------|-------------|
| `TESLA_DEMO` | "Tesla Demo Vehicles" | £50,000/yr flat | Flat | Host Tesla demo vehicles on-site for test drives |
| `WE_BUY_ANY_CAR` | "We Buy Any Car — Site Pod" | £15,000/yr flat | Flat | 10 dedicated car spaces for valuation pod |
| `GIANT_WASHING_MACHINE` | "Giant Washing Machines" | £1,500/yr flat | Flat | Revenue share commercial washing machines |
| `DOG_GROOMING` | "Dog Grooming Stations" | £5k–£10k range | Range | Self-service dog wash and grooming stations |
| `NHS_MRI_SCANNER` | "NHS Mobile MRI Scanner" | £7,500/yr flat | Flat | Mobile MRI scanner hosting, max 7 days/month |
| `FILM_CREW_HOSTING` | "Unit Base — Film Crew Hosting" | £5k–£50k range | Range | Production unit base hosting, depends on duration |
| `ELECTRIC_BIKE_BAY` | "Electric Bike Bays" | — | Text-only ("£5,000+ per bay per year") | E-bike docking bays, qty subject to survey |
| `WATERLESS_CAR_WASH` | "Waterless Car Wash" | £15k–£45k range | Range | Depending on footfall |
| `DIGITAL_SIGNAGE` | "Digital Signage" | £10k–£50k range | Range | Depending on footfall and location |

---

### 3. API Layer

#### [MODIFY] [streams/route.ts](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/app/api/reports/[id]/streams/route.ts)

Update the `VALID_STREAM_TYPES` array to include all 13 stream types (existing 4 + new 9).

---

### 4. Settings Page

#### [MODIFY] [settings/page.tsx](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/app/reports/[id]/settings/page.tsx)

**4a. Update `StreamType`, `STREAM_LABELS`, `STREAM_DEFAULTS`, and `ALL_STREAM_TYPES`** to include the 9 new values.

**4b. Add visual separation** in the settings UI between core streams and alternative streams:

```
Revenue Streams
Toggle ancillary revenue streams...

[Existing: Smart Lockers, Car Wash, EV, Farmers Markets]

─── Alternative Revenue Streams ───
These are displayed as informational options. They do not add to the portfolio total.

[Tesla Demo Vehicles ☑   £50,000/yr]
[We Buy Any Car     ☑   £15,000/yr]
[Waterless Car Wash ☐   £15,000 – £45,000]
[Digital Signage    ☐   £10,000 – £50,000]
... etc
```

Same toggle + rate editing + per-location exclusion grid pattern.

---

### 5. Public Report Rendering

#### [MODIFY] [PublicReportView.tsx](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/components/report/PublicReportView.tsx)

Split streams into two groups before passing to components:

```typescript
const coreStreams = streamSummaries.filter(s => !STREAM_DEFAULTS[s.streamType].isAlternative)
const altStreams = streamSummaries.filter(s => STREAM_DEFAULTS[s.streamType].isAlternative)
```

- Pass `coreStreams` to existing `<AncillaryServices>` and `<PublicRevenueSummary>` (unchanged behaviour — they still add to total)
- Pass `altStreams` to a new `<AlternativeRevenueStreams>` component rendered AFTER the summary table

#### [MODIFY] [PublicCommercial.tsx](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/components/report/public/PublicCommercial.tsx)

**5a. Add `getStreamEmoji()`** mappings for 9 new stream types.

**5b. Add new `AlternativeRevenueStreams` component** (exported from same file):

- Same card layout as `AncillaryServices` (image + bullets + pricing box)
- Section title: **"Alternative Revenue Streams"**
- Subtitle: *"Subject to survey — additional opportunities available across the portfolio"*
- Each card shows **"⚠️ Subject to Survey"** badge
- **NO total calculation** — pricing displayed per-site only, no portfolio total row
- If no alt streams are enabled, the section is hidden entirely

#### [MODIFY] [PublicRevenueSummary.tsx](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/components/report/public/PublicRevenueSummary.tsx)

**No change needed** — as long as `PublicReportView` only passes core streams to this component, the alternative streams won't affect the grand total. This is the key architectural decision that keeps them informational-only.

---

### 6. Images

#### Existing images in `public/` (confirmed):

| Stream | Image File | Status |
|--------|-----------|--------|
| Tesla Demo Vehicles | `/teslatestdrive.jpg` | ✅ Exists |
| We Buy Any Car | `/wbacstation.jpg` | ✅ Exists |
| Giant Washing Machines | `/washmachine.jpeg` | ✅ Exists |
| Dog Grooming Stations | `/dogwash.webp` | ✅ Exists |
| Digital Signage | `/signage.jpg` | ✅ Exists |

#### Images that need placeholders (user will supply real images later):

| Stream | Placeholder File | What's Needed |
|--------|-----------------|---------------|
| NHS Mobile MRI Scanner | `/nhs-mri-placeholder.webp` | Photo of a mobile MRI scanning unit in a car park |
| Unit Base — Film Crew Hosting | `/film-unit-base-placeholder.webp` | Photo of film production unit base / trailers in a parking area |
| Electric Bike Bays | `/electric-bike-bay-placeholder.webp` | Photo of e-bike docking/charging bays |
| Waterless Car Wash | `/waterless-carwash-placeholder.webp` | Photo of a waterless car wash service in action |

> [!IMPORTANT]
> **4 images needed from you:** NHS MRI Scanner, Film Crew Unit Base, Electric Bike Bays, Waterless Car Wash. AI-generated placeholders will be used until you provide real photos.

---

## Scope

- ✅ **Standard reports only** (`/share/[code]` public reports + `/reports/[id]/settings`)
- ❌ **NOT** bespoke proposals (Buzz Bingo, NSL, ParkBee) — no changes to those pages

---

## Files Changed Summary

| Action | File | Description |
|--------|------|-------------|
| **MODIFY** | `prisma/schema.prisma` | Add 9 values to `StreamType` enum |
| **MODIFY** | `src/lib/revenue-streams.ts` | Add 9 entries to `STREAM_DEFAULTS`, add `isAlternative` flag, add type constants |
| **MODIFY** | `src/app/api/reports/[id]/streams/route.ts` | Expand `VALID_STREAM_TYPES` to include 13 types |
| **MODIFY** | `src/app/reports/[id]/settings/page.tsx` | Add 9 new streams with visual separator between core and alternative |
| **MODIFY** | `src/components/report/PublicReportView.tsx` | Split streams into core vs alt, pass alt to new component |
| **MODIFY** | `src/components/report/public/PublicCommercial.tsx` | Add `AlternativeRevenueStreams` component + new emoji mappings |
| **NEW** | `public/*-placeholder.webp` (4 files) | AI-generated placeholder images for streams without photos |

---

## Verification Plan

### Build Test
```bash
cd /Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny && npx prisma migrate dev --name add-alt-revenue-streams && npm run build
```
Expect: migration applies, build exits with code 0.

### Browser Tests (Manual — Dev Server)

**Test 1: Settings Page — New streams appear**
1. `npm run dev` → navigate to any existing report's settings page
2. Scroll to "Revenue Streams" section
3. Verify the existing 4 core streams still appear at the top
4. Verify an "Alternative Revenue Streams" separator appears below
5. Verify all 9 new streams are listed with correct labels

**Test 2: Settings Page — Toggle and rates**
1. Enable "Tesla Demo Vehicles" — verify rate field shows £50,000
2. Enable "Waterless Car Wash" — verify min/max fields show £15,000 / £45,000
3. Enable "Dog Grooming" — verify text-only display (no editable rate)
4. Enable "Electric Bike Bays" — verify text-only display showing "£5,000+ per bay per year"
5. Save → reload → verify toggled state persists

**Test 3: Public Report — Alternative streams rendered**
1. Enable several alternative streams on a report
2. Open the share URL in incognito, enter password
3. Verify "Additional Portfolio Uplift" section shows only the 4 core streams (if enabled)
4. Verify a new "Alternative Revenue Streams" section appears AFTER the Portfolio Revenue Summary table
5. Verify each enabled alternative stream has a card with image, bullets, pricing, and "Subject to Survey" badge

**Test 4: Portfolio Summary — Alternatives NOT in total**
1. On the same shared report, check the dark "Portfolio Revenue Summary" table
2. Verify only the core 4 streams appear in the table rows
3. Verify the alternative streams do NOT appear in the table
4. Verify the "Total Revenue Opportunity" does NOT include alternative stream values

**Test 5: Edge case — All alternatives off**
1. Disable all 9 alternative streams in settings
2. View the shared report
3. Verify the "Alternative Revenue Streams" section is NOT rendered at all
