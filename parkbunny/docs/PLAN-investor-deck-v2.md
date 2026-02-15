# PLAN: Investor Deck V2 — CEO Feedback Implementation

## Source
CEO feedback from [Bizplanchanges.docx](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/public/Bizplanchanges.docx), cross-referenced with our [investor review](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/docs/investor-deck-review.md).

---

## Change Summary

Jon's feedback mapped to specific updates:

### 1. Core Numbers Updated

| Field | Current Value | New Value |
|-------|--------------|-----------|
| Raise Amount | £1M | **£400k** |
| Equity | 20% | TBC (Jon quotes both £400k@£4M and £400k@£5M) |
| Valuation | £5M pre-money | **£5M pre-money** (use the latest quote) |
| Live Sites | 40+ | **50+** |
| Alternative Ask | £500K for 10% | **Remove** (single ask now) |

> [!IMPORTANT]
> **Conflicting valuation**: The doc says "£400k at £4m pre money valuation" early on, then "£400k at £5m pre money valuation" at the end. **Confirm with Jon: is it £4M or £5M pre-money?** Plan assumes £5M (the final statement).

---

### 2. Messaging & Positioning Rewrite

| Slide | Change |
|-------|--------|
| **Cover** | Add emphasis on supporting independent retailers |
| **Solution (Slide 3)** | Reframe around hyperlocal: "Food, retail, beauty and fitness rewards — giving independent retailers the chance to turn a new customer into a regular customer" |
| **Business Activation (Slide 5)** | Rewrite: "AI-driven hyperlocal outreach to Hotels, Gyms, Offices etc. offering discounted tariffs in return for promoting the car park to their guests, members and staff" |
| **Additional Revenue (Slide 9)** | Reframe as "Additional Revenue Streams for Car Park Owners" — Last mile logistics lockers, digital signage, self-service car washes. Position as "revenue generators for underutilised areas of a car park" |

---

### 3. Revenue Model — Consolidate into One Slide

Jon says: *"re-jig this slide — add all our model into one slide and simplify"*

**New unified revenue slide content:**
- Breakeven: **April 2026**
- Monthly run rate: **£18k/month**
- 150-space car park = **£7k net revenue**
- £1M net revenue = **142 car parks**
- Partners have **10,000+ sites** of this size
- Executing on only **1.42%** of partner portfolios hits 2026 target
- Shopping centre = **4–6x** a 150-space car park in revenue

> This replaces the current Slides 7 (Revenue Model) + 8 (Path to £1M). Merge into one clean slide.

---

### 4. AI & Lean Operations — New Content

Jon says: *"Add reasoning behind why we are not hiring big teams — using AI for support lines, SDR functions and outreach, keeping costs down and efficiency high"*

**Add to AI & Technology slide (Slide 10):**
- New section: "AI-First Operations"
- ParkBunny uses AI across support (AI agents), sales development (automated outreach via b2bee.ai), and retailer acquisition
- Result: lean team of 5 delivers what traditionally requires 15–20 people
- This keeps burn rate low and capital efficiency high — more runway per £ invested

---

### 5. Partners — Major Overhaul

**Remove:**
- Smart Parking
- YourParkingSpace

**Add:**
- Intelli-Park
- Anchor Group
- ParkBee
- Group Nexus
- Wise Parking
- Britannia Parking

**Keep:**
- Savills
- Euro Car Parks
- LCP
- Agena Group
- NSL
- Newpark

**Result:** 12 partners total (up from 9)

Jon also says: **"Add brand logos"** — Need actual logo files for: Intelli-Park, Anchor Group, Wise Parking, Britannia Parking, Savills, Euro Car Parks, LCP, Agena Group, Newpark.

**Already have logos in `/public`:**
- `parkbee-logo.png`
- `groupnexus.jpeg`
- `nsl-logo.svg`

> [!WARNING]
> **Blocker: Missing logos.** Need logo files for 9 partners. Options:
> 1. Source from partner websites (download & convert)
> 2. Use text-only initially, add logos when provided
> 3. Generate placeholder logos

---

### 6. Team Headshots

Jon says: *"Headshots are on the deck I sent you over"*

The original PDF (`ParkBunny-Investor-Deck-V6-JANUARY26.pdf`) contains headshot images. These need to be extracted from the PDF and saved to `/public/team/`.

**Team members needing headshots:**
- Jon Sprank
- Chris Smith
- Russell Grigg
- Mark Cushing
- Ana Elena González

---

### 7. More Branding Throughout

Jon says: *"Needs more Branding Throughout with some of our original business plan graphics"*

**Actions:**
- Extract key graphics from the original PDF (car park imagery, app screenshots, mascot/logo variants)
- Add ParkBunny mascot (rabbit) to key slides — currently available as `rabbit.webp`
- Use branded imagery on the cover, solution, and closing slides
- Add existing images like `dashboard.webp`, `mockup.png`, `selfservicecarwash.webp`, `lockerphoto.webp`, `signage.jpg` to relevant slides

---

## Implementation Plan

### Phase 1: Data & Content Updates
**File:** `src/lib/investor-data.ts`

- [ ] Update `HERO`: raise to £400k, remove alternative ask
- [ ] Update `TRACTION`: liveSites to "50+"
- [ ] Update `INVESTMENT`: amount to £400k, update equity/valuation
- [ ] Rewrite `SOLUTION_DRIVERS` / `SOLUTION_OPERATORS` with hyperlocal messaging
- [ ] Rewrite `ADDITIONAL_STREAMS` descriptions (car park owner framing)
- [ ] Update `PARTNERS` array: remove 2, add 6, add logo paths
- [ ] Add new `REVENUE_SIMPLIFIED` data object with Jon's model
- [ ] Add `AI_OPERATIONS` data for lean team messaging

### Phase 2: Component Updates
**File:** `src/app/investordeck/InvestorDeck.tsx`

- [ ] Merge Revenue Model + Path to £1M into one simplified slide
- [ ] Add AI-First Operations section to the AI & Technology slide
- [ ] Update Partner slide to show logos (where available) + text fallback
- [ ] Replace team initials with headshot images (with initials fallback)
- [ ] Add branded imagery throughout (rabbit, dashboard, car wash, lockers, etc.)
- [ ] Add hyperlocal messaging to Business Activation slide
- [ ] Adjust total slide count (15 → 14 after merge, or redistribute)

### Phase 3: Asset Extraction & Integration
- [ ] Extract headshots from PDF (5 images)
- [ ] Source or download missing partner logos (9 needed)
- [ ] Add all assets to `/public/team/` and `/public/partners/`

### Phase 4: Verification
- [ ] `npm run build` — zero errors
- [ ] Browser test — all slides render correctly
- [ ] Verify all new messaging reads correctly
- [ ] Push to GitHub

---

## Open Questions for Jon

1. **Valuation:** £4M or £5M pre-money? (Document has both)
2. **Equity %:** At £400k on £5M pre, that would be ~7.4%. What % to show?
3. **Missing partner logos:** Can Jon provide logo files, or should we source from websites?
4. **Headshots:** Are these the exact 5 team members, or has the team changed?
5. **Film Production:** Keep or remove from Additional Revenue? (Our review flagged it as diluting focus)
6. **Breakeven overhead:** Is it still £14.5k/month or updated to £18k? (Doc says "£18k per month run rate")
