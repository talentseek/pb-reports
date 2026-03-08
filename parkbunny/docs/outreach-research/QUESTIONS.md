# Alignment Questions — Spatial-to-Identity Pipeline

> Answer what you can, skip what you can't yet, and flag anything that's wrong.
> Write your answers directly after each question line.

---

## 📄 01 — Problem Statement

**1.** The 6,363 number — is this the total across ALL car park reports, or a single report? How many distinct car parks/reports do these places come from?

Not sure where this figure comes from if I look at the dashboard it says Total Businesses
10,115
Across all locations

Maybe this also includes archived. 

**2.** When was this data last fetched? Days, weeks, months ago?

It completely depends when the report was created some could be months. 

**3.** Website coverage at 87.3% — is this the Google-provided URL, or did someone manually verify these are real websites? From the manual audit, do you have a feel for what % are actually usable?

We have not run a manual audit this tends to be URLS that a present in the Google Places Data. 

**4.** The 4.8% with email from Outscraper — do you know if any of those emails were actually used for outreach? Did any bounce?

Not sure they were not verified I do no some bounced (let's ignore these previous attempts as they were not going to be successful)

**5.** "Empty enrichment fields" — did Outscraper attempt to fill these and return empty, or were these fields never queried at all?

We need to look into a new structure so let's ignore these fields for now. 

**6.** Non-prospect types — do you already have a gut feel for what % of the 6,363 are churches/schools/ATMs/etc? Have you ever eyeballed a single report and noticed a lot of junk?

No gut feeling too much data to go through.

**7.** Distance from car park — what's the typical search radius used when fetching places? 500m? 1km? 2km?

Usually around 0.75 miles really it needs to be walking distance from the carpark.

**8.** Per-report pipeline — when a new car park report is created today, does it automatically fetch Google Places? Or is there a manual trigger?

It automatically does it please research the codebase and documentation properly. 

**9.** Overlapping catchments — do you already know if there's significant overlap between car parks? (e.g., two ParkBunny car parks 500m apart sharing most businesses)

This is quite possible if we have run reports in the same area. 

**10.** Outscraper failure — was Outscraper a one-off bulk run, or an ongoing integration? Is the Outscraper account still active?

It was one integration we tried I would say not so successfully which is why we are looking at completely overhauling this. 

**11.** Data freshness — is the 6,363 a snapshot from one big fetch, or accumulated over time (some places fetched months ago, others recently)?

Accumulated over time however I dispute the number as mentioned above. 

**12.** Are there any places you already KNOW are dead? From the manual website audit — roughly how many did you flag as dead/incorrect?

Not really outreach has been sparce and manual. 

---

## 📄 02 — Chain Bifurcation

**13.** "Local Group" (2-5 sites) — have you seen these in your data? Can you name a couple of real examples from your car park areas?

Not really I have not seen this in the data. 

**14.** Franchise detection — is this actually important right now? Do you have many fast food / franchise restaurants in the 6,363, or is it mostly independent SMBs?

I think it is prodominantly chains rather than independents. But we need to check. 

**15.** The lookup table of ~200 chains — who would curate this? You? The team? Or generate a starter list programmatically?

Not sure I think it should be generated programmatically. 

**16.** Google `chains` field — has anyone tested this on your existing data? Do you know if your current `placesFetch.ts` field mask could be updated easily?

Its not been tested we need to test it although we also need to look at how we update the existing records. 

**17.** Confidence thresholds — if classification confidence is "low", wo
uld you want these to go into a manual review queue? Who reviews them?

The user can review them, this is a useful feature to have. 

**18.** Domain clustering exclusion list — do you already have a sense of which domains appear most in your data as false "chains"? (booking.com, wix.com, etc.)

Not sure I think it should be generated programmatically. 

---

## 📄 03 — Independent Path

**19.** Website scraping consent — are you comfortable scraping business websites programmatically? Any concerns about terms of service or reputation risk?

No concerns at all. 

**20.** The waterfall "stop when resolved" — if Layer 1 finds a name but no email, and Layer 2 confirms the director, do we immediately jump to Apollo for the email? Or try info@ first since it's cheaper?

I think we need to try and find an email from the website first and then we can look up the director or an actual person. 

**21.** Companies House API key — does anyone on the team already have one, or does this need to be registered from scratch?

I have one I can add to the .env

**22.** Apollo account — what's the current plan? Free tier, or budget for Basic ($49/mo)? How many enrichment credits do you realistically have?

Currently on free tier but can upgrade. 

**23.** "info@ goes to the owner" assumption — for your specific car park areas, what types of businesses dominate? (Hotels? Restaurants? Offices?)

Not sure it varies much. 

**24.** Manual review queue — if the pipeline flags an "UNRESOLVED" business, who reviews it? You? A team member? Or skip entirely?
The user can review them, this is a useful feature to have. 

**25.** VAT trace (Layer 5) — have you ever tried Vatsense or any VAT lookup? Is this realistic or theoretical?

We need to test it but it can be a good fallback if we can't get companies house reg number or details from the website the VAT number should give us this data. 

**26.** Social media as Layer 1b — would you actually want the pipeline to check Facebook/Instagram pages? Or "nice to have for later"?

Nice to have really, however some instagram / facebook pages do include an email so something to look into.

**27.** Conflict resolution — if the website says "Jane Smith, Owner" but Companies House says "John Smith, Director" — in practice, which do YOU trust more for outreach?

Hard to say really we need to think this through. 

**28.** How many layers deep are you willing to go? If a business fails L1-L3, would you rather just skip, or invest in L4-L5?

We should go a few layers deep but have a cut off too.
---

## 📄 04 — Chain Path

**29.** Do you actually want to target chains at all for v1? Or should v1 be 100% independents, with chains deferred?

No V1 needs both paths I would think the majority of potential leads are chains.

**30.** London density — how many of your car parks are in dense London areas vs suburban/rural?

Hard to say you can look it up.

**31.** Phone-first approach for chains — is there someone on the team who would make these calls? Or is this a non-starter?

We will still look at automating calls with AI for B2B it is still ok.

**32.** Location-specific emails — have you ever manually found one of these (e.g., `wandsworth@puregym.com`)? Any real-world data on how common they are?

I am sure I have seen them we will have to test to see how many like this there actually are I would say companies like gyms etc are likely to have branch emails. 

**33.** Central procurement chains (Tesco, Sainsbury's, banks) — are these actually in your 6,363? If there are 500 supermarkets and banks, that's a big chunk to filter.

I am sure there are a few we need to check.

**34.** Parking under landlord control — is this a major issue for your car park locations? Are many nearby businesses in shopping centres?

Yes some, this is something we need to think about some reports are speicifically shopping centre carparks. 

**35.** ROI estimates — the table shows hotels and gyms as ✅ High ROI. Does this match your team's experience? What sectors have you had the most success with historically?

Thehy tend to be more receptive and have regular members who would use discounts and offers.

**36.** Area/regional managers — if we find an area manager covering 5 branches, do you want ONE outreach email covering all, or discuss each location separately?

Perhaps both, what do you think?

**37.** Staff turnover 60-day freshness — is this realistic operationally? Can ParkBunny afford to re-enrich chain contacts every 2 months?

No we don't need to necesserily re-enrich, a nice to have for the future. 

## 📄 05 — Tech Stack

**38.** Firecrawl — have you used it before? Any experience with website scraping tools in general?

There are many options crawlforAI is one we need to pick the one which is best value for money and actually works. 

**39.** GPT-4o-mini for extraction — are you happy using OpenAI, or prefer a model you already have (Gemini, Claude)?

No preference you decide. 

**40.** The ~$190-240 first-run cost — is this within budget? Is there a hard ceiling?

Yes it is within budget. 


**41.** Pipeline orchestration — do you have a preference? Next.js API route + cron (simple), BullMQ/Redis (robust), or n8n (visual, already in use)?

No preference but we should probably build on the existing infrastructure.

**42.** Prisma schema changes — the Place model would get ~20 new fields. Comfortable with a large migration, or prefer a separate `Enrichment` table?

No preference you decide on the best cours of action as long as it is easily maintainable and we are careful not to break anything or lose existing data.


**43.** Where does enriched data live? Everything on Place model, or separate `Contact` / `DecisionMaker` model?

No preference you decide on the best cours of action as long as it is easily maintainable and we are careful not to break anything or lose existing data.

**44.** Raw Firecrawl Markdown storage — concerned about DB bloat? (6,363 × ~50KB each = ~300MB)

No preference you decide on the best cours of action as long as it is easily maintainable and we are careful not to break anything or lose existing data.

**45.** Email verification — ZeroBounce pay-as-you-go vs Reacher self-hosted. Any preference?

I have a service called reoon which is good and plenty of credits. 

**46.** Apollo free search + paid enrichment — maximise free tier first, or go straight to $49 Basic plan?

Happy to upgrade to the basic plan.

---

## 📄 06 — Compliance

**47.** Sole trader cold email — this is the legal blocker. Have you discussed this with a lawyer, or is this the first time it's been raised?

I think it is unlikely there will be many sole traders in the data set.


**48.** "Conservative approach — only email confirmed Ltd/LLP" — comfortable with this constraint? It means skipping ~20-30% of prospects.

I think we can email all of them for now.

**49.** Live phone calls to sole traders — is phone outreach actually on the table? Who would make the calls?

We will automate this still B2B is ok.

**50.** ICO registration — is ParkBunny already registered as a data controller?

Yes let's not worry too much at this stage about compliance.

**51.** Legitimate Interest Assessment (LIA) — has ParkBunny done one before for any marketing activity?

No let's not worry too much at this stage about compliance.

**52.** Separate outreach domain — willing to buy something like `parkbunnyoffers.co.uk`? Someone available to manage it?

Yes we have an instantly account we will use with multiple domains.

**53.** Domain warming (2-4 weeks) — is there a hard deadline for when outreach needs to begin?

Preferably soon in a couple of days this might be an issue. 

**54.** Smartlead vs Instantly — any preference? Or open to evaluating both?

Instantly

**55.** Data retention (6 months for uncontacted leads) — too short? Too long? Never thought about it?

Never thought about it. 

---

## 📄 07 — Edge Cases

**56.** Accountant address problem — is this something you've actually encountered, or theoretical?

Theoretical. 

**57.** Franchises — do you want the pipeline to detect and reclassify franchises as "independent"? Or too complex for v1?

Maybe too complex for now. 

**58.** Multi-company structures — in your typical car park area, how common are hotels/venues with multiple companies at same address?

I think quite common but we need to check.

**59.** Existing ParkBunny relationships — do you have a clean list of current partners/customers we can cross-reference? Where does this data live?

No we don't have this data. 

**60.** Competitors at same car park — is exclusivity something ParkBunny actually offers? Or happy to partner with two competing gyms?

No exclusivity,

**61.** Overlapping catchments — how many of your car parks are close enough that catchments overlap significantly?

We need to check probably a few overlap.

**62.** Virtual offices — are there WeWork/Regus locations near your car parks? Real concern or edge case?

Yes these are good targets.

**63.** Businesses that moved — how often does this happen in your data? Regularly or rarely?

I would think rarfely.

**64.** Multi-type businesses — do you have a gut instinct for the "primary type" priority order? (hotel > restaurant > bar > store?)

No instinct.

---

## 📄 08 — Gaps & Priorities

**65.** P0 priority agreement — do the 6 P0 gaps feel right to you? Would you reorder any?

Not sure what this is.

**66.** Gap 1 (outreach copy) — is there any existing email copy from ParkBunny, even from a different campaign, that could be adapted?

Look in the system if we have ny from previous attempts.

**67.** Gap 2 (sequencing) — email-first then phone? Or multi-channel from day one?

Email first then phone.

**68.** Gap 3 (scoring) — what would YOU consider the #1 scoring signal? Distance? Business type? Independent vs chain?

Independent / chain is more important distance doesn't matter too much all these businesses are in the catchment area. 

**69.** Gap 6 (email infra) — is there ANY existing email infrastructure for ParkBunny outreach?

We will set-up with Instantly.

**70.** Gap 7 (unit economics) — do you have any benchmark for "what's a deal worth"? Average revenue per parking partnership?

No we are offering discounts to their customers and staff for parking.

**71.** Gap 10 (sole traders) — for a corner café with 20 reviews — is that even worth contacting? Is there a size threshold?

Its worth contacting unlikely they will be a sole trader. 

**72.** Gap 15 (prospect qualification) — can we run a SQL query right now to get the `types` breakdown? This could be answered in 5 minutes.

Yes Im sure we can.

**73.** Gap 17 (LinkedIn) — how active is the SalesBee/Unipile setup? Production-ready or experimental?

Experimental 

**74.** Gap 18 (post-resolution handoff) — what's your vision? Fully automated → outreach tool? Or human-in-the-loop review?

Human in the loop especially for low scoring prospects.

**75.** Gap 19 (per-report vs batch) — if you had to pick one for v1: process one car park fully as a pilot, or batch-classify everything first?

Per report however it would be good to select business types for some car parks we might not want to do retail or hotels for instance. 

**76.** Overall v1 scope — if you could only pick ONE car park and 100 businesses to prove this end-to-end, which car park would it be?

It makes very little difference. 
