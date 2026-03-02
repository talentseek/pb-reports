# Demo UI Polish — iPhone Frame Fixes

From user screenshot review, 4 issues identified inside the iPhone frame viewport (393×852px).

---

## Proposed Changes

### Issue 1: ParkBunny Logo Invisible on Landing

**Root cause:** `opacity-60` + `brightness-0 invert` on a tiny `h-4` image against the dark map. At 393px width, the "powered by" text at `text-[10px]` is nearly invisible.

#### [MODIFY] `src/app/demo/[slug]/components/LandingScreen.tsx`

- Move ParkBunny branding **below the main heading** instead of cramming it into the header alongside ECP
- Replace tiny header "powered by" with a more visible co-branding strip below the tagline: `ECP ParkBuddy × ParkBunny` or a visible ParkBunny logo at reasonable size
- Increase `opacity` from `0.60` to `1.0` and use a white logo on the dark background
- Add to header: just the ECP ParkBuddy logo (centred, clean)

---

### Issue 2: No In-App Navigation

**Root cause:** `DemoNav` only shows a 1px progress bar during the linear journey (`!journeyComplete`), and the bottom tab bar only appears after all 7 steps are completed. During the linear flow, there's literally no navigation affordance.

#### [MODIFY] `src/app/demo/[slug]/components/DemoNav.tsx`

**Replace the current system with an always-visible bottom tab bar:**

- Show a simplified 4-tab bar at all times: **Find** (step 1), **Park** (step 2), **Pay** (step 3), **Deals** (step 5)
- Tabs up to `highestStep` are tappable; tabs beyond are greyed/locked
- Active tab gets a highlight dot or colour indicator
- The progress bar at the top is removed — the tabs themselves show progress
- The floating Partner View eye button remains but repositions above the tab bar
- This gives users a way to navigate back at any point in the journey

**Tab visibility during linear journey:**
- Steps are clickable up to `highestStep` (steps already visited)
- Steps beyond `highestStep` show as locked (greyed out, no click)

---

### Issue 3: Cramped Spacing

**Root cause:** Content uses `px-6` (24px) side padding inside a 393px phone viewport, leaving only 345px of content width. Heading text `text-4xl` wraps badly. The `pb-32` pushes content up too much.

#### [MODIFY] `src/app/demo/[slug]/components/LandingScreen.tsx`

- Reduce side padding from `px-6` to `px-4` on the content area
- Reduce heading from `text-4xl` to `text-3xl` for better fit at phone width
- Change `pb-32` to `pb-20` — less aggressive bottom padding since we'll have a tab bar there
- Add more `gap` / `mb` between badge, heading, tagline, and search bar

#### [MODIFY] `src/app/demo/[slug]/components/CarParkScreen.tsx`
- Header padding `px-6` → `px-4`
- Content padding `px-6` → `px-4`

#### [MODIFY] `src/app/demo/[slug]/components/PaymentScreen.tsx`
- Content padding `px-6` → `px-4`

#### [MODIFY] `src/app/demo/[slug]/components/SuccessScreen.tsx`
- Content padding `px-6` → `px-4`

#### [MODIFY] `src/app/demo/[slug]/components/DealsScreen.tsx`
- Content padding `px-6` → `px-4`

#### [MODIFY] `src/app/demo/[slug]/components/RedemptionScreen.tsx`
- Content padding `px-6` → `px-4`

#### [MODIFY] `src/app/demo/[slug]/components/PartnerScreen.tsx`
- Content padding `px-6` → `px-4`

---

### Issue 4: Location Text Wrapping in Search Bar

**Root cause:** The search bar renders `Mayfair, London — W1K 1AB` as a full string next to the "Find Parking" button. At 393px width, this wraps across 4 lines.

#### [MODIFY] `src/app/demo/[slug]/components/LandingScreen.tsx`

- **Restructure the search bar to stack vertically**: location on top, button below (full width)
- Location text: just `Mayfair, W1K 1AB` (shorter — drop "London" which is redundant)
- Or split into two lines: `📍 Mayfair · W1K 1AB` on one line
- The "Find Parking" CTA becomes a full-width button below the location display
- This prevents the horizontal squeeze entirely

---

## Files Summary

| Action | File | Change |
|--------|------|--------|
| MODIFY | `LandingScreen.tsx` | Logo visibility, spacing, search bar restructure |
| MODIFY | `DemoNav.tsx` | Always-visible bottom tabs replacing progress bar |
| MODIFY | `CarParkScreen.tsx` | Padding reduction |
| MODIFY | `PaymentScreen.tsx` | Padding reduction |
| MODIFY | `SuccessScreen.tsx` | Padding reduction |
| MODIFY | `DealsScreen.tsx` | Padding reduction |
| MODIFY | `RedemptionScreen.tsx` | Padding reduction |
| MODIFY | `PartnerScreen.tsx` | Padding reduction |
| MODIFY | `ClientDemo.tsx` | Ensure bottom padding for tab bar clearance |

**0 new files, 9 modifications.**

---

## Verification Plan

### Build Test
```bash
cd /Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny && npm run build
```

### Visual Test (Dev Server)
```bash
npm run dev
# → http://localhost:3000/demo/ecp-parkbuddy
```

1. Open in browser at ~1440px width → verify iPhone frame shows correctly
2. **Landing Screen:** ParkBunny logo visible, heading doesn't wrap badly, search bar doesn't overflow
3. **Navigation:** Bottom tab bar visible on landing, locked tabs greyed out, visited tabs clickable
4. **All Screens:** Check spacing isn't cramped at 393px phone width
5. **Partner View:** Still accessible via floating button
