# 2. Chain vs Independent Bifurcation

[← Back to Index](./README.md)

---

## Why It Matters

Processing a local café through enterprise enrichment wastes API credits. Treating a branch manager like a sole trader leads to failed outreach. The entire resolution path depends on this classification.

> **User insight:** The dataset is believed to be **predominantly chains** rather than independents. This needs verification but has major implications — the chain path may need to be the primary/default path, not the exception.

> **Existing code:** `businessAnalyzer.ts` already contains a 4-tier chain classifier using keyword matching and known chain names. This can be extended rather than building from scratch.

| Signal | Independent SMB | National Chain / Franchise |
|--------|----------------|---------------------------|
| Location Count | Single entry or hyper-local cluster | Multiple branches across UK |
| Website | Local domain, standard contact page | "Store Locator" or "Find a Branch" |
| Domain Logic | Unique/local TLD | National domain with `/locations/` subfolders |
| Brand Profile | Localized SEO and reviews | Standardized corporate branding |

---

## The Three-Way Classification (Not Binary)

The real world isn't just "chain" vs "independent." There are three classifications, each requiring a different resolution path:

| Category | Description | Examples | Resolution Path |
|----------|-------------|----------|----------------|
| **Independent** | Single-site or sole trader business | Corner café, local B&B, independent gym | [Independent path](./03-independent-path.md) — owner is target |
| **Local Group** | 2-5 sites, same owner/company, no national brand | Restaurant group, local hotel collection | Independent path — owner still target, but deduplicate contacts |
| **National Chain** | 6+ UK sites, recognised brand, corporate structure | Travelodge, PureGym, Costa | [Chain path](./04-chain-path.md) — branch manager or location email is target |

### The Grey Zones

| Grey Zone | Looks Like | Actually Is | Best Treatment |
|-----------|-----------|-------------|---------------|
| **Franchise** | Chain (branded as Costa, McDonald's) | Independent (franchisee owns it) | Independent path — franchisee can make local deals |
| **Managed hotel** | Independent (unique brand) | Chain (managed by a hotel management company) | Independent path — GM has authority regardless |
| **Best Western / Choice Hotels** | Chain (branded) | Independent (individually owned, just using the brand) | Independent path — owner is decision-maker |
| **Co-working spaces** | Independent | Often chain (WeWork, Regus/IWG) | Chain path — branch manager |

---

## Detection Options

### Option A: Google Places `chains` Field

Add `places.chains` to field mask in `placesFetch.ts`. Returns chain ID + name for recognised chains.

✅ Authoritative, zero extra API calls
❌ New fetches only — won't classify existing 6,363 places
❌ Unknown UK coverage — may only cover major international brands

**Unknown:** Does Google's `chains` field recognise small UK regional chains (e.g., a 5-pub group)? Almost certainly not. This field is useful for "is it a Travelodge" but won't catch local groups.

**Action needed:** Test the `chains` field on a sample of UK places before relying on it. Also need a plan for **backfilling** existing records — the field only applies to new fetches.

### Option B: Website Domain Clustering

Group businesses by root domain. 2+ businesses with the same domain = likely chain or group.

✅ Works on existing data immediately
❌ **False positive risk is high**

**Known false positives to handle:**

| False Positive | Why | Mitigation |
|---------------|-----|------------|
| Booking.com / TripAdvisor | Used as "website" in Google listing | Maintain exclusion list of booking/review platforms |
| Wix / Squarespace / WordPress.com | Subdomain = shared domain | Extract subdomain, not root domain |
| Web agency hosting | Agency hosts 20 restaurants on one domain | Check if businesses are in same industry + geography |
| Property group websites | Landlord website, not tenant | Cross-reference Google Places business name vs domain content |
| Social media links | Facebook/Instagram used as website | Filter out known social media domains |

**Exclusion list needed:** ~50 platform domains to ignore (booking.com, tripadvisor.co.uk, facebook.com, instagram.com, wix.com, squarespace.com, wordpress.com, etc.)

### Option C: Known Chains Lookup Table

Curated list of UK chain names with fuzzy matching against Google Places `name` field.

✅ Immediate, 100% accurate for listed chains
❌ Manual maintenance — new chains, rebrands, closures
❌ Need fuzzy matching — "Premier Inn London Cricklewood" must match "Premier Inn"

**Table structure:**

| Field | Example |
|-------|---------|
| `chainName` | "Premier Inn" |
| `parentCompany` | "Whitbread" |
| `domain` | "premierinn.com" |
| `brands` | ["Premier Inn", "hub by Premier Inn"] |
| `procurementModel` | "regional" |
| `franchiseModel` | "corporate" |
| `estimatedUkSites` | 800 |
| `sector` | "hotel" |

**Size estimate:** ~200-300 entries to cover major UK chains across hospitality, retail, food, fitness, healthcare.

**Generation:** To be generated **programmatically** (e.g., scrape top UK chains by sector from public lists), not manually curated.

**Maintenance:** Review quarterly. Major chains rarely appear or disappear, but rebrands happen (e.g., "Beefeater" rebranding to "Bar + Block").

### Option D: Hybrid (A + B + C) — Recommended

Layer all three:
1. **Lookup table first** — instant classification for known chains
2. **Domain clustering second** — catches unknown chains + local groups
3. **Google `chains` field** — authoritative confirmation for new data

Result: `isChain: Boolean?` + `chainName: String?` + `classificationConfidence: "high" | "medium" | "low"` on Place model.

---

## Classification Confidence

Not all classifications will be certain. Use a confidence tier:

| Confidence | How Classified | Action |
|------------|---------------|--------|
| **High** | Lookup table match OR Google `chains` field present | Auto-route to chain/independent path |
| **Medium** | Domain clustering match (3+ sites on same domain) | Auto-route, but flag for review |
| **Low** | Domain clustering match (2 sites on same domain) OR name similarity | Manual review queue — user reviews via dashboard |
| **Unclassified** | No signals | Default to independent path |

---

## SIC Code Cross-Validation

If Companies House data is available (from later pipeline stages), SIC codes can validate the classification:

| SIC Code | Business Type | Expected Chains |
|----------|--------------|----------------|
| 55100 | Hotels | Premier Inn, Travelodge, Holiday Inn |
| 56101 | Licensed restaurants | Pizza Express, Nando's, Wagamama |
| 56302 | Public houses and bars | Wetherspoons, Slug & Lettuce |
| 93110 | Sports facilities | PureGym, The Gym, David Lloyd |
| 47110 | Non-specialised retail | Tesco, Sainsbury's, Asda |

This is a **validation layer**, not a detection layer — use it to confirm uncertain classifications.

---

## Deduplication Trigger

Domain clustering will also surface **duplicates** — the same business listed multiple times:
- "The Crown Hotel" and "Crown Hotel London NW2" — same place, different listings
- Two Google Place IDs for the same physical location

**Action:** Flag suspected duplicates for manual review. Don't auto-delete — one may have richer data than the other.

---

## Recommendation

**Option D (Hybrid)** — all three layers combined:

1. **Lookup table** for immediate classification of existing 6,363 places
2. **Domain clustering** to catch local groups and unknown chains
3. **Google `chains` field** added to field mask for all future fetches

**Schema:**
```prisma
model Place {
  isChain                  Boolean?   // null = not classified
  chainName                String?    // "Premier Inn", "PureGym", etc.
  chainId                  String?    // Google chain ID if available
  classificationConfidence String?    // "high", "medium", "low"
  classificationMethod     String?    // "lookup_table", "domain_cluster", "google_chains", "manual"
  localGroupId             String?    // Groups local multi-site owners together
}
```
