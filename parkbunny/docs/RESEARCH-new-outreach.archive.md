# New Outreach — Research & Strategy

> The core problem: Google Places gives us **where** a business is, but not **who** runs it. Resolving a map pin into a verified decision-maker is the pipeline challenge.

---

## The Spatial-to-Identity Gap

Google Places provides high-fidelity spatial data but intentionally obscures decision-maker identity. A map pin is an anonymous signal — the objective is to resolve it into a verified person.

**What we have today (6,363 places):**

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

---

## 1. Chain vs Independent Bifurcation

### Why It Matters

Processing a local café through enterprise enrichment wastes API credits. Treating a branch manager like a sole trader leads to failed outreach. The entire resolution path depends on this classification.

| Signal | Independent SMB | National Chain / Franchise |
|--------|----------------|---------------------------|
| Location Count | Single entry or hyper-local cluster | Multiple branches across UK |
| Website | Local domain, standard contact page | "Store Locator" or "Find a Branch" |
| Domain Logic | Unique/local TLD | National domain with `/locations/` subfolders |
| Brand Profile | Localized SEO and reviews | Standardized corporate branding |

### Detection Options

#### Option A: Google Places `chains` Field
Add `places.chains` to field mask in `placesFetch.ts`. Returns chain ID + name.
✅ Authoritative, zero extra API calls | ❌ New fetches only | 📊 Low effort

#### Option B: Website Domain Clustering
Group by root domain — 2+ businesses with same domain = chain.
✅ Works on existing data | ❌ Booking platform false positives | 📊 Medium effort

#### Option C: Known Chains Lookup Table
Curated ~200 UK chain names with fuzzy matching.
✅ Immediate, 100% for listed | ❌ Manual maintenance | 📊 Medium effort

#### Option D: Hybrid (A + B + C)
All combined → `isChain: Boolean` + `chainName: String?` on Place model.
📊 Medium-High effort, highest accuracy

**Recommendation:** A (new fetches) + C (existing data).

---

## 2. The Independent Path: Forensic Identity Resolution

For UK SMBs, the **owner is the pivot point**. Trading names frequently differ from legal entities (e.g., "The Blue Anchor" vs. "Maritime Hospitality Ltd").

### Layer 1: Website Scraping & AI Extraction

Forensic scrape of "About Us," "Meet the Team," and "Contact" pages. Use LLMs to extract "Founder," "Director," or "Owner" names.

**Input:** Website URL (87.3% coverage)
**Output:** Decision-maker name, role, sometimes email

### Layer 2: Companies House API & Physical Address Pivot

Query [Companies House API](https://developer.company-information.service.gov.uk/) (free, no cost) using the Google Places address.

**API capabilities:**
- `GET /search/companies?q={postcode}` — find companies registered near a postcode
- `GET /company/{number}` — full company details
- `GET /company/{number}/officers` — directors list with appointment dates
- `GET /company/{number}/registered-office-address` — registered address

**⚠️ The Accountant Address Problem (see Edge Cases §8)**

### Layer 3: info@ / Generic Email Fallback

For independents, `info@businessdomain.co.uk` often routes **directly to the owner**. This is a viable first-contact channel:

| Business Type | info@ Likely Reaches | Viable? |
|--------------|---------------------|---------|
| Independent hotel/B&B | Owner or front desk manager | ✅ Yes |
| Independent restaurant/pub | Owner or general manager | ✅ Yes |
| Independent gym | Owner | ✅ Yes |
| Local clinic/dentist | Practice manager | ✅ Yes |
| Chain branch | HQ customer service | ❌ No — useless |

**Construction logic:** Try `info@{domain}`, `contact@{domain}`, `hello@{domain}`, `enquiries@{domain}`. Validate with email verification API before sending.

**Rule:** Only use generic emails for **confirmed independents**. For chains, only use if we can verify it's a location-specific email (rare).

### Layer 4: VAT Footprint Tracing

Scrape website footer for VAT number → [Vatsense API](https://vatsense.com/) → resolve to legal entity + directors.

### Layer 5: Apollo.io People Search

We have Apollo. Use it as an enrichment layer:

**Apollo API workflow:**
1. `POST /api/v1/organizations/enrich` with website domain → get company profile, employee count, LinkedIn URL, industry
2. `POST /api/v1/mixed_people/api_search` with company domain + titles (`owner`, `director`, `manager`, `founder`) → get partial profiles (free, no credits)
3. `POST /api/v1/people/bulk_match` with returned IDs → get full contact details (costs credits)

**Apollo for independents:** Search by company domain, filter for `seniority: owner, founder, director`. Often returns the actual owner with email.

### Convergence Pipeline

```
Google Places Pin (name, address, website, phone)
  │
  ├─ Website scrape → owner name, role, email
  ├─ Companies House (by address/name) → legal entity, directors
  ├─ info@domain → cheap first-contact attempt
  ├─ VAT trace → fallback legal identity
  └─ Apollo (by domain) → verified email + phone
  │
  = Verified Decision-Maker + Contact Details
```

---

## 3. The Chain Path: Location-Bound Targeting

**Targeting C-suite at HQ is a strategic failure.** The Branch/General Manager is the prospect for localized parking deals. But resolving a specific branch employee from a national organisation is significantly harder than finding an independent owner.

### The Core Problem

We know "Travelodge Cricklewood" exists at NW2 3ED. We need to find the **specific person** who manages **that specific branch** and can say yes to a local parking partnership. This is fundamentally different from finding the owner of an independent café.

### Apollo.io Workflow: Manager-as-Prospect

Using Apollo's API:

1. **Company lookup:** `POST /organizations/enrich` with chain's domain (e.g., `travelodge.co.uk`)
2. **People search:** `POST /mixed_people/api_search` with:
   - Company domain: `travelodge.co.uk`
   - Titles: `branch manager, store manager, general manager, area manager`
   - Location: UK (city filter where possible)
3. **Enrich matched people:** `POST /people/bulk_match` → verified emails + phones

### 🏙️ The London Density Problem

**This is the hardest edge case.** In dense urban areas like London, a single chain can have 20-50+ branches within a few miles. Apollo's location filter is **city-level, not postcode-level**.

**Example:** Search Apollo for "Travelodge" + "General Manager" + "London" → returns 30+ results. Which one is at the Cricklewood branch?

#### Resolution Strategies for Dense Areas

| Strategy | How | Reliability |
|----------|-----|-------------|
| **LinkedIn location cross-ref** | Check LinkedIn profile for specific branch mention in headline/experience | Medium — many just say "London" |
| **Chain website branch page** | Scrape the specific branch page for manager name (some chains list them) | High when available |
| **Google Maps reviews** | Manager sometimes responds to reviews with their name | Low — inconsistent |
| **Phone-first approach** | Call the branch, ask for the manager's name + email, then send a follow-up email | High — but labour-intensive |
| **Email pattern + branch name** | Some chains use `firstname.lastname@chain.co.uk` — if we find the name, construct the email | Medium — depends on chain |
| **Skip & deprioritise** | If a chain has 30+ London branches and no branch-specific matching is possible, skip and focus on independents | N/A — pragmatic triage |

**Key insight:** The London density problem may mean that **chains in dense urban areas are simply not worth the enrichment cost** compared to independents. A single independent hotel owner in Cricklewood is more actionable than all 30+ Travelodge managers combined.

### 🎯 The Title Hierarchy Problem

Not all chains have "Branch Managers." The decision-making title varies wildly:

| Chain Type | Decision-Maker Title | Authority Level |
|-----------|---------------------|-----------------|
| Hotel chain | General Manager, Hotel Manager | ✅ Can approve local deals |
| Gym chain | Club Manager, General Manager | ✅ Can approve |
| Supermarket | Store Manager | ⚠️ Limited — often needs regional sign-off |
| Fast food | Restaurant Manager, Shift Manager | ⚠️ Very limited authority |
| Bank branch | Branch Manager | ❌ No authority — all central procurement |
| Retail chain | Store Manager | ⚠️ Depends on chain |

**The "Goldilocks" title problem:**
- **Too senior** (Regional Director) → covers 50+ sites, too busy, unlikely to engage
- **Too junior** (Shift Supervisor) → no authority to approve anything
- **Just right** (General Manager / Branch Manager) → knows the branch, has local budget authority

**Apollo search strategy:** Search for MULTIPLE titles simultaneously, then rank by seniority. Prefer the most local, mid-level manager.

### 🔄 Area/Regional Manager Structures

**Problem:** Many chains don't have a dedicated manager at every single location. Instead, an **Area Manager** covers 5-15 branches.

**Impact:** If we find "Sarah Jones — Area Manager, North West London, Travelodge" on Apollo, she's a great prospect — she can approve parking deals for ALL branches in her area, not just one.

**But:** We might accidentally email her 5 times (once for each location we find in her area).

**Resolution:**
- Deduplicate by person, not by branch
- If an area manager is identified, associate them with ALL branches in their area
- Send ONE outreach email covering all branches, not separate ones

### 👻 LinkedIn-Dark Employees

**Problem:** Many branch-level employees in hospitality, retail, and food service do **not** have LinkedIn profiles. Apollo finds nothing.

**Prevalence by sector:**

| Sector | LinkedIn Presence (Branch Level) | Apollo Success Rate |
|--------|--------------------------------|-------------------|
| Hotels | Medium — GMs often have LinkedIn | ~40-50% |
| Gyms | Medium — managers use LinkedIn for networking | ~30-40% |
| Restaurants/Pubs | Low — especially independent chains | ~10-20% |
| Supermarkets | Low — turnover too high | ~10% |
| Fast food | Very low | ~5% |
| Banks/Insurance | High — professional services | ~60-70% |
| Medical/Dental | Medium | ~40% |

**Fallback for LinkedIn-dark sectors:** Phone-first approach. Call the branch number from Google Places, ask for the manager's name and email. This is a human task, not an AI one (compliance).

### 🔀 Multi-Brand Parent Companies

**Problem:** Large hospitality groups own multiple brands:

| Parent Company | Brands |
|---------------|--------|
| Whitbread | Premier Inn, Beefeater, Brewers Fayre, Table Table |
| Mitchells & Butlers | Toby Carvery, Harvester, Miller & Carter, All Bar One |
| IHG | Holiday Inn, Crowne Plaza, InterContinental |
| Stonegate Group | Slug & Lettuce, Yates, Craft Union |
| JD Wetherspoon | Wetherspoons (single brand but 800+ locations) |

**Impact:**
- An Area Manager at Whitbread might cover both Premier Inns and Beefeaters in the same area
- Searching Apollo by "Premier Inn" domain might miss the manager if their LinkedIn says "Whitbread"
- The branch website domain might differ from the parent company domain

**Resolution:** Maintain a mapping of parent company → brands. Search Apollo for BOTH the brand domain and parent domain.

### 🏪 Franchise vs Corporate-Owned Branches

**Problem:** The same chain can have a mix of corporate-owned and franchised branches:

| Chain | Model |
|-------|-------|
| McDonald's | ~85% franchised in UK |
| Subway | ~100% franchised |
| Costa | Mix (some licensed, some corporate) |
| Premier Inn | ~100% corporate-owned |
| Holiday Inn | Mix of franchise and corporate |

**Why it matters:**
- **Franchised branch:** The franchisee IS the decision-maker — treat like an independent
- **Corporate branch:** The branch manager has limited authority — need area/regional manager

**Detection:** This is extremely hard to detect programmatically. Clues:
- Different company name on Companies House at that address
- Website says "This [Chain] is independently owned and operated"
- Google reviews mentioning "the owner" (suggests franchise)

### 🔒 Central Procurement Blockers

**Problem:** Some chains route ALL vendor relationships through a central procurement team. The branch manager literally cannot approve a parking deal — even if they want to.

**High-risk sectors:**
- Banks (all procurement centralised)
- Supermarkets (major chains all centralised)
- National retail chains (Next, Primark, H&M)
- Government/NHS buildings

**Low-risk sectors (branch has autonomy):**
- Independent hotel groups (2-5 locations)
- Franchise restaurants
- Independent gym chains
- Small hospitality groups

**Resolution:** Classify chains by procurement model before investing enrichment effort:

| Procurement Model | Action | Example |
|-------------------|--------|---------|
| **Branch autonomous** | Target branch manager | Independent hotel group |
| **Regional approval needed** | Target area/regional manager | Travelodge, PureGym |
| **Central procurement only** | Target procurement team at HQ | Tesco, Sainsbury's |
| **Skip entirely** | Not worth the effort | Banks, NHS, Government |

### 📧 Chain Email Architecture

Different chains have very different email patterns:

| Pattern | Example | How to exploit |
|---------|---------|---------------|
| `firstname.lastname@chain.co.uk` | `john.smith@travelodge.co.uk` | If we find the name, construct the email |
| `branch@chain.co.uk` | `cricklewood@travelodge.co.uk` | Scrape from branch page — goes to local team |
| `role@chain.co.uk` | `gm.cricklewood@travelodge.co.uk` | Rare but very valuable |
| `generic@chain.co.uk` | `info@travelodge.co.uk` | ❌ Goes to HQ — useless |
| No email visible | — | Phone-first only |

**Discovery approach:**
1. Check the branch-specific page on the chain's website for any contact email
2. Check the Google Maps listing for branch-specific email
3. If person's name is known, try common email patterns (`first.last@`, `f.last@`, `firstlast@`)
4. Validate with email verification tool before sending

### � Location-Specific Brand Emails — The High-Value Shortcut

Many chains operate **location-specific email addresses** that route directly to the branch team or local manager. These are extremely valuable because they bypass the entire people-finding problem — you don't need to identify a specific person, the email goes to whoever manages that branch.

**Common patterns:**

| Pattern | Real-World Examples | Prevalence |
|---------|-------------------|------------|
| `{area}@chain.co.uk` | `wandsworth@puregym.com`, `cricklewood@premierinn.com` | Common in hotels, gyms |
| `{postcode}@chain.co.uk` | `nw2@snapfitness.com` | Rare but exists |
| `{branch-name}@chain.co.uk` | `victoria-station@travelodge.co.uk` | Common in hotels |
| `{city}.{branch}@chain.co.uk` | `london.cricklewood@chain.co.uk` | Seen in food chains |
| `manager.{location}@chain.co.uk` | `manager.wandsworth@gym.co.uk` | Rare — very high value |
| `gm@{branch}.chain.co.uk` | `gm@cricklewood.holiday-inn.co.uk` | Subdomain pattern |

**Where to find them:**
1. **Branch-specific web page** — many chain websites have a `/locations/{branch}` page with a unique contact email
2. **Google Maps listing** — the Google Places API sometimes returns a branch-specific email in the raw data
3. **Google Maps "Suggest an edit"** — community-contributed emails are often branch-specific
4. **Branch-level social media** — some chains have location-specific Facebook/Instagram pages with email in bio
5. **Outscraper** — enrichment sometimes captures these from Google's extended listing data

**Why this matters:** A `wandsworth@puregym.com` email reaches the **club manager directly**. No need for Apollo, no LinkedIn scraping, no phone calls. It's the most efficient chain outreach channel.

**Automated discovery strategy:**
1. For each chain branch, construct candidate emails: `{area}@domain`, `{postcode}@domain`, `{branch-name}@domain`
2. Run through email verification API (e.g., Prospeo, ZeroBounce) — if it validates, it exists
3. Send outreach to validated location emails
4. Track open/response rates per pattern to learn which chains use which format

**Limitations:**
- Not all chains use this pattern — some have HQ-only email with no branch routing
- The email might go to a shared inbox that nobody checks regularly
- Some location emails forward to a regional call centre, not the branch itself
- Email pattern may change if the chain rebrands or restructures

### �📊 Chain Path Decision Matrix

Given all these edge cases, here's when to invest effort in the chain path:

| Scenario | Invest Effort? | Reason |
|----------|---------------|--------|
| Independent hotel group (2-5 locations) | ✅ YES | Branch GM has authority, findable on LinkedIn |
| Franchise restaurant/gym | ✅ YES | Franchisee = decision-maker, treat as independent |
| Mid-size chain, outer suburbs | ✅ YES | Less density = easier to match manager to branch |
| Chain with location-specific emails | ✅ YES | Direct branch email = no people-finding needed |
| Large chain, dense London | ⚠️ MAYBE | High effort, low match accuracy |
| Major supermarket/retail | ❌ NO | Central procurement, branch has no authority |
| Bank/financial services | ❌ NO | Central procurement, compliance barriers |
| NHS/Government | ❌ NO | Procurement frameworks, long sales cycles |

### info@ Rule for Chains

Generic `info@chain.co.uk` goes to HQ customer service — worthless.

**But `{location}@chain.co.uk` is gold.** Always check for location-specific emails before skipping a chain. The discovery cost is near-zero (email verification API call) and the reward is a direct line to the branch.

### Recommended Chain Path Flow

```
Chain detected
  │
  ├─ Is it a franchise? ─── YES ──→ Treat as INDEPENDENT path
  │
  ├─ Central procurement? ── YES ──→ SKIP (or target procurement team)
  │
  ├─ Dense urban area?
  │   ├─ YES → Scrape branch page for name/email → Phone fallback
  │   └─ NO  → Apollo people search (title + city filter)
  │
  ├─ Apollo found manager?
  │   ├─ YES → Enrich → Outreach
  │   └─ NO  → Check branch page → Phone the branch → Skip
  │
  └─ Deduplicate by person (area managers cover multiple branches)
```

---

## 4. Waterfall Enrichment Pipeline

Sequential querying — don't rely on a single source:

| Step | Service | Purpose | Key Metric |
|------|---------|---------|------------|
| 1 | **Apollo.io** | People + email (already available) | Domain-based people search, title filtering |
| 2 | **Prospeo** (optional) | Email accuracy boost | 98% accuracy, 7-day refresh |
| 3 | **Cognism** (optional) | Mobile + compliance | Diamond Data, auto-scrubbed TPS/CTPS |
| 4 | **Email Validation** | Deliverability | Catch-all handling, spam-trap removal |

### Enrichment Outputs Per Lead

- ✅ Verified work email (>98% accuracy)
- ✅ Direct/mobile number (CTPS-scrubbed) — if using Cognism
- ✅ LinkedIn profile URL
- ✅ Seniority & department level

---

## 5. UK Compliance — CRITICAL

### ⚠️ AI Voice Agent Compliance Risk

| Method | Corporate (Ltd, LLP) | Individual (Sole Trader) |
|--------|---------------------|--------------------------|
| **Cold Email** | ✅ Allowed (opt-out required) | ❌ Prior consent required |
| **Live Calls** | ✅ Allowed (screen TPS/CTPS) | ✅ Allowed (screen TPS) |
| **Automated / AI Voice** | ❌ **CONSENT REQUIRED** | ❌ **CONSENT REQUIRED** |

> **£500,000 fine or 4% of global turnover** for AI voice agents without prior consent.

### Implications for Sarah

- **Option 1:** Inbound only — businesses call us after email
- **Option 2:** Warm follow-up only — after email establishes consent
- **Option 3:** Email-first outreach, Sarah for callback scheduling
- **Option 4:** Legal review — does real-time conversational AI qualify as "automated" under PECR?

### GDPR Requirements

- Documented Legitimate Interest Assessment (LIA) on file
- Clear opt-out in all communications
- Data minimisation

---

## 6. Delivery & Hyper-Personalisation

### Email Delivery
- **Smartlead** or **Instantly** for domain rotation and warm-up
- Gradual volume scaling to avoid UK ISP spam filters

### Hyper-Personalisation Layer
Use Google Maps data for authenticity:
- Reference review count and rating in opening line
- Mention specific business type context (e.g., "parking for your hotel guests")

**Example:**
> "Hi [Name], I noticed The Crown Hotel has 5,205 reviews and a 4.2 rating — impressive for Cricklewood. We've just taken over the car park at [carpark_name] nearby and have a budget to offer your guests and staff discounted parking..."

---

## 7. Spatial-to-Identity Tech Stack — Deep Dive

### The Pipeline Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    SPATIAL-TO-IDENTITY PIPELINE                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STAGE 1: INGEST              STAGE 2: CLASSIFY                  │
│  ┌──────────────┐            ┌──────────────────┐                │
│  │ Google Places │───────────│ Chain Bifurcation │                │
│  │    API        │            │ (Hybrid A+C)     │                │
│  └──────────────┘            └────────┬─────────┘                │
│                                       │                          │
│                          ┌────────────┴────────────┐             │
│                          ▼                         ▼             │
│                   INDEPENDENT                   CHAIN            │
│                                                                  │
│  STAGE 3a: RESOLVE (Independent)  STAGE 3b: RESOLVE (Chain)     │
│  ┌──────────────┐                 ┌──────────────────┐           │
│  │ Firecrawl    │                 │ Apollo People    │           │
│  │ (website     │                 │ Search (by title │           │
│  │  scrape)     │                 │  + domain)       │           │
│  └──────┬───────┘                 └────────┬─────────┘           │
│         ▼                                  │                     │
│  ┌──────────────┐                 ┌────────┴─────────┐           │
│  │ LLM Extract  │                 │ Location-Specific│           │
│  │ (owner name, │                 │ Email Discovery  │           │
│  │  company #,  │                 │ ({area}@chain)   │           │
│  │  VAT, email) │                 └────────┬─────────┘           │
│  └──────┬───────┘                          │                     │
│         ▼                                  │                     │
│  ┌──────────────┐                          │                     │
│  │ Companies    │                          │                     │
│  │ House API    │                          │                     │
│  │ (directors)  │                          │                     │
│  └──────┬───────┘                          │                     │
│         │                                  │                     │
│  STAGE 4: ENRICH                           │                     │
│  ┌──────────────┐                          │                     │
│  │ Apollo.io    │◄─────────────────────────┘                     │
│  │ (email +     │                                                │
│  │  phone)      │                                                │
│  └──────┬───────┘                                                │
│         ▼                                                        │
│  ┌──────────────┐                                                │
│  │ Email        │                                                │
│  │ Verification │                                                │
│  │ (ZeroBounce) │                                                │
│  └──────┬───────┘                                                │
│         ▼                                                        │
│  ┌──────────────┐                                                │
│  │ ParkBunny DB │  Place model updated with enriched data        │
│  │ (Prisma)     │                                                │
│  └──────────────┘                                                │
└──────────────────────────────────────────────────────────────────┘
```

---

### Tool 1: Google Places API (Already In Use)

**Purpose:** Spatial data ingestion — the starting point of everything.

| Detail | Value |
|--------|-------|
| Status | ✅ In production |
| What we get | Name, address, lat/lng, types, rating, review count, website, phone |
| What we need to add | `places.chains` field to field mask |
| Cost | Already paying — part of existing Google Cloud billing |
| Code location | `src/lib/placesFetch.ts` |

**Action required:** Add `places.chains` to the field mask. One-line change.

---

### Tool 2: Chain Detection (To Build In-House)

**Purpose:** Classify every Place as `independent` or `chain`.

**Components:**

| Component | Implementation | Storage |
|-----------|---------------|---------|
| Google `chains` field | Field mask update in `placesFetch.ts` | New `chainId` and `chainName` fields on Place model |
| Known Chains Lookup Table | Static JSON file or DB table | ~200 entries, curated manually |
| Domain Clustering | Script that groups businesses by root domain | Computed — tag businesses with same domain |

**Schema change needed:**
```prisma
model Place {
  // ... existing fields
  isChain       Boolean?   // null = not classified yet
  chainName     String?    // "Travelodge", "PureGym", etc.
  chainId       String?    // Google chain ID if available
}
```

**Cost:** Free (in-house logic)

---

### Tool 3: Firecrawl (Website Scraping)

**Purpose:** Scrape business websites and extract structured data (owner name, company number, VAT, emails) using LLM.

| Detail | Value |
|--------|-------|
| What it does | Scrapes any URL → returns clean Markdown (no nav, no ads, no cookie banners) |
| Why Firecrawl | Returns LLM-ready Markdown, handles JS-rendered sites, built-in proxy rotation |
| Free tier | 500 credits/month (500 pages) |
| Hobby plan | $16/mo for 3,000 credits |
| Standard plan | $83/mo for 100,000 credits |
| Rate limit | Depends on plan — free tier is slower |
| Alternative | Cheerio (free, open-source, but no JS rendering or proxy) |

**Pipeline step:**
1. Firecrawl scrapes `/about`, `/contact`, `/team`, and footer of business website
2. Returns Markdown text
3. Pass Markdown to LLM (GPT-4o-mini) with extraction prompt
4. LLM returns structured JSON: `{ ownerName, role, email, companyNumber, vatNumber }`

**LLM extraction prompt (draft):**
```
Extract the following from this business website content:
- Owner/Director/Founder name and role
- Any email addresses (especially owner/manager emails)
- Company registration number (usually "Registered in England: XXXXXXXX")
- VAT number (usually "VAT: GB XXXXXXXXX")

Return as JSON. If a field is not found, return null.
```

**Cost estimate for 6,363 places:**
- Firecrawl: ~6,363 credits = Hobby plan ($16/mo) for 2 months, or Standard ($83/mo) for 1 month
- LLM extraction: ~6,363 × GPT-4o-mini call ≈ $2-5 total (very cheap)

**Where output goes:**
- `siteData` field (raw scraped content)
- `contactPeople` field (extracted owner/director details)
- `businessDetails` field (company number, VAT, etc.)

---

### Tool 4: Companies House API (Free)

**Purpose:** Resolve trading name → legal entity → directors.

| Detail | Value |
|--------|-------|
| Cost | **Completely free** |
| Registration | [developer.company-information.service.gov.uk](https://developer.company-information.service.gov.uk/) |
| Auth | API key via HTTP Basic Auth |
| Rate limit | **600 requests per 5 minutes** (7,200/hour) |
| IP limit | 2,000 requests per 5 minutes |

**Key endpoints:**

| Endpoint | Purpose | Input |
|----------|---------|-------|
| `GET /search/companies?q={query}` | Find companies by name or postcode | Trading name or postcode |
| `GET /company/{number}` | Full company details | Company number (from website scrape) |
| `GET /company/{number}/officers` | Directors list | Company number |
| `GET /company/{number}/registered-office-address` | Registered address | Company number |
| `GET /search/officers?q={name}` | Find directors by name | Person name |

**Resolution strategy (ordered by reliability):**

```
1. Website scrape found company number? ──→ Direct lookup (100% match)
   │
2. No? Search by trading name ──→ Cross-validate against address
   │
3. No match? Search by postcode ──→ Score by name similarity
   │
4. No match? Search by director name (from website scrape) ──→ Find their companies
   │
5. Still nothing? ──→ Sole trader or foreign entity. Skip Companies House.
```

**Cost estimate:** Free. 6,363 lookups at 600/5min = ~53 minutes to process entire database.

**Important 2025 change:** Companies House now requires identity verification for directors. This means director data will be more reliable and verified going forward.

---

### Tool 5: Apollo.io (Already Available)

**Purpose:** People search (find decision-makers by company + title) and email/phone enrichment.

| Detail | Value |
|--------|-------|
| Status | ✅ Account exists |
| Free tier | 10,000 people search records/month, 5 mobile numbers, 10 export credits |
| Basic plan | $49/mo — 60,000 records, 150 mobile credits |

**Key API endpoints:**

| Endpoint | Purpose | Credits |
|----------|---------|---------|
| `POST /organizations/enrich` | Company data by domain | 1 credit |
| `POST /mixed_people/api_search` | Find people by company + title | **Free** (returns partial data) |
| `POST /people/bulk_match` | Get full contact details | 1 credit per person |
| `POST /people/match` | Single person enrichment | 1 credit |

**Critical insight:** The `mixed_people/api_search` endpoint is **free** — no credits consumed. It returns names, titles, and company info. Only the `bulk_match` step (to get emails/phones) costs credits. This means we can search broadly for free, then selectively enrich only the best matches.

**Usage in pipeline:**

For independents:
- Input: website domain → find owner/director by title
- Titles to search: `owner, founder, director, managing director, proprietor`

For chains:
- Input: chain domain + location → find branch manager
- Titles to search: `general manager, branch manager, store manager, hotel manager, club manager`

**Cost estimate:** Depends on how many people we enrich. If we enrich 1,000 contacts: ~1,000 credits on Basic plan.

---

### Tool 6: Email Verification (ZeroBounce or Reacher)

**Purpose:** Validate discovered/constructed emails before sending outreach.

| Service | Free Tier | Paid | Best For |
|---------|-----------|------|----------|
| **ZeroBounce** | 100/month | $18 per 2,000 ($0.009/email) | Accuracy, GDPR-compliant |
| **Reacher** | 50/month | €69/mo for 10,000 | Open-source, self-hostable |
| **Prospeo** | 75/month | $39/mo starter | Bundled with email finding |

**What we need to verify:**
1. Discovered emails (from website scraping, Apollo)
2. Constructed emails (info@, contact@, {location}@chain.co.uk)
3. Pattern-guessed emails (first.last@company.co.uk)

**Cost estimate:** ~6,363 base verifications + constructed variants = maybe 10,000 total.
- ZeroBounce: $18 for 2,000 → ~$90 for 10,000
- Reacher: €69/mo for 10,000 (one month)

**Recommendation:** ZeroBounce pay-as-you-go — cheapest for a one-time batch.

---

### Tool 7: Vatsense API (Optional — Fallback)

**Purpose:** Resolve VAT number → legal entity when Companies House fails.

| Detail | Value |
|--------|-------|
| Free tier | 100 lookups/month |
| Cost | From €0.01/lookup |
| When to use | Only when website shows VAT number but Companies House lookup failed |

**Likely usage:** Very low volume. Most businesses that display VAT numbers also display company numbers. This is a last-resort fallback.

---

### Tool 8: LLM for Extraction (GPT-4o-mini via existing OpenAI key)

**Purpose:** Extract structured data from scraped website Markdown.

| Detail | Value |
|--------|-------|
| Model | GPT-4o-mini (fast, cheap, good enough for extraction) |
| Cost | ~$0.15 per 1M input tokens, $0.60 per 1M output tokens |
| Per website | ~2,000 tokens input, ~200 tokens output = ~$0.0004 per site |
| Total for 6,363 | **~$2.50** |

**What the LLM extracts:**
- Owner/Director name + role
- Email addresses
- Company registration number
- VAT number
- Social media links
- Key business details (employee count, founding date)

---

### Total Cost Estimate (Spatial-to-Identity Only)

| Tool | One-Time Cost | Monthly Ongoing |
|------|-------------|-----------------|
| Google Places (chains field) | $0 (already paying) | $0 |
| Chain lookup table | $0 (in-house) | $0 |
| Firecrawl (6,363 scrapes) | $83 (one month Standard) | $16/mo for new reports |
| Companies House API | **Free** | **Free** |
| Apollo.io (people search) | $0-49 (depends on tier) | $49/mo Basic |
| LLM extraction | ~$2.50 | ~$0.50 per new report |
| Email verification | ~$90 (10,000 batch) | ~$20 per new report |
| Vatsense (optional) | ~$5 | $0 |

**Total first run: ~$180-230**
**Ongoing per new report: ~$85-100/mo** (Firecrawl + Apollo + verification)

---

### What We Already Have vs What We Need

| Component | Have It? | Action |
|-----------|---------|--------|
| Google Places API | ✅ Yes | Add `chains` to field mask |
| OpenAI API key | ✅ Yes | Use for LLM extraction |
| Apollo.io account | ✅ Yes | Integrate API |
| PostgreSQL + Prisma | ✅ Yes | Add new fields to Place model |
| Firecrawl | ❌ No | Sign up (free tier to start) |
| Companies House API key | ❌ No | Register at developer.company-information.service.gov.uk |
| ZeroBounce account | ❌ No | Sign up (100 free/month to test) |
| Chain lookup table | ❌ No | Curate manually (~200 UK chains) |
| Pipeline orchestration | ❌ No | Build processing queue/script |

### Prisma Schema Changes Needed

```prisma
model Place {
  // Existing fields...

  // Chain classification
  isChain           Boolean?
  chainName         String?
  chainId           String?

  // Companies House resolution
  companyNumber     String?
  companyName       String?   // Legal name (may differ from trading name)
  companyStatus     String?   // ACTIVE, DISSOLVED, etc.
  sicCodes          String?   // JSON array of SIC codes
  incorporationDate DateTime?
  directors         Json?     // Array of { name, role, appointedDate }

  // Enrichment metadata
  identityResolved  Boolean   @default(false)
  resolvedAt        DateTime?
  resolvedMethod    String?   // "website_scrape", "companies_house", "apollo", "manual"
}
```

---

## 8. Implementation Brainstorm

### Context
ParkBunny has 6,363 places, Apollo.io available, no Clay. Need to build the Spatial-to-Identity pipeline. Total estimated cost for first run: ~$180-230.

---

### Option A: Build In-House Pipeline (Full Stack)

Build bifurcation, Companies House, website scraping (Firecrawl), Apollo enrichment, and email construction as ParkBunny app features.

✅ Full control, reusable for all reports, tightly integrated
❌ 4-6 weeks engineering, must maintain scrapers and rate limiters
📊 **Effort:** High

---

### Option B: Apollo-Centric with Minimal In-House

ParkBunny only handles chain detection. Pass everything to Apollo for enrichment.

✅ Fast (1-2 weeks), leverages existing subscription
❌ Weak UK SMB coverage, no Companies House data, Apollo-dependent
📊 **Effort:** Low-Medium

---

### Option C: Hybrid — ParkBunny (Classify + Scrape + Companies House) + Apollo (People)

ParkBunny handles: chain classification, Firecrawl website scraping, LLM extraction, Companies House lookups, info@ email construction.
Apollo handles: people search by domain + title, email/phone enrichment.

✅ Best accuracy, free Companies House data, Apollo for people only
❌ More engineering than B, two-stage data flow
📊 **Effort:** Medium

---

## 💡 Recommendation

**Option C (Hybrid)** — ParkBunny owns the UK-specific intelligence (chain detection, Companies House, website scraping). Apollo handles people-finding.

**Priority order:**
1. Chain detection (lookup table — immediate, free)
2. Firecrawl + LLM extraction (website scraping — ~$85)
3. Companies House API integration (free)
4. Apollo people enrichment (existing account)
5. Email construction + ZeroBounce verification (~$90)
6. Pipeline orchestration (queue system for batch processing)

---

## 9. Edge Cases & Failure Modes

*(Moved from previous section 8 — see sections 3 and 8 for chain-specific edge cases)*

### 🏢 The Accountant Address Problem

~30-40% of UK SMBs register at accountant/solicitor offices. Companies House address lookup returns zero. Resolution: website scrape for company number first, then name search with address cross-validation.

### 🔀 Trading Name ≠ Legal Name

"The Blue Anchor" on Google ≠ "Maritime Hospitality Ltd" on Companies House. Website scraping for company registration number is the most reliable bridge.

### 🏪 Franchises — The Grey Zone

McDonald's in Cricklewood = franchisee "NW London Food Holdings Ltd." Treat as independent for outreach.

### 🏨 Multi-Company Structures

Hotels often have 3+ companies at same address (operating, property, events). Match SIC codes to Google Places types.

### 📞 National vs Local Numbers

0800/0330/0333/0345 = national lines. Scrape branch page for direct number.

### 👻 Dissolved Companies Still Trading

Search for recently incorporated companies at same address or with same director names.

### 🏗️ Multi-Site Independent Groups

Local group with 2-5 locations on same domain. Treat as independent, contact owner once.

### 🏠 Residential Addresses

Sole traders at home — no Companies House presence. Fall back to website + Apollo.

### 📧 info@ Email Traps

May go to marketing agency. Track open rates — if no opens after 2 sends, escalate to phone.

### 📱 CTPS/TPS Edge Cases

Always screen before calling. If blocked, pivot to email only.

### 🌐 Businesses Without Websites (~13%)

Fall back to Companies House name search → Apollo by name + location → skip.

---

## 10. Identified Gaps & Research Backlog

### Gap 1: The Actual Outreach Message ⚠️ P1

All research so far focuses on *finding* people but nothing on *what to say*. The Sarah voice prompt exists but no email copy has been written.

**Needs research:**
- Email template per business type (hotel vs gym vs restaurant)
- Subject line testing strategies
- Value proposition framing — "discounted parking for your staff/guests" vs "revenue share" vs "partnership"
- How much to reveal in first touch vs follow-up
- Tone: corporate vs friendly vs ultra-casual

---

### Gap 2: Sequencing & Cadence ⚠️ P1

No multi-touch sequence designed. How many touchpoints? What order?

**Example cadence to evaluate:**
```
Day 1:  Email #1 (intro + value prop)
Day 3:  Email #2 (follow-up, different angle)
Day 7:  LinkedIn connect request (if person identified)
Day 10: Email #3 (case study / social proof)
Day 14: Phone call (human, not AI — unless consent given)
Day 21: Final email (break-up / last chance)
```

**Needs research:**
- Optimal number of touches before giving up
- Channel mix (email only? email + LinkedIn? email + phone?)
- Timing between touches
- When to escalate from email to phone
- Behaviour-triggered actions (e.g., if they open email, send follow-up faster)

---

### Gap 3: Scoring & Prioritisation ⚠️ P0

Which of 6,363 businesses should we contact *first*? No scoring model exists.

**Potential scoring signals:**

| Signal | Weight | Rationale |
|--------|--------|-----------|
| Business type | High | Hotels, gyms = high parking demand |
| Rating + review count | Medium | Popular = more footfall = more parking need |
| Distance from car park | High | Closer = more relevant |
| Has phone number | Medium | More contactable |
| Has website | Medium | Enables enrichment |
| Is independent (not chain) | High | Higher conversion probability |
| Employee count (if known) | Medium | More employees = more staff parking need |
| Price level | Low | Higher-end = more likely to value premium parking |

**Needs research:**
- Scoring formula / weighting
- Minimum viable score threshold (below which we skip)
- Should we score at ingestion time or at outreach time?
- Batch size — how many per campaign?

---

### Gap 4: Value Prop by Business Segment ⚠️ P1

The pitch should differ by business type:

| Business Type | Their Parking Pain | Our Pitch Angle |
|--------------|-------------------|----------------|
| Hotels | Guests need parking, staff need daily parking | "Discounted guest parking + staff permits" |
| Gyms | Members complain about parking costs | "Discounted member parking — improves retention" |
| Restaurants | Evening diners need nearby parking | "Validated parking for diners — increases covers" |
| Offices | Staff commute daily, parking is expensive | "Staff parking scheme — salary sacrifice compatible" |
| Medical clinics | Patients struggling to park | "Patient parking validation — improves satisfaction" |
| Retail | Customer convenience | "Free parking validation for spend over £X" |

**Needs research:**
- Validate these angles with the team
- Which segments to prioritise
- Different pricing models by segment?

---

### Gap 5: Tracking & CRM ⚠️ P2

Once outreach begins, how do we track outcomes?

**Needs research:**
- Integration with existing Campaign/CampaignBusiness models
- New statuses needed: CONTACTED → OPENED → REPLIED → MEETING_BOOKED → DEAL_SIGNED?
- Dashboard for outreach pipeline visibility
- Do we track in ParkBunny app or in Smartlead/Instantly?
- Reply handling — who monitors responses?

---

### Gap 6: Email Infrastructure ⚠️ P0

Cannot send outreach without this:

**Needs decisions on:**
- Sending domain — `parkbunny.co.uk`? Separate outreach domain (e.g., `parkbunnyoffers.co.uk`)?
- SPF, DKIM, DMARC configuration
- Domain warming timeline (2-4 weeks minimum)
- Sending volume limits per day
- Email provider: Google Workspace, Microsoft 365, or dedicated outreach tool?
- If using Smartlead/Instantly — account setup and warm-up schedule

**Risk:** Sending cold email from `parkbunny.co.uk` and getting flagged = burns the main domain. Industry best practice is to use a **separate lookalike domain** for cold outreach.

---

### Gap 7: Volume & Unit Economics ⚠️ P1

No budget model exists.

**Needs research:**
- Expected conversion funnel (e.g., 100 contacted → ? meetings → ? deals)
- Cost per enriched lead:
  - Apollo credit cost per person lookup
  - Prospeo per email verification
  - Outscraper per business
- Cost per email sent (Smartlead/Instantly pricing)
- Revenue per signed deal vs cost per deal
- Break-even analysis

---

### Gap 8: Website Scraping Technical Approach ⚠️ P2

Layer 1 says "scrape About Us pages" but no detail on implementation.

**Needs decisions:**
- Scraping tool: Firecrawl (Markdown, best for LLM), Cheerio (fast HTML parsing), Puppeteer (JS-rendered), Outscraper?
- Which pages to scrape: `/about`, `/about-us`, `/contact`, `/team`, `/our-story`, footer
- LLM extraction: prompt design for extracting owner name, role, email, company number, VAT number
- Rate limiting: respect robots.txt, max concurrent requests
- Cost at scale: 6,363 websites × scrape cost
- Storage: where to store scraped content (the `siteData` field on Place model?)
- Freshness: how often to re-scrape

---

### Gap 9: Companies House API Practical Workflow ⚠️ P2

The API is free but has constraints.

**Needs research:**
- Rate limit: 600 requests per 5 minutes
- API key registration process
- Fuzzy address matching algorithm — how to score Companies House results against Google Places addresses
- Batch processing strategy for 6,363+ places
- Error handling for:
  - No results found
  - Multiple companies at same address
  - Company dissolved but still trading
- Data caching strategy — don't re-query if already resolved

---

### Gap 10: Sole Traders & Partnerships ⚠️ P0

**Critical gap.** Sole traders and partnerships have **no Companies House presence** (only Ltd/LLP are registered). This is a significant chunk of small hospitality businesses — potentially 20-30% of independents.

**Examples:** Corner cafés, independent hairdressers, small B&Bs, independent therapists, market traders

**Fallback path for sole traders:**
1. Website scraping (often has owner name on About page)
2. `info@` email (goes to owner)
3. Apollo search by business name + location
4. Google Maps — owner sometimes responds to reviews
5. Phone the business directly — they'll answer as the owner
6. Simply skip — if we can't find the owner, they may be too small to partner with

**Needs research:**
- What % of our 6,363 places are likely sole traders?
- Is it worth the effort for very small businesses?
- Different outreach approach for sole traders vs Ltd companies?

---

### Gap 11: Data Freshness & Decay ⚠️ P2

People change jobs, businesses close, emails become invalid. No refresh strategy documented.

**Needs decisions:**
- How often to re-enrich? (Monthly? Quarterly?)
- Trigger-based re-enrichment (e.g., email bounced → re-enrich)
- Monitoring email deliverability over time
- Google Places data refresh — how often do we re-fetch to catch new/closed businesses?

---

### Gap 12: Opt-Out & Suppression List Management ⚠️ P1

GDPR requires honouring opt-outs permanently.

**Needs implementation:**
- Suppression list database table
- Unsubscribe link in all outreach emails
- Check suppression list before every outreach send
- Handle "please remove me from your list" replies
- Cross-channel suppression (if they opt out of email, don't phone them)
- Data retention policy — how long do we keep data for opted-out contacts?

---

### Gap 13: International / Non-UK Businesses ⚠️ P3

Minor but worth noting:
- Some businesses in the database may have foreign parent companies
- Non-UK phone formats
- GDPR applies but some enrichment tools are US-centric
- Companies House is UK-only — no equivalent for foreign-owned businesses operating in UK

**Likely resolution:** Skip for now. Focus on UK-registered entities only.

---

## 10. Research Priorities (Ordered)

| Priority | Gap | Reason | Action |
|----------|-----|--------|--------|
| **P0** | Gap 3: Scoring & prioritisation | Must know WHERE to start | Design scoring model |
| **P0** | Gap 6: Email infrastructure | Must be set up 2-4 weeks before outreach | Choose domain, start warming |
| **P0** | Gap 10: Sole trader handling | ~20-30% of target businesses | Define fallback path |
| **P1** | Gap 1: Outreach message / email copy | Can't send without copy | Write templates per segment |
| **P1** | Gap 2: Sequencing & cadence | Defines the workflow | Design multi-touch sequence |
| **P1** | Gap 4: Value prop by segment | Different pitch per business type | Research & validate with team |
| **P1** | Gap 7: Volume & economics | Budget planning | Build funnel model |
| **P1** | Gap 12: Opt-out management | Legal requirement | Design suppression system |
| **P2** | Gap 5: Tracking & CRM | Post-outreach workflow | Extend Campaign model |
| **P2** | Gap 8: Website scraping | Implementation detail | Evaluate tools & costs |
| **P2** | Gap 9: Companies House workflow | Engineering detail | Register API key, build matcher |
| **P2** | Gap 11: Data freshness | Operational maintenance | Define refresh cadence |
| **P3** | Gap 13: International | Edge case | Skip for v1 |

---

## Open Questions (Original)

- [ ] What is the new outreach channel? Email-first? Multi-channel?
- [ ] Should chain branches be excluded or targeted at branch-manager level?
- [ ] Legal review on AI voice agent classification under PECR?
- [ ] Does ParkBunny have a Companies House API key?
- [ ] Apollo credit budget for enrichment?
- [ ] Priority: all 6,363 places or only LIVE location businesses?
- [ ] Franchise detection: treat as independent or chain?
