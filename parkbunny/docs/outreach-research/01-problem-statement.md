# 1. The Spatial-to-Identity Gap

[← Back to Index](./README.md)

---

Google Places provides high-fidelity spatial data but intentionally obscures decision-maker identity. A map pin is an anonymous signal — the objective is to resolve it into a verified person.

## What We Have Today (~10,115 places)

> **Note:** The original research cited 6,363 places, but the dashboard shows **10,115 total businesses** across all locations. Some may be archived. The exact count of active, unique places needs verification via database query.

| Field | Coverage | Source |
|-------|----------|--------|
| Name, address, lat/lng, types | 100% | Google Places |
| Rating + review count | ~95% | Google Places |
| Website | 87.3% | Google Places |
| Phone | 87.6% | Google Places |
| Email | 4.8% | Outscraper only |
| Contact names | 0% | Not enriched |
| Chain classification | 0% | Not classified |

**Empty enrichment fields:** `contactPeople`, `allEmails`, `allPhones`, `businessDetails`, `siteData`, `socialLinks`

## The Core Challenge

We know **where** every business is. We don't know **who** runs it, **what legal entity** it operates under, or **how to contact** the decision-maker.

The entire pipeline exists to close this gap — resolving a coordinate into a verified decision-maker with a deliverable email address.

### Key Context from Codebase

- **Auto-fetch:** Google Places data is fetched automatically when a report is created (via `refreshReportLocations` in `placesFetch.ts`)
- **Search radius:** Default 0.75 miles (~1.2km) — configurable per report via `settings.radiusMiles`
- **Field mask:** 11 fields currently fetched (`displayName`, `types`, `formattedAddress`, `location`, `rating`, `userRatingCount`, `priceLevel`, `websiteUri`, `nationalPhoneNumber`, `businessStatus`, `googleMapsUri`, `parkingOptions`). **No `chains` field yet.**
- **Existing chain detection:** `businessAnalyzer.ts` already has a 4-tier chain classifier (INDEPENDENT / REGIONAL_CHAIN / NATIONAL_CHAIN / INTERNATIONAL_CHAIN) using keyword matching and known chain lists
- **Data accumulation:** Places are accumulated over time as reports are created — not a single batch fetch. Some places may be months old.

---

## Data Quality Concerns

The raw numbers above overstate our usable data. Key quality issues:

### Dead / Parked Websites
No manual website audit has been run yet. The 87.3% coverage is based on Google-provided URLs, which include dead, parked, and redirect URLs. The true "scrapeable website" coverage is likely **significantly lower**. We need to quantify this before budgeting scraping credits.

### Disconnected / Wrong Phone Numbers
Phone numbers in Google Places can be stale — especially for businesses that have changed tenant, rebranded, or closed and reopened under new management. Some may route to previous businesses. No validation has been done.

### Permanently Closed Businesses
Google Places includes listings for businesses that are permanently closed or "temporarily closed" for months. These are wasted enrichment effort. Google provides a `businessStatus` field — we should filter for `OPERATIONAL` only.

### Duplicates
The same business can appear twice with slightly different names or addresses (e.g., "The Crown Hotel" and "Crown Hotel London"). Domain clustering may surface these, but no deduplication has been run.

### Invalid Existing Emails
The 4.8% with email from Outscraper were **never verified** and some are known to have bounced. Outscraper was a one-off integration that failed — treat all existing enrichment data as unreliable. The new pipeline will start fresh.

---

## Not All 6,363 Are Prospects

The Google Places data includes **everything** near our car parks. Many are irrelevant:

| Non-Prospect Type | Examples | Action |
|-------------------|----------|--------|
| Public institutions | Churches, schools, libraries, parks | Skip — no parking partnership potential |
| Government | Council offices, HMRC, courts | Skip — impossible procurement |
| Sub-businesses | Café inside a Tesco, ATM at a petrol station | Skip — no independent decision-maker |
| Micro-businesses | Market stalls, mobile therapists | Skip — too small |
| Infrastructure | Bus stops, parking meters, postboxes | Skip — not businesses |
| Seasonal / pop-up | Christmas shops, festival vendors | Skip — temporary |

**Research needed:** A breakdown of the ~10,115 by Google `types` field to determine how many are actually viable prospects. Estimated viable: maybe **60-70%** (~6,000-7,000).

---

## Geographic Context

### Per-Report vs Global Pipeline

The 6,363 places are tied to specific reports/locations (car parks). The pipeline must work **per-report** — only businesses near a specific car park are relevant for that car park's outreach.

This means:
- Enrichment should be triggered per-report, not globally
- Distance from car park is a critical scoring signal
- A business 2 miles away is less relevant than one 200 metres away
- Different car parks may have overlapping business catchments (same business appears in multiple reports)

### Density Variation

A London car park might have 500+ nearby businesses. A rural car park might have 20. The pipeline must handle both extremes.

### Overlapping Catchments

Multiple car parks in the same area may share businesses in their catchments. Deduplication across reports is essential to avoid double-enriching and double-contacting.

---

## Why Current Enrichment Failed

Outscraper was used as the initial enrichment source. Understanding WHY it produced mostly empty results is important:

**Possible reasons:**
- Outscraper relies on Google's visible data — if Google doesn't show an email, Outscraper can't find one
- No website scraping was performed (Outscraper reads Google data, not the business's own website)
- No Companies House or registry lookup was attempted
- No people-search tools (Apollo, LinkedIn) were queried
- The enrichment was passive (read what's publicly listed) rather than active (search multiple sources)

**Implication:** The new pipeline must be **multi-source and active** — not just reading Google data, but actively querying Companies House, scraping websites, and searching people databases. All previous Outscraper data should be considered unreliable.

---

## Data Freshness

| Question | Impact |
|----------|--------|
| When were the 6,363 places fetched? | Old data = more closed businesses, stale contacts |
| How often do we re-fetch? | Monthly? Per-report? On-demand? |
| What's the acceptable staleness? | >6 months = high risk of wasted effort |
| Do we re-enrich previously enriched places? | If a contact bounced, re-enrich. If identity resolved, skip. |

**Recommendation:** Define a freshness window (e.g., 90 days). Re-fetch Google Places data and re-run enrichment for anything older than this.
