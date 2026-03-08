# 4. The Chain Path: Location-Bound Targeting

[← Back to Index](./README.md)

---

**Targeting C-suite at HQ is a strategic failure.** The Branch/General Manager is the prospect for localized parking deals. But resolving a specific branch employee from a national organisation is significantly harder than finding an independent owner.

> **User decision:** V1 needs BOTH the chain path and independent path. The dataset is believed to be **predominantly chains**, so this path may handle the majority of businesses.

## The Core Problem

We know "Travelodge Cricklewood" exists at NW2 3ED. We need to find the **specific person** who manages **that specific branch** and can say yes to a local parking partnership. This is fundamentally different from finding the owner of an independent café.

## Apollo.io Workflow: Manager-as-Prospect

Using Apollo's API:

1. **Company lookup:** `POST /organizations/enrich` with chain's domain (e.g., `travelodge.co.uk`)
2. **People search:** `POST /mixed_people/api_search` with:
   - Company domain: `travelodge.co.uk`
   - Titles: `branch manager, store manager, general manager, area manager`
   - Location: UK (city filter where possible)
3. **Enrich matched people:** `POST /people/bulk_match` → verified emails + phones

---

## 🏙️ The London Density Problem

**This is the hardest edge case.** In dense urban areas like London, a single chain can have 20-50+ branches within a few miles. Apollo's location filter is **city-level, not postcode-level**.

**Example:** Search Apollo for "Travelodge" + "General Manager" + "London" → returns 30+ results. Which one is at the Cricklewood branch?

### Resolution Strategies for Dense Areas

| Strategy | How | Reliability |
|----------|-----|-------------|
| **LinkedIn location cross-ref** | Check LinkedIn profile for specific branch mention in headline/experience | Medium — many just say "London" |
| **Chain website branch page** | Scrape the specific branch page for manager name (some chains list them) | High when available |
| **Google Maps reviews** | Manager sometimes responds to reviews with their name | Low — inconsistent |
| **Phone-first approach** | Call the branch, ask for the manager's name + email, then send a follow-up email | High — but labour-intensive |
| **Email pattern + branch name** | Some chains use `firstname.lastname@chain.co.uk` — if we find the name, construct the email | Medium — depends on chain |
| **Skip & deprioritise** | If a chain has 30+ London branches and no branch-specific matching is possible, skip and focus on independents | N/A — pragmatic triage |

**Key insight:** The London density problem may mean that **chains in dense urban areas are simply not worth the enrichment cost** compared to independents. A single independent hotel owner in Cricklewood is more actionable than all 30+ Travelodge managers combined.

---

## 🎯 The Title Hierarchy Problem

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

---

## 🔄 Area/Regional Manager Structures

**Problem:** Many chains don't have a dedicated manager at every single location. Instead, an **Area Manager** covers 5-15 branches.

**Impact:** If we find "Sarah Jones — Area Manager, North West London, Travelodge" on Apollo, she's a great prospect — she can approve parking deals for ALL branches in her area, not just one.

**But:** We might accidentally email her 5 times (once for each location we find in her area).

**Resolution:**
- Deduplicate by person, not by branch
- If an area manager is identified, associate them with ALL branches in their area
- Send ONE outreach email covering all branches, not separate ones

---

## 👻 LinkedIn-Dark Employees

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

**Fallback for LinkedIn-dark sectors:** Phone outreach (live or AI-assisted). The user plans to **automate calls with AI** for B2B outreach — this is legal under PECR for corporate subscribers (not sole traders).

> **User note:** AI-automated voice calls are on the table for B2B. This provides a scalable alternative to manual phone-first approaches for LinkedIn-dark chains.

---

## 🔀 Multi-Brand Parent Companies

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

---

## 🏪 Franchise vs Corporate-Owned Branches

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

---

## 🔒 Central Procurement Blockers

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

---

## 📧 Chain Email Architecture

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

---

## 📬 Location-Specific Brand Emails — The High-Value Shortcut

Many chains operate **location-specific email addresses** that route directly to the branch team or local manager. These bypass the entire people-finding problem.

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

---

## 📊 Chain Path Decision Matrix

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

---

## 🔄 Chain Staff Turnover Decay

**Problem:** Branch managers in hospitality and retail have high turnover — average tenure of 12-18 months. An identified manager may be gone within a quarter.

| Sector | Avg Manager Tenure | Decay Risk |
|--------|-------------------|-----------|
| Hotels | 18-24 months | Medium |
| Gyms | 12-18 months | High |
| Fast food | 6-12 months | Very high |
| Retail | 12-18 months | High |
| Pubs | 12-24 months | Medium-High |

**Impact:** Chain contact data goes stale **much faster** than independent data (where the owner stays for years/decades). Apollo data for chains is particularly vulnerable.

**Mitigation:**
- For chains, set enrichment freshness window to **60 days** (vs 90+ for independents)
- If an email bounces, immediately trigger re-enrichment
- Location-specific emails (`cricklewood@chain.co.uk`) are immune to turnover — they always go to whoever currently manages the branch. **Prefer location emails over person emails for chains.**

> **User decision:** Re-enrichment is a nice-to-have for the future, not v1. Focus on getting the initial enrichment right.

---

## ⏳ Seasonal & Interim Managers

**Problem:** Hotels and restaurants often have:
- Acting/interim managers covering for maternity leave or holidays
- Seasonal hires (holiday parks, beach hotels, Christmas retail)
- "Duty managers" who have no real authority but answer the phone

**Risk:** We spend Apollo credits identifying someone who leaves in 2-3 weeks.

**Mitigation:**
- Don't target contacts whose LinkedIn says "Interim" or "Acting"
- Seasonal businesses (identified by Google's `regular_opening_hours` changes or review patterns) should be enriched during their peak season when permanent staff are present
- For phone-first outreach, ask "Is this the full-time general manager?" before proceeding

---

## 🏢 Right Chain, Wrong Location

**Problem:** We identify "John Smith, GM at Travelodge" but can't confirm which branch he manages. We email him about the Cricklewood location, but he's actually at the Wembley branch.

**Possible outcomes:**
- **Best case:** He forwards the email to the correct GM → still converts
- **Neutral:** He ignores it
- **Worst case:** He's annoyed by the irrelevance → poisons future outreach to that chain

**Mitigation:**
- Frame outreach generically when branch is uncertain: "We manage car parks near several Travelodge locations in North London..." rather than "We noticed you manage the Cricklewood branch..."
- If we're only 50% confident on branch assignment, use softer language
- Track wrong-location responses to learn which chains this happens with most

---

## 🏬 Parking Under Landlord Control

**Problem:** Some chain branches (especially in shopping centres, retail parks, and business parks) don't control parking at all. The parking is managed by:
- The shopping centre management company
- The retail park landlord
- A dedicated property management firm
- The local council

**Examples:**
- A Costa inside Westfield — Westfield controls parking, not Costa
- A PureGym in a retail park — the retail park manages the car park
- A hotel inside a mixed-use development — the building management company controls access

**Impact:** Contacting the branch manager is pointless — they can't make a parking deal because they don't control the car park. The real decision-maker is the property/centre manager.

**Detection:**
- Google Places `types` includes "shopping_mall" or "shopping_center" nearby
- Business address contains "Unit", "Shop", "Level" — suggests it's inside a larger property
- Google Maps satellite view shows shared car park with other businesses
- Chain website says "Parking available at [Centre Name]"

**Resolution:** For businesses inside managed properties, redirect outreach to the property management company (which may itself already be in our Places database).

> **User note:** Some ParkBunny reports are specifically for **shopping centre car parks**. This means landlord control is a real and common scenario, not an edge case.

---

## 📊 ROI Estimate by Chain Sector

Before investing enrichment effort, estimate the expected return:

| Sector | Enrichment Cost | Expected Match Rate | Expected Close Rate | ROI Verdict |
|--------|----------------|--------------------|--------------------|------------|
| Hotels (mid-chain, suburban) | Low ($2-5/branch) | ~50% | ~10-15% | ✅ High ROI |
| Gyms (PureGym, The Gym) | Low ($2-5) | ~40% | ~8-12% | ✅ Good ROI |
| Franchise restaurants | Low ($2-5) | ~30% | ~5-10% | ✅ Good ROI |
| Pubs (Wetherspoons, Stonegate) | Low ($2-5) | ~20% | ~3-5% | ⚠️ Marginal |
| Fast food | Low ($2-5) | ~10% | ~1-2% | ❌ Low ROI |
| Supermarkets | High ($5-10) | ~5% | ~0% | ❌ Not viable |
| Banks/offices | High ($5-10) | ~60% | ~0% | ❌ Central procurement |

**Implication:** Focus chain effort on hotels and gyms. Franchise restaurants if nearby. Everything else is diminishing returns.

---

## Recommended Chain Path Flow (Updated)

```
Chain detected
  │
  ├─ Is it a franchise? ─── YES ──→ Treat as INDEPENDENT path
  │
  ├─ Central procurement? ── YES ──→ SKIP (or target procurement team at HQ)
  │
  ├─ Inside a managed property (shopping centre, retail park)?
  │   └─ YES → Redirect to PROPERTY MANAGEMENT outreach
  │
  ├─ Try location-specific email discovery FIRST (cheapest)
  │   ├─ Construct {area}@domain, {postcode}@domain, {branch}@domain
  │   ├─ Validate with email verification API
  │   └─ Email validates? → OUTREACH via location email ✅
  │
  ├─ Scrape branch-specific web page for manager name/email
  │   └─ Found? → Construct email + verify → OUTREACH ✅
  │
  ├─ Dense urban area?
  │   ├─ YES → Phone-first approach (ask for manager name + email)
  │   └─ NO  → Apollo people search (title + city filter)
  │
  ├─ Apollo found manager?
  │   ├─ YES → Verify branch match → Enrich → OUTREACH
  │   └─ NO  → Phone the branch → or SKIP
  │
  ├─ Deduplicate by person (area managers cover multiple branches)
  │
  └─ Set enrichment freshness to 60 days (vs 90 for independents)
```

