# 🧠 Investor Deck — Critical Review from an Investor's Perspective

## Context
An early-stage parking tech company (ParkBunny) is raising £1M at a £5M pre-money valuation. The 15-slide deck needs to pass the "would I write a cheque?" test. Every data point has been reviewed.

---

## 🔴 Red Flags an Investor Would Spot Immediately

### 1. Revenue vs. Overhead Gap
- Current monthly revenue: **£1,949**
- Monthly overhead: **£14,500**
- That's a **7.4x burn rate** — you're losing ~£12.5k/month
- The deck says "breakeven April 2026" but doesn't show the *math* — how do you go from £1.9k to £14.5k in ~3 months? An investor will do this maths in their head instantly

### 2. "40+ Live Sites" but only £1,949/month
- That's roughly **£49/site/month** — this undermines the "£20,500/yr per shopping centre" claim
- An investor will ask: *"If you have 40+ sites, why are you only making £24k/year?"*
- Are these sites "live" or just "activated with no transactions"? The distinction matters enormously

### 3. Valuation Justification is Missing
- £5M pre-money on £24k annual revenue = **~208x revenue multiple**
- There's no comparable company benchmark, no justification
- An investor will compare to JustPark (which you reference) — what was *their* valuation at this stage?

### 4. "Pipeline" is Vague
- "150+ pipeline sites" — pipeline could mean anything from "we emailed them" to "signed LOI pending go-live"
- No pipeline staging (leads → qualified → contracted → live)
- Investors have been burned by vanity pipeline numbers

### 5. No Unit Economics
- What's the **CAC** (cost to acquire a site)?
- What's the **LTV** per site?
- What's the **payback period** per site?
- What's the **churn rate** — have any sites *stopped* using ParkBunny?

---

## 🟡 Things That Are Good But Could Be Stronger

### 6. Team Slide — Strong but Needs Sharpening
- Jon's JustPark credential (100k spaces in 2 years) is excellent — make this the *centrepiece*, not one of three bullets
- The iZettle credential is strong but the "2-time unicorn" wording is confusing. It was acquired by PayPal for $2.2B — say that
- "Royal Navy Veteran" — interesting colour but irrelevant to investors. Drop it or move it last

### 7. The Partner Names Are Impressive but Lack Status
- Savills, Euro Car Parks, NSL — these are major names
- But what's the *actual relationship*? Signed contract? MOU? "In discussions"?
- There's a massive difference between "Savills manages 80+ shopping centres and we're their payment provider" vs "We've had a meeting with Savills"

### 8. Additional Revenue Streams — Dilutes Focus
- Film production with Netflix/Marvel? This sounds like a one-off windfall, not a scalable revenue stream
- Investors want to see you're focused on the core business, not distracted by 6 different side hustles
- Pick the top 2–3 that are proven, drop the aspirational ones

### 9. 32% MoM Growth — Buried and Unexplained
- This is potentially the strongest metric in the entire deck and it's just one of six boxes
- But: Oct → Nov is a single month — is this sustained? What's the 3-month trend?
- If genuine and sustained, this should be front-and-centre on the cover slide

---

## 🟢 Three Options to Improve

---

### Option A: "Fix the Numbers Story"
Focus on making the financials bulletproof and adding missing investor-critical data.

**Changes:**
- Add a **unit economics slide** (CAC, LTV, payback, churn)
- Replace "40+ live sites" with a more honest breakdown: e.g., "12 transacting sites, 28 activated, 150+ pipeline"
- Add a **revenue growth chart** (even if it's only 3-4 months of data)
- Explain the gap between current revenue and breakeven with a concrete ramp-up schedule
- Add **customer testimonials** or a quote from a site operator

✅ **Pros:**
- Builds investor trust immediately
- Pre-empts the hardest questions
- Shows self-awareness and maturity

❌ **Cons:**
- Requires honest data that may feel "small"
- Needs actual historical revenue numbers

📊 **Effort:** Medium (mostly content changes in `investor-data.ts`)

---

### Option B: "Sharpen the Narrative"
Focus on the *storytelling* — make the deck more emotionally compelling with stronger positioning.

**Changes:**
- Reframe the headline: Instead of "Parking that rewards drivers" → something like **"The loyalty layer for parking"** or **"Every parking session is a transaction waiting to happen"**
- Lead with the **market size slide** (68M daily events, zero loyalty) — this is more gripping than opening with features
- Consolidate the 6 additional revenue streams into a single "platform monetisation" visual — show ParkBunny at the centre with revenue radiators
- Make Jon's JustPark story the emotional anchor: *"I onboarded 100,000 spaces for someone else. Now I'm doing it for us."*
- Drop Film Production and Pop-Up Retail — they dilute the focus story

✅ **Pros:**
- More memorable and emotionally engaging
- Cleaner, more focused narrative arc
- Better "first impression" on investors

❌ **Cons:**
- Doesn't fix the underlying numbers questions
- Narrative alone won't close sophisticated investors

📊 **Effort:** Medium (content rewrites + some slide reordering)

---

### Option C: "Full Investor-Ready Overhaul"
Combine A + B plus add interactive elements that make the digital format shine.

**All changes from A and B, plus:**
- Add an **animated revenue waterfall** showing how £1.9k → breakeven → £1M builds
- Add a **competitive landscape slide** (where is ParkBunny vs. JustPark, RingGo, PayByPhone?) — investors need to see you know who else is in the market
- Add a **timeline/milestones slide** — what you'll achieve at 6, 12, 18 months with the £1M
- Make the traction numbers **live-animated counters** that count up as you scroll to them
- Add a **"Why Now?"** slide — what macro trends make this the right moment (EV transition, high street decline, smart city investment)

✅ **Pros:**
- Truly investor-grade, comprehensive deck
- Interactive elements leverage the web format (vs. static PDF)
- Addresses almost every question an investor would ask

❌ **Cons:**
- Significant content creation effort
- Requires Jon/team input for accurate data
- Risk of over-engineering — 15 slides could become 18+

📊 **Effort:** High (new slides + animations + content overhaul)

---

## 💡 Recommendation

**Option A first, then cherry-pick from B.**

The numbers story is the single biggest vulnerability. A sharp investor will do the maths in 30 seconds: *"40 sites, £1,949/month — that's £49 per site. Your model says £20k per shopping centre. Where's the gap?"* If you can't answer that cleanly in the deck itself, the conversation is over before it starts.

After fixing the numbers, the narrative sharpening from Option B (stronger headline, lead with market size, consolidate side streams, sharpen Jon's story) will make the whole deck sing.

---

## Priority Action Table

| Priority | Change | Why |
|----------|--------|-----|
| 🔴 P0 | Explain the £49/site vs £20k/site gap | Investors will calculate this |
| 🔴 P0 | Add unit economics (CAC/LTV) | Missing entirely |
| 🟡 P1 | Stage the pipeline (leads → LOI → live) | "150+" is too vague |
| 🟡 P1 | Add a revenue growth chart | Show trajectory, not a snapshot |
| 🟡 P1 | Add competitive landscape | "Zero direct loyalty competitors" needs proof |
| 🟢 P2 | Sharpen Jon's JustPark story | Strongest credential, underplayed |
| 🟢 P2 | Drop Film Production + Pop-Up Retail | Dilutes focus |
| 🟢 P2 | Reorder: lead with Market Opportunity | More gripping opener |
