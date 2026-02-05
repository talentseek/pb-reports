# PLAN: Local Offers Uplift for Buzz Bingo

## Goal
Add calculated Local Offers Uplift (20-50%) to the Buzz Bingo report, derived from Google Places data per site.

---

## Report Revenue Layers

| Layer | Source | Example (per site) |
|-------|--------|-------------------|
| **Baseline** | Current parking revenue | £50,000 |
| **Local Offers Uplift** | Google Places calculation | +£12,500-£25,000 (25-50%) |
| **Ancillary** | Lockers, Car Wash, EV | +£10,900+ |
| **Total** | Combined opportunity | £73,400-£85,900+ |

---

## Tasks

### 1. Update `buzzbingo-places.ts`
- [ ] Add `calculateLocalOffersUplift()` function
- [ ] Use existing `calculations.ts` formula: `count × signUp% × uplift%`
- [ ] Return uplift value AND uplift percentage per site
- [ ] Baseline = £50,000 per site

### 2. Update `ClientProposal.tsx` - Local Demand Section
- [ ] Replace "demand score" with **Projected Uplift £** and **Uplift %**
- [ ] Show per-site breakdown with uplift figures
- [ ] Add portfolio-wide Local Offers Uplift total

### 3. Update Summary Table
- [ ] Add "Local Offers Uplift" row showing aggregate uplift
- [ ] Show new Total = Baseline + Local Uplift + Ancillary

### 4. Portfolio Summary Cards
- [ ] Add total baseline (23 × £50k = £1.15M)
- [ ] Add total local offers uplift
- [ ] Keep existing ancillary totals

---

## Files to Modify

| File | Changes |
|------|---------|
| `buzzbingo-places.ts` | Add uplift calculation using standard formula |
| `ClientProposal.tsx` | Update Local Demand section UI, update Summary table |

---

## Verification

- [ ] Each site shows uplift % and £ value
- [ ] Portfolio summary shows total local offers uplift
- [ ] Summary table adds: Baseline + Local Uplift + Ancillary = Total
- [ ] Build passes with no errors
