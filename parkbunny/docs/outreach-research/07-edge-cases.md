# 7. Edge Cases & Failure Modes

[← Back to Index](./README.md)

> Chain-specific edge cases are documented in [04-chain-path.md](./04-chain-path.md). This file covers general pipeline edge cases.

---

## 🏢 The Accountant Address Problem

**Problem:** ~30-40% of UK SMBs register their company at an accountant's or solicitor's office, not at the trading premises. Companies House address lookup returns zero.

**Resolution strategies:**

| Strategy | How | Success Rate |
|----------|-----|-------------|
| **Name-first search** | Search Companies House by trading name (fuzzy match) | Medium — trading name ≠ legal name |
| **Director service address** | If company found via name, check director's service address against Google address | High — directors often list the shop |
| **Postcode radius search** | Search all companies at the same postcode, score by name similarity | Medium-High |
| **Website → Company number** | Scrape website footer for company registration number (many display it) | High when present (~40% of sites) |
| **VAT fallback** | VAT number → HMRC → legal entity | Medium |

**Best approach:** Start with website scrape for company number (cheapest). Fall back to name search with address cross-validation. Last resort: postcode radius with fuzzy name matching.

---

## 🔀 Trading Name ≠ Legal Name

**Problem:** "The Blue Anchor" on Google ≠ "Maritime Hospitality Ltd" on Companies House. Name search fails.

**Indicators of mismatch:**
- Pubs, hotels, restaurants — almost always trade under a different name
- Chains that franchise — franchisee company name is completely different
- Properties with corporate landlords — the tenant's trading name differs from leaseholder

**Mitigation:** Website scraping for company number is the most reliable bridge. Many UK businesses display "Registered in England: 12345678" in their footer.

---

## 🏪 Franchises — The Grey Zone

**Problem:** A McDonald's in Cricklewood is operated by a franchisee (e.g., "NW London Food Holdings Ltd"), not McDonald's Corp. The franchise owner IS a valid decision-maker for local parking — but Google Maps says "McDonald's."

**Detection:** Website shows franchise info, or Companies House shows a different entity at the same address.

**Impact:** Franchises should be classified as "independent" for outreach purposes — the franchisee can make local deals.

> **User decision:** Franchise detection is **too complex for v1**. Defer to later iteration.

---

## 🏨 Multi-Company Structures at Same Address

**Problem:** A hotel might have 3+ companies at the same address:
- "Crown Hospitality Ltd" (operating company)
- "Crown Properties Ltd" (property holding company)
- "Crown Events Ltd" (events/wedding subsidiary)

Companies House search by address returns all of them. Which is the right one?

**Resolution:** Match SIC codes to Google Places types:

| Google Type | SIC Code Match |
|------------|---------------|
| hotel, lodging | 55100 (Hotels) |
| restaurant, food | 56101/56102 (Restaurants) |
| gym, fitness_center | 93110 (Sports facilities) |
| medical_clinic | 86210 (Medical practice) |

---

## 📞 National Number vs Local Number

**Problem:** Google Places sometimes returns a chain's national booking/enquiry line instead of the branch-specific number.

**Detection:** Numbers starting with 0800, 0808, 0330, 0333, 0345 are almost always national lines.

**Mitigation:** Scrape the branch-specific page on the chain's website for a direct number. Or skip phone outreach.

---

## 👻 Dissolved/Dormant Companies Still Trading

**Problem:** Company dissolved on Companies House but business still actively trading on Google Maps. Common with small businesses that restructure under new entities.

**Detection:** Companies House status = "Dissolved" or "Dormant" but Google status = "OPERATIONAL."

**Mitigation:** Search for recently incorporated companies at the same address or with the same director names.

---

## 🏗️ Multi-Site Independent Groups

**Problem:** Not a "chain" per se, but a local restaurateur owns 3 venues. They share a domain (e.g., `londonrestaurantgroup.co.uk`) but aren't a national chain.

**Detection:** Domain clustering catches these. 2-5 locations with same domain = "local group."

**Impact:** Treat as independent, but only contact the owner once — not once per venue.

---

## 🏠 Residential Addresses as Business Premises

**Problem:** Some businesses (clinics, therapists, guest houses) operate from residential addresses. Companies House won't find a company there.

**Detection:** Google Places types include `physiotherapist`, `counselor`, `guest_house`, `bed_and_breakfast` at addresses without commercial formatting.

**Mitigation:** Often sole traders — no Companies House presence. Fall back to website scraping + Apollo. Also check compliance (see [sole trader cold email rules](./06-compliance.md)).

---

## 📧 info@ Email Traps

**Problem:** Some `info@` addresses:
- Go to an external marketing agency (not the business owner)
- Are unmonitored catch-all addresses
- Forward to a shared inbox nobody checks
- Are for a different entity (parent company)

**Mitigation:** Email verification checks if the address exists. But deliverability ≠ readership. Track open rates — if no opens after 2 sends, escalate to phone.

---

## 📱 CTPS/TPS Edge Cases

**Problem:** A phone number might be on the CTPS register under one company but used by a different business (e.g., new tenant inherited old number).

**Mitigation:** Always screen before calling. If CTPS-blocked but we have a verified email, pivot to email only.

---

## 🌐 Businesses Without Websites (~13%)

**Problem:** 13% of businesses have no website. Website scraping, domain clustering, and `info@` construction all fail.

**Fallback pipeline:**
1. Company name → Companies House name search (fuzzy)
2. Phone number → Reverse lookup (limited value in UK)
3. Apollo search by company name + location
4. Manual LinkedIn search as last resort
5. Or simply skip — if no website and no phone, business may be too small to partner with

---

## 🏘️ Shared Premises / Business Centres

**Problem:** Multiple unrelated businesses at the exact same address:
- Business centres (e.g., Regus, WeWork) with 20+ tenants
- Shared units (gym + café in same building)
- Markets / food halls (10+ vendors, one address)

**Impact:** Address-based Companies House search returns dozens of companies. Name matching becomes critical.

**Detection:**
- Address contains "Unit", "Suite", "Floor", "Office" — likely shared premises
- Google Places returns multiple businesses at same coordinates
- Companies House returns 10+ active companies at same address

**Mitigation:** Rely more heavily on name matching + website-scraped company number at these addresses. Address-only lookup is useless here.

---

## 🔄 Recently Changed Ownership

**Problem:** Business sold to new owner, but:
- Website still shows old owner's name
- Companies House shows resignations/appointments from last 3 months
- Google reviews reference "the new management"

**Detection:**
- Companies House officer data shows a director appointed within last 6 months
- Website copyright year is outdated
- Google reviews mention "under new management" or "new owners"

**Mitigation:** Prefer Companies House data (latest appointments) over website data. Add a freshness flag — if director appointed within 6 months, mark as "recently changed ownership" (may affect outreach tone).

---

## ⏸️ Temporarily Closed Businesses

**Problem:** Google status = "TEMPORARILY_CLOSED." May reopen in weeks or be permanently dead.

**Impact:** Enriching now wastes credits. But if they reopen, they're a valid prospect.

**Mitigation:** Skip temporarily closed businesses. Re-check status monthly. Only enrich when status returns to "OPERATIONAL."

---

## 🏢 Virtual Offices

**Problem:** Companies registered at virtual office addresses (Regus, Spaces, WeWork, Your Virtual Office). The business doesn't physically operate there.

**Detection:**
- Known virtual office provider addresses (maintain a list of ~50 common UK virtual office providers)
- Companies House registered address is a virtual office, but Google Places address is different
- Multiple unrelated companies at the same address

**Impact:** If the Google Places address is a virtual office, the business may not need parking at all — they don't have physical premises nearby.

> **User note:** WeWork/Regus are actually **good targets** — they represent co-working spaces full of businesses that need parking for their staff and clients. Do NOT filter these out.

**Mitigation:** Cross-reference Google Places address with Companies House address. If there's a mismatch and one is a known virtual office, use the non-virtual address.

---

## 🚚 Businesses That Moved

**Problem:** Google listing still shows old address, but business relocated. Website may show new address.

**Detection:**
- Website address ≠ Google Places address
- Google reviews mention "they've moved" or "new location"
- Companies House registered address changed recently

**Impact:** We enrich based on Google address → the business is actually 2 miles away → not near our car park → wasted effort.

**Mitigation:** Cross-validate Google address against website contact page address. If they differ, use the website address (more likely to be current). If the new address is outside our car park radius, skip.

---

## 🤝 Existing ParkBunny Relationships

**Problem:** Some of the 6,363 places may already have a business relationship with ParkBunny — as existing customers, partners, or previous contacts. Cold-emailing someone we already work with is embarrassing and unprofessional.

**Detection:**
- Cross-reference against existing CRM / database of customers and partners
- Check `Campaign` and `CampaignBusiness` models for previous outreach
- Check if any deals or conversations are already in progress

**Mitigation:** Before any enrichment or outreach, run a deduplication pass against existing business relationships. Exclude or route to account management instead of cold outreach.

> **User note:** No clean list of existing partners exists currently. This deduplication cannot be done yet.

---

## ⚔️ Competitors at the Same Car Park

**Problem:** Two competing businesses (e.g., two gyms or two hotels) near the same ParkBunny car park. If we offer both discounted parking at our car park, we may create a conflict — or one may refuse if they know a competitor got the same deal.

**Detection:**
- Group businesses from the same report/car park by Google Places `types`
- Flag when 2+ businesses of the same type are in the same report catchment

**Mitigation:**
- Prioritise one per sector per car park (highest prospect score)
- At minimum, stagger outreach so competitors aren't contacted on the same day

> **User decision:** No exclusivity offered. Happy to partner with competing businesses at the same car park.

---

## 🔄 Overlapping Car Park Catchments

**Problem:** A business sits near two ParkBunny car parks and appears in both reports. If the pipeline runs per-report, this business gets enriched twice (wasting credits) and potentially receives two separate outreach emails about different car parks.

**Detection:**
- Deduplicate by Google Place ID across all reports
- Flag businesses that appear in 2+ reports

**Mitigation:**
- Enrich once, share the result across reports
- For outreach: combine into a single email referencing both car parks ("We manage car parks at [A] and [B] near your business")
- Or assign the business to the closest car park only

---

## 🏷️ Multi-Type Google Places Businesses

**Problem:** Google Places `types` is an **array**, not a single value. A business can be `["hotel", "restaurant", "bar", "event_venue"]`. This creates issues for:
- **Prospect filtering** (doc 01) — is `["church", "event_venue"]` a prospect or not?
- **Sector classification** (doc 02) — which SIC code do we match against?
- **Value prop** (gap 4) — which pitch angle do we use?
- **Scoring** (gap 3) — which type drives the prospect score?

**Detection:** Query database for all unique `types` combinations. Identify multi-type businesses.

**Mitigation:**
- Define a **type priority order** (e.g., `hotel` > `restaurant` > `bar` > `store` > `point_of_interest`)
- Use the highest-priority type as the "primary type" for scoring, filtering, and pitch selection
- If ANY type in the array is a non-prospect type (church, school), check whether it's the primary type or just a secondary classification
- Example: `["restaurant", "point_of_interest"]` → primary type is `restaurant` → prospect ✅
- Example: `["church", "event_venue"]` → primary type is `church` → non-prospect ❌

