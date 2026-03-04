# Unified Revenue Streams + Interactive Summary — Implementation Plan

> Merge all 13 revenue streams into a single section everywhere and add interactive tick boxes in the public report so the viewer can choose which streams appear in the Portfolio Revenue Summary.

---

## What Changes From The Previous Version

| Aspect | Before (just shipped) | After (this plan) |
|--------|----------------------|-------------------|
| **Settings page** | Two sections: "Revenue Streams" (4 core) + "Alternative Revenue Streams" (9 new) | **One section** — all 13 in a single "Revenue Streams" list |
| **Public report** | Two sections: `AncillaryServices` (core) + `AlternativeRevenueStreams` (alt) | **One section** — "Additional Portfolio Uplift" shows all enabled streams |
| **Portfolio Revenue Summary** | Always shows all core streams in the total | **Default**: shows only Portfolio Baseline + Local Offers Uplift. Streams only appear when the **viewer ticks them** in the report |
| **Interactivity** | None — fully server-rendered | **Tick box per stream card** — viewer can add/remove streams from the summary. Client-side state (no DB storage) |

---

## Architecture Challenge

`PublicReportView` is currently a **server component** (async function, no `"use client"`). The interactive tick-box feature requires **client-side state** (`useState`) to:

1. Track which streams are "included" in the summary
2. Re-render the summary table whenever a stream is toggled

**Solution**: Create a new `InteractiveStreamSection` **client component** that:
- Receives all stream data as props (server-fetched, serialised)
- Manages `includedStreams: Set<StreamType>` in local state (starts empty)
- Renders both the stream cards AND the summary table
- When a viewer ticks a stream, it is added to the set and the summary table updates
- State is ephemeral — resets on page reload (no DB persistence needed)

---

## Proposed Changes

### 1. Settings Page

#### [MODIFY] [settings/page.tsx](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/app/reports/[id]/settings/page.tsx)

Remove the `ALT_STREAM_TYPES` / `CORE_STREAM_TYPES` split. Render **all streams in one list** under a single "Revenue Streams" heading:

```diff
- <h2>Revenue Streams</h2>
- {streams.filter(core).map(renderStreamCard)}
- <hr />
- <h2>Alternative Revenue Streams</h2>
- {streams.filter(alt).map(renderStreamCard)}
+ <h2>Revenue Streams</h2>
+ {streams.map(renderStreamCard)}
```

One flat list, all 13 streams. No separator needed.

---

### 2. Public Report — Server Component

#### [MODIFY] [PublicReportView.tsx](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/components/report/PublicReportView.tsx)

Remove the `coreStreams` / `altStreams` split. Pass **all** stream summaries to a single new client component:

```diff
- <AncillaryServices streams={coreStreams} ... />
- <PublicRevenueSummary streams={coreStreams} ... />
- <AlternativeRevenueStreams streams={altStreams} ... />
+ <InteractiveStreamSection
+   streams={streamSummaries}
+   locationCount={locationCount}
+   totalCurrentRevenue={totalCurrentRevenue}
+   upliftValue={upliftValue}
+   growthPercent={computedGrowthPercent}
+   formatCurrency={formatCurrency}    // can't pass functions to client — will inline
+ />
```

> [!IMPORTANT]
> Since `formatCurrency` is a function, it **cannot be serialised** as a prop to a client component. The client component will need its own inline currency formatter.

---

### 3. New Interactive Client Component

#### [NEW] [InteractiveStreamSection.tsx](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/components/report/public/InteractiveStreamSection.tsx)

This is the core of the feature. A `"use client"` component that:

**State**:
```typescript
const [includedStreams, setIncludedStreams] = useState<Set<string>>(new Set())
```

**Rendering**:

1. **"Additional Portfolio Uplift" card** — renders ALL enabled streams as cards (same look as current `AncillaryServices`), with a **tick box** on each card:
   ```
   ☐ Include in Revenue Summary
   ```
   When ticked → stream type added to `includedStreams` set. The tick box label changes:
   ```
   ☑ Included in Revenue Summary ✓
   ```

2. **"Portfolio Revenue Summary" dark table** — always rendered, showing:
   - **Always**: Portfolio Baseline + Local Offers Uplift + Total
   - **Conditionally**: Each stream that the viewer has ticked. Its revenue is added to the grand total.
   - If nothing is ticked: Total = Baseline + Local Offers Uplift only
   - If a text-only stream is ticked (e.g. Electric Bike Bays "£5,000+ per bay"): shown in the table row but **not** added to the numeric total (since it has no calculable value)

**Visual Design**:
- Each stream card gets a small checkbox at the bottom-right of the pricing box
- When checked, the card gets a subtle green left border or glow
- The summary table smoothly updates (CSS transition on the total row)

---

### 4. Cleanup Existing Components

#### [MODIFY] [PublicCommercial.tsx](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/components/report/public/PublicCommercial.tsx)

- **Delete** the `AlternativeRevenueStreams` component (no longer needed)
- Keep `AncillaryServices` as a potential fallback, or delete if fully replaced by `InteractiveStreamSection`
- Keep `CommercialOffer` and `CommercialTerms` (unchanged)

#### [DELETE or KEEP] [PublicRevenueSummary.tsx](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/components/report/public/PublicRevenueSummary.tsx)

The summary table rendering moves into `InteractiveStreamSection` (since it needs to react to tick state). This file can either be deleted or its JSX extracted into a sub-function within the new component.

---

### 5. Lib — Remove `isAlternative` Distinction

#### [MODIFY] [revenue-streams.ts](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/lib/revenue-streams.ts)

The `isAlternative` flag on `STREAM_DEFAULTS` is no longer needed for the core/alt split. However, we can repurpose it or remove it entirely. The `StreamRevenueSummary.isAlternative` field can also be dropped since ALL streams are treated equally now.

---

## Files Changed Summary

| Action | File | Description |
|--------|------|-------------|
| **MODIFY** | `src/app/reports/[id]/settings/page.tsx` | Remove core/alt split — single flat stream list |
| **MODIFY** | `src/components/report/PublicReportView.tsx` | Pass all streams to `InteractiveStreamSection` |
| **NEW** | `src/components/report/public/InteractiveStreamSection.tsx` | Client component: stream cards + tick boxes + dynamic summary table |
| **MODIFY** | `src/components/report/public/PublicCommercial.tsx` | Remove `AlternativeRevenueStreams` export |
| **MODIFY or DELETE** | `src/components/report/public/PublicRevenueSummary.tsx` | Summary table logic moves into `InteractiveStreamSection` |
| **MODIFY** | `src/lib/revenue-streams.ts` | Remove `isAlternative` flag (optional cleanup) |

---

## Questions

1. **Tick state persistence**: When the viewer refreshes the page, should the ticked streams reset (purely ephemeral) or persist somehow? Options:
   - **Ephemeral** (simplest): resets on reload, purely client-side `useState`
   - **URL params**: encode ticked streams in the URL hash (e.g. `#streams=LOCKER,TESLA_DEMO`)  — shareable, persists across refreshes
   - **LocalStorage**: persists per-browser but not shareable

2. **Default state**: Should ANY streams be pre-ticked by default? E.g. should the original 4 (Smart Lockers, Car Wash, EV, Farmers) start ticked since they were previously always in the total? Or should everything start un-ticked?

3. **Tick box placement**: Should the "Include in Revenue Summary" checkbox be:
   - Inside the stream card (next to the pricing box)
   - A small toggle at the top-right corner of the card
   - A separate column/button outside the card

---

## Verification Plan

### Build Test
```bash
cd /Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny && npm run build
```

### Manual Verification (after deployment)

**Test 1: Settings page — single stream list**
1. Go to `https://app.parkbunnyreports.com/reports/cmmbxghyi0001l704eu4br1g7/settings`
2. Scroll to "Revenue Streams" — verify ALL 13 streams are in one list (no "Alternative Revenue Streams" separator)
3. Toggle some streams on/off, save

**Test 2: Public report — unified stream cards**
1. Open the shared report URL in incognito
2. Scroll to "Additional Portfolio Uplift"
3. Verify all enabled streams appear in one section
4. Each stream card should have a tick box

**Test 3: Interactive tick box**
1. Tick "Tesla Demo Vehicles" checkbox
2. Scroll down to "Portfolio Revenue Summary" table
3. Verify "Tesla Demo Vehicles" now appears as a row with £50,000
4. Verify the total increases by £50,000
5. Un-tick it — verify it disappears from the table and total decreases

**Test 4: Default state**
1. Reload the page
2. Verify the Portfolio Revenue Summary shows only Baseline + Local Offers Uplift + Total (no streams ticked)
3. Verify Total = Baseline + Uplift only
