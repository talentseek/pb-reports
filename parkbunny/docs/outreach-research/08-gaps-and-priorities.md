# 8. Identified Gaps & Research Priorities

[← Back to Index](./README.md)

---

## Research Priorities (Quick Reference)

| Priority | Gap | Reason | Status |
|----------|-----|--------|--------|
| **P0** | Gap 3: Scoring & prioritisation | Must know WHERE to start | ❌ Open |
| **P0** | Gap 6: Email infrastructure | 2-4 weeks lead time before outreach | ❌ Open |
| **P0** | Gap 10: Sole trader handling | ~20-30% of target businesses | ❌ Open |
| **P0** | Gap 14: Sole trader cold email compliance | Legal blocker — can't email sole traders without consent | ❌ Open — see [compliance doc](./06-compliance.md) |
| **P0** | Gap 15: Prospect qualification | Must filter non-prospects before enrichment | ❌ Open |
| **P0** | Gap 16: Pipeline testing strategy | Need to test before 6,363 batch run | ❌ Open |
| **P1** | Gap 1: Outreach copy | Can't send without email templates | ❌ Open |
| **P1** | Gap 2: Sequencing & cadence | Defines the multi-touch workflow | ❌ Open |
| **P1** | Gap 4: Value prop by segment | Different pitch per business type | ❌ Open |
| **P1** | Gap 7: Volume & economics | Budget planning | ❌ Open |
| **P1** | Gap 12: Opt-out management | Legal requirement | ❌ Open |
| **P1** | Gap 17: LinkedIn as outreach channel | Already have SalesBee/Unipile | ❌ Open |
| **P2** | Gap 5: Tracking & CRM | Post-outreach workflow | ❌ Open |
| **P2** | Gap 8: Website scraping | Implementation detail | ⚡ Partially addressed in [tech stack](./05-tech-stack.md) |
| **P2** | Gap 9: Companies House workflow | Engineering detail | ⚡ Partially addressed in [tech stack](./05-tech-stack.md) |
| **P2** | Gap 11: Data freshness | Operational maintenance | ❌ Open |
| **P2** | Gap 18: Post-resolution handoff | Bridge between enrichment and outreach | ❌ Open |
| **P2** | Gap 19: Per-report vs batch processing | Fundamental architecture question | ❌ Open |
| **P3** | Gap 13: International | Edge case | ❌ Open — skip for v1 |

---

## Gap 1: The Actual Outreach Message ⚠️ P1

All research focuses on *finding* people but nothing on *what to say*. The Sarah voice prompt exists but no email copy.

**Needs research:**
- Email template per business type (hotel vs gym vs restaurant)
- Subject line testing strategies
- Value proposition framing — "discounted parking for your staff/guests" vs "revenue share" vs "partnership"
- How much to reveal in first touch vs follow-up
- Tone: corporate vs friendly vs ultra-casual

---

## Gap 2: Sequencing & Cadence ⚠️ P1

No multi-touch sequence designed.

**Example cadence to evaluate:**
```
Day 1:  Email #1 (intro + value prop)
Day 3:  Email #2 (follow-up, different angle)
Day 7:  LinkedIn connect request (if person identified)
Day 10: Email #3 (case study / social proof)
Day 14: Phone call (AI-assisted or human — legal for B2B)
Day 21: Final email (break-up / last chance)
```

> **User decision:** Email first, then phone. Multi-channel can come later.

**Needs research:**
- Optimal number of touches before giving up
- Channel mix (email only? email + LinkedIn? email + phone?)
- Timing between touches
- When to escalate from email to phone
- Behaviour-triggered actions (e.g., if they open email, send follow-up faster)

---

## Gap 3: Scoring & Prioritisation ⚠️ P0

Which of 6,363 businesses should we contact *first*? No scoring model exists.

**Potential scoring signals:**

| Signal | Weight | Rationale |
|--------|--------|-----------|
| Business type | High | Hotels, gyms = high parking demand |
| Rating + review count | Medium | Popular = more footfall = more parking need |
| Distance from car park | High | Closer = more relevant |
| Has phone number | Medium | More contactable |
| Has website | Medium | Enables enrichment |
| Is independent (not chain) | **Highest** | Higher conversion probability — user's #1 signal |
| Employee count (if known) | Medium | More employees = more staff parking need |
| Price level | Low | Higher-end = more likely to value premium parking |
| Is confirmed Ltd company (not sole trader) | Medium | Legal safety for cold email (deprioritised for v1) |

> **User decision:** Independent vs chain is the **#1 scoring signal**. Distance doesn't matter much — all businesses are already within the report's catchment area (0.75 miles).

**Needs research:**
- Scoring formula / weighting
- Minimum viable score threshold (below which we skip)
- Should we score at ingestion time or at outreach time?
- Batch size — how many per campaign?

---

## Gap 4: Value Prop by Business Segment ⚠️ P1

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

## Gap 5: Tracking & CRM ⚠️ P2

Once outreach begins, how do we track outcomes?

**Needs research:**
- Integration with existing Campaign/CampaignBusiness models
- New statuses needed: CONTACTED → OPENED → REPLIED → MEETING_BOOKED → DEAL_SIGNED?
- Dashboard for outreach pipeline visibility
- Do we track in ParkBunny app or in Smartlead/Instantly?
- Reply handling — who monitors responses?

---

## Gap 6: Email Infrastructure ⚠️ P0

Cannot send outreach without this.

**Needs decisions on:**
- ~~Sending domain — `parkbunny.co.uk`? Separate outreach domain?~~ **✅ Decided: Instantly with multiple domains**
- SPF, DKIM, DMARC configuration on outreach domain
- Domain warming timeline (2-4 weeks minimum)
- Sending volume limits per day
- ~~Email provider?~~ **✅ Decided: Instantly**
- ~~Smartlead vs Instantly?~~ **✅ Decided: Instantly**

> **⚠️ Timeline pressure:** User wants outreach in **days**. If domains are already warmed in Instantly, this may be achievable. If not, warming is a 2-4 week blocker.

**Risk:** Sending cold email from `parkbunny.co.uk` and getting flagged = burns the main domain. Industry best practice is to use a **separate lookalike domain** for cold outreach. ✅ Already handled via Instantly.

---

## Gap 7: Volume & Unit Economics ⚠️ P1

No budget model exists.

**Needs research:**
- Expected conversion funnel (e.g., 100 contacted → ? meetings → ? deals)
- Cost per enriched lead (Apollo credits, Firecrawl credits)
- Cost per email sent (Smartlead/Instantly pricing)
- Revenue per signed deal vs cost per deal
- Break-even analysis

---

## Gap 8: Website Scraping Technical Approach ⚡ P2 (Partially Addressed)

Now covered in [tech stack doc](./05-tech-stack.md) — Firecrawl selected, LLM extraction prompt drafted, cost estimated.

**Still needs:**
- robots.txt compliance strategy
- Handling of CAPTCHAs and anti-bot protection
- Decision on multiple page vs single page scraping credit impact
- Error handling for JavaScript-heavy sites that Firecrawl can't render

---

## Gap 9: Companies House API Practical Workflow ⚡ P2 (Partially Addressed)

Now covered in [tech stack doc](./05-tech-stack.md) — rate limits, endpoints, resolution strategy, and batch processing documented.

**Still needs:**
- API key registration (someone needs to actually do this)
- Fuzzy address matching algorithm — specific implementation
- Handling of Scottish companies (separate register, different company number format)

---

## Gap 10: Sole Traders & Partnerships ⚠️ P0

**Critical gap.** Sole traders and partnerships have **no Companies House presence** (only Ltd/LLP are registered). Potentially 20-30% of independents.

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

> ⚠️ **Compliance link:** See [Gap 14](#gap-14-sole-trader-cold-email-compliance--p0) — even if we find a sole trader's email, we may not legally be able to cold email them.

---

## Gap 11: Data Freshness & Decay ⚠️ P2

People change jobs, businesses close, emails become invalid.

**Needs decisions:**
- How often to re-enrich? (Monthly? Quarterly?)
- Trigger-based re-enrichment (e.g., email bounced → re-enrich)
- Monitoring email deliverability over time
- Google Places data refresh — how often do we re-fetch to catch new/closed businesses?
- Chain contacts decay faster (60-day window vs 90-day for independents — see [chain path](./04-chain-path.md))

---

## Gap 12: Opt-Out & Suppression List Management ⚠️ P1

GDPR requires honouring opt-outs permanently.

**Needs implementation:**
- Suppression list database table
- Unsubscribe link in all outreach emails
- Check suppression list before every outreach send
- Handle "please remove me from your list" replies
- Cross-channel suppression (if they opt out of email, don't phone them)
- Data retention policy — how long do we keep data for opted-out contacts?

---

## Gap 13: International / Non-UK Businesses ⚠️ P3

Minor but worth noting:
- Some businesses in the database may have foreign parent companies
- Non-UK phone formats
- GDPR applies but enrichment tools are US-centric
- Companies House is UK-only

**Likely resolution:** Skip for now. Focus on UK-registered entities only.

---

## Gap 14: Sole Trader Cold Email Compliance 🚨 P0 (NEW)

**Legal blocker.** Under PECR, sole traders count as individuals — cold email requires prior consent.

**The pipeline problem:**
1. If Companies House finds nothing → business may be a sole trader
2. If sole trader → cold email is illegal without consent
3. But we don't know it's a sole trader until AFTER we've tried to enrich

**Options:**
- ~~Only cold email businesses confirmed as Ltd/LLP via Companies House~~
- ~~Use phone instead of email~~
- ~~Get legal advice~~
- ✅ **Accept the risk** — most enforcement targets spam, not targeted B2B outreach

> **User decision:** Will email all businesses. Unlikely many sole traders in dataset. Compliance risk accepted for v1. Sole trader detection is still useful for data quality but not a gating requirement.

**Action:** ~~Legal review before outreach launch.~~ Deprioritised. See [compliance doc](./06-compliance.md).

---

## Gap 15: Prospect Qualification 🚨 P0 (NEW)

**Must be done before ANY enrichment.** Not all 6,363 places are viable prospects.

**Action required:**
1. Export a breakdown of all Google `types` in the database
2. Classify each type as: ✅ Prospect, ❌ Non-prospect, ⚠️ Maybe
3. Filter non-prospects BEFORE running the enrichment pipeline
4. Estimated filter: ~30-40% may be non-prospects (churches, schools, government, ATMs, etc.)

**Non-prospect types to filter:**
- `church`, `mosque`, `synagogue`, `hindu_temple`
- `school`, `university`, `library`
- `local_government_office`, `courthouse`, `fire_station`, `police`
- `atm`, `bus_station`, `train_station`, `parking`
- `park`, `cemetery`, `museum` (public/free entry)

**This directly reduces enrichment cost.** If 2,000 of 6,363 are non-prospects, that's $60-80 in wasted Firecrawl + LLM credits.

---

## Gap 16: Pipeline Testing Strategy 🚨 P0 (NEW)

**Don't run 6,363 places through an untested pipeline.** Test in stages:

| Phase | Scope | Purpose |
|-------|-------|---------|
| **Phase 0: Manual test** | 10 businesses (5 independent, 5 chain) | Validate each layer manually — does website scraping work? Does Companies House return useful results? Does Apollo find the owner? |
| **Phase 1: Script test** | 50 businesses | Run the automated pipeline on a small batch, review all outputs manually |
| **Phase 2: Validation test** | 200 businesses | Compare pipeline outputs against manually verified ground truth for a subset |
| **Phase 3: Full run** | All 6,363 (minus non-prospects) | Production run with monitoring |

**Key metrics to validate:**
- % of websites successfully scraped
- % of Companies House matches (correct company resolved)
- % of Apollo matches (correct person found)
- % of emails that validate
- Overall identity resolution rate

---

## Open Questions

- [x] ~~What is the new outreach channel?~~ **Email first, then phone.**
- [ ] Should chain branches be excluded or targeted at branch-manager level? **Both paths needed for v1.**
- [ ] Legal review on AI voice agent classification under PECR? **Deprioritised — user considers AI B2B calls acceptable.**
- [ ] ~~Legal review on sole trader cold email?~~ **Deprioritised — will email all for now.**
- [x] ~~Does ParkBunny have a Companies House API key?~~ **Yes.**
- [ ] Apollo credit budget for enrichment? **Willing to upgrade to Basic ($49/mo).**
- [ ] Priority: all places or only LIVE location businesses?
- [ ] ~~Franchise detection: treat as independent or chain?~~ **Deferred for v1.**
- [ ] ~~Is ParkBunny registered with the ICO?~~ **Deprioritised.**
- [ ] What Google `types` are in our ~10,115 places? **(Need data export to answer — user confirmed can run SQL)**
- [ ] What % of our websites are dead/parked? **(No audit done yet)**
- [ ] Do any of the ~10,115 places already have an existing ParkBunny relationship? **No partner list exists.**
- [ ] How many businesses overlap across multiple car park reports?
- [ ] ~~Should we use LinkedIn outreach alongside email?~~ **SalesBee/Unipile is experimental — email first.**
- [x] ~~What happens to a resolved lead?~~ **Human in the loop for low scoring. Auto-feed high scoring.**
- [x] ~~Do we build per-report or batch?~~ **Per-report, with ability to select business types per car park.**
- [ ] How do we handle multi-type businesses for scoring? (Define type priority order)

---

## Gap 17: LinkedIn as Outreach Channel ⚠️ P1 (NEW)

**Blind spot.** Gap 2 mentions LinkedIn connect requests in the cadence, but nowhere do we properly evaluate LinkedIn as a first-touch or parallel channel.

**Why this matters:**
- ParkBunny already has SalesBee + Unipile for LinkedIn automation
- LinkedIn is the one channel where branch managers and business owners proactively maintain their profiles
- For "LinkedIn-dark" sectors (hospitality, retail), email is better. But for offices, medical, professional services — LinkedIn may outperform email
- LinkedIn InMail has no PECR restriction — it's platform-to-platform, not electronic marketing

**Needs research:**
- Can SalesBee/Unipile be repurposed for ParkBunny outreach?
- LinkedIn message vs InMail vs connection request — which approach for cold outreach?
- Does Apollo give us LinkedIn profile URLs? (Yes — so we can automate connection requests)
- Rate limits on LinkedIn outreach via Unipile
- Compliance: LinkedIn terms of service on automated outreach
- Should LinkedIn be Channel 1 (primary) or Channel 2 (follow-up after email)?

---

## Gap 18: Post-Resolution Handoff ⚠️ P2 (NEW)

**Blind spot.** The pipeline ends at "verified decision-maker + contact details." But no document describes what happens next.

**The missing bridge:**
```
Pipeline Output → ??? → Outreach Tool (Smartlead/Instantly/SalesBee)
```

**Questions to resolve:**
- Does every resolved lead automatically enter an outreach sequence?
- Is there a manual review/approval step? (e.g., human reviews top 50 leads before launch)
- Who creates the outreach segments? (by business type? by car park? by confidence level?)
- How does the lead data get from ParkBunny DB into the outreach tool?
  - API integration? CSV export? Manual copy?
- If using Smartlead/Instantly: how do we map our enrichment data to their lead fields?
- Do we create one campaign per car park, or one global campaign?

**Impact:** Without this, the pipeline produces data that sits in the database with no path to revenue.

---

## Gap 19: Per-Report vs Batch Processing ⚠️ P2 (NEW)

**Blind spot.** Doc 01 says the pipeline should work "per-report" (only businesses near a specific car park). But doc 05 pipeline engineering assumes batch processing of all 6,363 places at once.

**These are fundamentally different modes:**

| Mode | How it works | Pros | Cons |
|------|-------------|------|------|
| **Per-report** | Trigger enrichment when a new report is created. Only enrich businesses within that car park's catchment. | Focused, relevant, incremental cost. | Slow rollout — one car park at a time. |
| **Batch** | Run the pipeline on all 6,363 at once. | Complete data set fast. Can score and prioritise globally. | Higher upfront cost. Some enriched leads may never be used. |
| **Hybrid** | Batch classify + filter all 6,363. Then enrich per-report as each car park is ready for outreach. | Best of both. Classification is cheap. Enrichment only when needed. | More complex architecture. |

**Recommendation to research:** The hybrid approach is probably optimal — classify and score everything cheaply (domain clustering, type filtering), then only spend Firecrawl/Apollo credits per-report when outreach is ready for that car park.

**Impact:** This affects pipeline orchestration design, cost modelling, and the Prisma schema (need to track which report triggered enrichment).
