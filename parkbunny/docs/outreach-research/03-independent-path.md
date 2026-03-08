# 3. The Independent Path: Forensic Identity Resolution

[← Back to Index](./README.md)

---

For UK SMBs, the **owner is the pivot point**. Trading names frequently differ from legal entities (e.g., "The Blue Anchor" vs. "Maritime Hospitality Ltd").

## Execution Order: Waterfall Resolution

The layers below are **not** parallel options — they're a waterfall. Execute in order, **stop when identity is resolved** (verified name + deliverable email):

```
START: Google Places data (name, website, phone, address)
  │
  ▼
Layer 1: Website scrape + LLM extraction ──→ Found name + email? → RESOLVED ✅
  │ (cheapest — Firecrawl credit + LLM call)
  ▼
Layer 1b: Social media check ──→ Found owner name? → Continue to L2 with name
  │ (only if L1 found no owner name; check Facebook/Instagram/Google review responses)
  ▼
Layer 2: Companies House lookup ──→ Found active director? → PARTIALLY RESOLVED
  │ (free, but needs email still)
  ▼
Layer 3: Apollo people search ──→ Found person with email? → RESOLVED ✅
  │ (free search, paid enrichment)
  ▼
Layer 4: info@ email construction ──→ Email validates? → FALLBACK CONTACT ⚠️
  │ (near-zero cost — just verification API)
  ▼
Layer 5: VAT trace ──→ Found legal entity? → Retry Layer 2 with company number
  │ (last resort)
  ▼
UNRESOLVED → Flag for manual review or skip
```

**Key principle:** We only spend Apollo credits (Layer 3) if free layers fail. And we only bother with VAT tracing (Layer 5) if everything else fails.

> **User decision:** Try to find an email from the website FIRST, then look up director/person. Website email is cheapest and often reaches the owner directly.

---

## Layer 1: Website Scraping & AI Extraction

Forensic scrape of "About Us," "Meet the Team," and "Contact" pages. Use LLMs to extract "Founder," "Director," or "Owner" names.

**Input:** Website URL (87.3% coverage, but true scrapeable % is lower — see [doc 01](./01-problem-statement.md))
**Output:** Decision-maker name, role, sometimes email, company number, VAT number

### Pages to Scrape (Priority Order)

1. `/about`, `/about-us`, `/our-story` — most likely to have owner name
2. `/contact`, `/contact-us` — often has email + sometimes names
3. `/team`, `/meet-the-team`, `/our-team` — direct staff listings
4. Footer (all pages) — company number, VAT number, registered address
5. Homepage — sometimes has "Founded by..." or "Run by..." text

### Website Scraping Failure Modes

| Failure Mode | How Common | Mitigation |
|-------------|-----------|------------|
| **Single-page brochure** — no About/Team pages | ~20-30% of SMB sites | Scrape homepage + footer only; may still find company number |
| **Contact form only** — no visible email | ~40% of sites | Fall through to Layer 3 (Apollo) or Layer 4 (info@ construction) |
| **Obfuscated emails** — JavaScript-rendered or image-based | ~10% | Firecrawl handles JS; images need OCR (skip for v1) |
| **Login/paywall** — content behind authentication | ~2% | Skip — not worth the effort |
| **Non-English content** — especially in diverse areas | ~3-5% | LLM extraction handles multilingual; specify "extract regardless of language" |
| **Heavily templated** — Wix/Squarespace with default "About" text | ~15% | LLM may extract noise; lower confidence if text looks generic |
| **Site down / 404 / timeout** | ~5-10% | Mark as failed, fall through to Layer 2 |
| **Booking platform as website** — booking.com URL in Google listing | ~5% | Skip scrape — no useful identity data on booking platforms |

### LLM Extraction Confidence

Not all extractions are reliable. Include a confidence indicator:

| Extraction | High Confidence | Low Confidence |
|-----------|----------------|----------------|
| Company number | Follows exact pattern: "12345678" near "Registered in England" | Random 8-digit number elsewhere on page |
| Owner name | Explicitly labelled "Founder", "Owner", "Director" | Name appears on page without role context |
| Email | Associated with owner name or on Contact page | Generic address like "sales@" or "reception@" |
| VAT number | Follows "GB" + 9-digit pattern near "VAT" | Similar number pattern without VAT context |

---

## Layer 2: Companies House API & Physical Address Pivot

Query [Companies House API](https://developer.company-information.service.gov.uk/) (free) using data from Google Places and/or Layer 1 scraping.

**API capabilities:**
- `GET /search/companies?q={postcode}` — find companies registered near a postcode
- `GET /company/{number}` — full company details
- `GET /company/{number}/officers` — directors list with appointment dates
- `GET /company/{number}/registered-office-address` — registered address

> **✅ API key available.** User confirmed they have a Companies House API key ready to add to `.env`.

**⚠️ The Accountant Address Problem (see [Edge Cases](./07-edge-cases.md))**

### Match Resolution: Picking the Right Company

When Companies House returns multiple results for a name or address search, we need a scoring algorithm:

| Signal | Score | Rationale |
|--------|-------|-----------|
| Company number matches website footer | +100 | Guaranteed correct |
| Company name contains Google Places name | +40 | Strong signal |
| SIC code matches Google Places `types` | +30 | Industry confirmation |
| Registered address matches Google address | +25 | Location match |
| Director's service address matches Google address | +20 | Director works there |
| Company status = ACTIVE | +10 | Dissolved = wrong entity |
| Incorporation date is recent (since 2020) | -5 | May be a successor company, not the current one |
| Company name is very generic (e.g., "London Holdings Ltd") | -10 | Common name, low confidence |

**Threshold:** Only accept match if score ≥ 50. Below that → flag for manual review.

### Multi-Director Resolution

Companies House often returns 2-5 directors for a single company. Who do we contact?

| Priority | Director Type | Rationale |
|----------|-------------|-----------|
| 1st | **Person with "managing" in role** | Managing Director = day-to-day authority |
| 2nd | **Person whose service address = business address** | Physically present at the business |
| 3rd | **Longest-serving active director** | Most invested, likely founder/owner |
| 4th | **Any active director** | Better than nothing |
| Skip | **Secretary** | Usually accountant, not decision-maker |
| Skip | **Resigned directors** | No longer involved |
| Skip | **Corporate directors** | Company acting as director — no person to contact |

---

## Layer 3: Apollo.io People Search

**Apollo API workflow:**
1. `POST /api/v1/organizations/enrich` with website domain → get company profile, employee count, LinkedIn URL, industry
2. `POST /api/v1/mixed_people/api_search` with company domain + titles (`owner`, `director`, `manager`, `founder`) → get partial profiles (**free, no credits**)
3. `POST /api/v1/people/bulk_match` with returned IDs → get full contact details (**costs credits**)

**Apollo for independents:** Search by company domain, filter for `seniority: owner, founder, director`. Often returns the actual owner with email.

### Apollo Failure Modes for SMBs

| Failure Mode | How Common | Mitigation |
|-----------|-----------|------------|
| **No results** — company too small for Apollo's database | ~40-50% of SMBs | Fall through to Layer 4 |
| **Wrong person** — Apollo returns an employee who left | ~10% | Cross-reference with Companies House director data |
| **No email** — person found but email suppressed | ~15% | Construct email from name + domain pattern |
| **Wrong company** — domain matches a different entity | ~5% | Validate company name against Google Places name |

---

## Layer 4: info@ / Generic Email Fallback

For independents, `info@businessdomain.co.uk` often routes **directly to the owner**. This is a viable first-contact channel:

| Business Type | info@ Likely Reaches | Viable? |
|--------------|---------------------|---------|
| Independent hotel/B&B | Owner or front desk manager | ✅ Yes |
| Independent restaurant/pub | Owner or general manager | ✅ Yes |
| Independent gym | Owner | ✅ Yes |
| Local clinic/dentist | Practice manager | ✅ Yes |
| Chain branch | HQ customer service | ❌ No — useless |

**Construction logic:** Try these in order, validate each with email verification API:
1. `info@{domain}`
2. `hello@{domain}`
3. `contact@{domain}`
4. `enquiries@{domain}`
5. `enquiry@{domain}`
6. `bookings@{domain}` (for hotels/restaurants)
7. `reception@{domain}` (for hotels/clinics)

**Rule:** Only use generic emails for **confirmed independents**. For chains, only use if we can verify it's a location-specific email (rare).

---

## Layer 5: VAT Footprint Tracing

Scrape website footer for VAT number → [Vatsense API](https://vatsense.com/) → resolve to legal entity + directors.

**When to use:** Only when Layers 1-4 all fail AND a VAT number was found on the website.

> **User note:** Worth testing as a fallback — if Companies House reg number is missing, the VAT number from the website footer should resolve to the legal entity.

---

## Layer 6: Social Media as Identity Source

Not in the original pipeline, but social media is a rich source of owner identity:

| Platform | What to Find | How to Find It |
|----------|-------------|----------------|
| **Facebook** | Business page → "About" section often lists owner name | Scrape or search by business name |
| **Instagram** | Bio sometimes says "Owner: @personname" | Search by business name or domain |
| **LinkedIn** | Company page → employees list → filter by seniority | Apollo covers this, but direct LinkedIn search is backup |
| **Google Reviews** | Owner responses to reviews sometimes signed with name | Already have review data from Google Places |

**When to use:** If website scraping found no owner name, check social links before falling through to Companies House. Many micro-businesses have active social media but basic websites.

> **User decision:** Nice to have for later. Some Instagram/Facebook pages do include emails — worth investigating but not v1 priority.

---

## Convergence & Conflict Resolution

When multiple layers return data, conflicts can occur:

| Conflict | Resolution |
|----------|-----------|
| Website says "Jane Smith, Owner" but Companies House lists "John Smith, Director" | Prefer Companies House — legally authoritative. Jane may be a spouse, manager, or the website is outdated |
| Apollo returns a person not found on website or Companies House | Lower confidence — may be a former employee. Verify before outreach |
| Website has 2 different people listed as "owner" on different pages | Prefer the most recent page (check copyright date) or the one with a direct email |
| Companies House shows company dissolved but website is live | The business may have re-incorporated under a new entity. Search for new companies at same address |
| info@ email validates but no person name found | Use as fallback contact — address email to "The Owner" or "The Manager" |

### Enrichment Status Tracking

Each Place should track what we found and how confident we are:

| Field | Purpose |
|-------|---------|
| `identityResolved` | Boolean — have we found a decision-maker? |
| `resolvedMethod` | Which layer resolved it: "website_scrape", "companies_house", "apollo", "info_email", "manual" |
| `resolvedConfidence` | "high", "medium", "low" |
| `resolvedAt` | Timestamp — for freshness tracking |
| `decisionMakerName` | The person's name |
| `decisionMakerRole` | Their role/title |
| `decisionMakerEmail` | Verified email |
| `decisionMakerPhone` | If found |
| `failedLayers` | JSON array of which layers were attempted and failed — informs re-enrichment |

---

## Convergence Pipeline (Sequential Waterfall)

> This matches the execution order at the top of this document. Each step only runs if the previous one didn't fully resolve identity.

```
Google Places Pin (name, address, website, phone)
  │
  ├─ [L1] Website scrape → owner name, role, email, company #, VAT #
  │   └─ [L1b] Social media check (if no name found on website)
  │   Did L1 resolve identity (name + email)? → STOP ✅
  │
  ├─ [L2] Companies House (by company # or address/name) → legal entity, directors
  │   └─ Multi-director resolution → pick managing director or longest-serving
  │   Did L1+L2 produce name + email? → STOP ✅
  │
  ├─ [L3] Apollo (by domain) → verified email + phone for owner/director
  │   Did L3 produce verified email? → STOP ✅
  │
  ├─ [L4] info@domain / generic email construction
  │   └─ Validate with ZeroBounce → if valid, use as fallback contact ⚠️
  │
  ├─ [L5] VAT trace → legal entity → retry L2 with company number
  │
  ├─ Conflict resolution (if multiple layers returned conflicting data)
  │
  = Verified Decision-Maker + Contact Details + Confidence Score
    OR: UNRESOLVED → flag for manual review
```
