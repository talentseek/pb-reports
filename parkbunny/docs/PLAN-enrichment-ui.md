# PLAN: Enrichment UI Integration

Integrate the Spatial-to-Identity enrichment pipeline into the existing report page. Enrichment is triggered per-sector and only enriches **included** businesses. Results are persisted to the database and displayed seamlessly within the existing business card UI.

---

## Proposed Changes

### Database Layer

#### [MODIFY] [schema.prisma](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/prisma/schema.prisma)

No schema changes needed — `EnrichmentResult` model already exists with all fields:
- `placeId`, `reportId`, `ownerName`, `ownerRole`, `ownerEmail`, `ownerPhone`, `ownerLinkedIn`
- `companiesHouseNumber`, `companyName`, `chainClassification`, `chainName`
- `emailVerified`, `overallConfidence`, `dataSources`, `status`
- Relation: `Place.enrichmentResults` and `Report.enrichmentResults`

> [!NOTE]
> The existing `EnrichmentResult` model is scoped per `placeId + reportId` (unique constraint). This means a place can have different enrichment results in different reports, which is correct for our per-report enrichment flow.

---

### API Layer

#### [NEW] [enrich/route.ts](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/app/api/reports/[id]/enrich/route.ts)

**POST endpoint** to trigger enrichment for a specific sector.

**Request body:**
```json
{
  "category": "Shopping (Retail)",
  "postcode": "NW2 3DU"  // optional, filters to specific location
}
```

**Flow:**
1. Auth check (Clerk)
2. Query `ReportLocationPlace` for this report + category where `included = true`
3. Filter out already-enriched places (have `EnrichmentResult` with `status != 'pending'`)
4. Return count of businesses to enrich (for confirmation UI)
5. When `confirm: true` in body, run pipeline on each business
6. Stream progress via SSE (Server-Sent Events) — each business completion sends an update

**Response (SSE stream):**
```
data: {"type":"start","total":5}
data: {"type":"progress","current":1,"placeId":"xxx","name":"B&Q","status":"resolved","ownerName":"John Smith"}
data: {"type":"progress","current":2,"placeId":"yyy","name":"Lidl","status":"failed"}
data: {"type":"complete","resolved":3,"partial":1,"failed":1}
```

**POST with `dryRun: true`** returns a preview:
```json
{
  "toEnrich": 5,
  "alreadyEnriched": 2,
  "businesses": [
    {"id": "xxx", "name": "B&Q", "enriched": false},
    {"id": "yyy", "name": "Lidl", "enriched": true}
  ]
}
```

---

#### [MODIFY] [placesByCategory/route.ts](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/app/api/reports/[id]/placesByCategory/route.ts)

Update GET handler to include enrichment data in the response:

```diff
 const places = links.map((link) => ({
   id: link.placeId,
   name: link.place.name,
   // ... existing fields ...
+  enrichment: link.place.enrichmentResults?.[0] ? {
+    ownerName: ...,
+    ownerRole: ...,
+    ownerEmail: ...,
+    status: ...,
+    confidence: ...,
+  } : null,
 }))
```

---

#### [MODIFY] [export/route.ts](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/app/api/reports/[id]/export/route.ts)

Add enrichment data to the export JSON:

```diff
 businesses: loc.places.map((link) => ({
   // ... existing fields ...
+  enrichment: enrichmentMap.get(link.placeId) || null,
 })),
```

---

### UI Components

#### [MODIFY] [CategoryPlacesDrawer.tsx](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/components/report/CategoryPlacesDrawer.tsx)

This is the main UI change. Add to the existing drawer:

**1. Enrich button in header** (next to "Close"):
- Shows count: "Enrich 5 businesses" (only included + not-yet-enriched)
- Confirmation step with credit warning
- Disabled if all included businesses already enriched

**2. Progress indicator** during enrichment:
- Progress bar: "Enriching 3/5..."
- Each card updates in real-time as its enrichment completes

**3. Enrichment data on each card** — expanding the existing card:
```
B&Q Cricklewood
Unit 1, Broadway Retail Park, London NW2 1ES, UK
Postcode: NW2 3DU
Rating: 3.9 | Price: 2
☑ Include | Website | 020 8438 3200

── Enrichment ──────────────────────────
👤 John Smith (Store Manager)
📧 john.smith@diy.com ✅ verified
🏢 B&Q plc (national_chain)
Confidence: high | Sources: apollo, website
```

**4. Enrichment status badge** per card:
- 🟢 `resolved` — name + email found
- 🟡 `partial` — name or email (not both)
- 🔴 `failed` — nothing found
- ⚪ Not enriched yet

#### [MODIFY] [Place type](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/components/report/CategoryPlacesDrawer.tsx)

Extend the `Place` type to include enrichment:
```typescript
type Place = {
  // ... existing fields ...
  enrichment?: {
    ownerName: string | null
    ownerRole: string | null
    ownerEmail: string | null
    ownerPhone: string | null
    ownerLinkedIn: string | null
    companyName: string | null
    chainClassification: string | null
    emailVerified: boolean
    overallConfidence: string | null
    dataSources: string[]
    status: string
  } | null
}
```

---

### Pipeline Integration

#### [MODIFY] [pipeline.ts](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/lib/enrichment/pipeline.ts)

Add a `saveResult` function that persists `PipelineResult` → `EnrichmentResult` in Prisma after each business is enriched. Currently the pipeline returns results in memory — we need to upsert to the database.

```typescript
async function saveEnrichmentResult(
  result: PipelineResult,
  reportId: string
): Promise<void> {
  await prisma.enrichmentResult.upsert({
    where: { placeId_reportId: { placeId: result.placeId, reportId } },
    create: { /* map PipelineResult fields */ },
    update: { /* map PipelineResult fields */ },
  })
}
```

---

## Summary of Changes

| File | Change | Size |
|------|--------|------|
| `enrich/route.ts` | **NEW** — SSE endpoint for sector enrichment | ~120 lines |
| `CategoryPlacesDrawer.tsx` | Enrich button, progress, enrichment display on cards | ~80 lines added |
| `placesByCategory/route.ts` | Include enrichment data in GET response | ~10 lines |
| `export/route.ts` | Include enrichment data in export JSON | ~15 lines |
| `pipeline.ts` | Add `saveEnrichmentResult` function | ~30 lines |

---

## Verification Plan

### Automated
- Build check: `npx tsc --noEmit` — no TypeScript errors
- Existing API routes still work after modifications

### Manual (Browser)
1. Navigate to a report: `https://app.parkbunnyreports.com/reports/[id]`
2. Click on a sector tile (e.g., "Shopping (Retail)")
3. Verify drawer opens with existing business cards
4. Click "Enrich N businesses" button
5. Verify confirmation dialog shows count and credit usage
6. Confirm and watch real-time progress updates
7. Verify enrichment data appears on each card after completion
8. Close drawer, reopen — verify enrichment data persists
9. Click "Export JSON" — verify enrichment data included in download
10. Toggle a business to not-included, re-enrich — verify it's skipped
