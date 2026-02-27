# iPhone Frame + ECP Branding Overhaul

CEO feedback: the demo flow is great but needs (1) an iPhone device frame on desktop so stakeholders instantly see it's an app, and (2) stronger ECP blue/yellow branding throughout.

---

## Proposed Changes

### iPhone Frame Wrapper

#### [NEW] `src/app/demo/[slug]/components/PhoneFrame.tsx`

A CSS-only iPhone 15 Pro device frame that wraps the demo content on desktop. Key specs:

- **Frame dimensions**: 393 × 852px viewport (iPhone 15 Pro logical size), with the bezel adding ~16px each side, rounded corners (50px radius), and a Dynamic Island notch
- **Desktop**: Centred on screen within a branded background. The background shows ECP branding — gradient from `#003399` to `#001a4d` with subtle pattern/logo
- **Mobile** (`@media max-width: 768px`): Frame disappears entirely, demo goes full-bleed. The `PhoneFrame` becomes a passthrough wrapper
- **CSS-only** — no images needed. The notch, bezels, and buttons are drawn with CSS `::before` / `::after` pseudo-elements and border-radius
- **Internal scrolling**: The demo content scrolls within the phone viewport via `overflow-y: auto` on the inner container, creating an authentic app feel
- **Status bar**: A fake iOS status bar showing time, signal, wifi, battery at the top of the phone screen

---

#### [MODIFY] `src/app/demo/[slug]/ClientDemo.tsx`

Wrap the existing demo output in `<PhoneFrame>`:

```diff
+ import PhoneFrame from './components/PhoneFrame'

  return (
+   <PhoneFrame config={config}>
      <div className="relative min-h-screen overflow-hidden" ...>
        {/* existing content unchanged */}
      </div>
+   </PhoneFrame>
  )
```

The `min-h-screen` on the inner div changes to `min-h-full` since the phone frame controls height.

---

### ECP Branding Overhaul

#### [MODIFY] `src/lib/demo-configs/ecp-parkbuddy.json`

Shift the colour palette to emphasise the corporate Euro Car Parks identity:

| Field | Current | New |
|-------|---------|-----|
| `colors.primary` | `#36C5FD` (light blue) | `#003399` (ECP corporate blue) |
| `colors.secondary` | `#003399` | `#001a4d` (deeper blue for gradients) |
| `colors.accent` | `#FFCC00` | `#FFCC00` (unchanged — ECP yellow) |
| `colors.background` | `#f8fafc` | `#f0f4ff` (light blue tint) |
| `colors.cardBg` | `rgba(255,255,255,0.85)` | `rgba(255,255,255,0.92)` |

Add a new `colors.cta` field set to `#FFCC00` for yellow CTA buttons with dark text.

#### [MODIFY] `src/lib/demo-configs/types.ts`

Add `cta: string` to the colors type.

#### [MODIFY] `src/app/demo/[slug]/components/LandingScreen.tsx`

- ECP ParkBuddy logo: increase size from `h-8` to `h-10`, remove invert filter (use original logo on dark background)
- ParkBunny: reduce to `h-5` with "powered by" text
- "Find Parking" button: use yellow `colors.cta` background with dark text instead of blue
- "ParkBunny Rewards Available" badge → "ECP ParkBuddy Rewards Available"
- Heading "Get rewarded." colour → use `colors.accent` (yellow) instead of `colors.primary`

#### [MODIFY] `src/app/demo/[slug]/components/CarParkScreen.tsx`

- Header: larger ECP logo, "powered by ParkBunny" smaller
- "Start Parking" CTA → yellow background (`colors.cta`) with dark text
- Price display colour → `colors.primary` (now corporate blue)
- Rewards badge → ECP-branded copy

#### [MODIFY] `src/app/demo/[slug]/components/PaymentScreen.tsx`

- "Pay £X.XX" button: use ECP yellow for non-Apple Pay option
- Header accent colour → corporate blue

#### [MODIFY] `src/app/demo/[slug]/components/SuccessScreen.tsx`

- "View Rewards" CTA → yellow with dark text

#### [MODIFY] `src/app/demo/[slug]/components/DealsScreen.tsx`

- Active category filter pill → corporate blue (already `colors.primary`)
- "saved" badge → yellow accent

#### [MODIFY] `src/app/demo/[slug]/components/RedemptionScreen.tsx`

- "Save to Wallet" CTA → yellow with dark text

#### [MODIFY] `src/app/demo/[slug]/components/PartnerScreen.tsx`

- Revenue headline gradient → corporate blue to deep blue
- "PARTNER VIEW" badge → ECP yellow background with dark text

#### [MODIFY] `src/app/demo/[slug]/components/DemoNav.tsx`

- Partner toggle button gradient → use corporate blue
- Progress bar → ECP yellow

---

## Files Summary

| Action | File | Change |
|--------|------|--------|
| **NEW** | `components/PhoneFrame.tsx` | iPhone 15 Pro CSS frame + desktop background |
| **MODIFY** | `ClientDemo.tsx` | Wrap in PhoneFrame, adjust min-h |
| **MODIFY** | `ecp-parkbuddy.json` | Shift colours to corporate blue/yellow |
| **MODIFY** | `types.ts` | Add `cta` colour field |
| **MODIFY** | `LandingScreen.tsx` | Bigger logo, yellow CTAs, branding copy |
| **MODIFY** | `CarParkScreen.tsx` | Yellow CTA, branding updates |
| **MODIFY** | `PaymentScreen.tsx` | Yellow CTA |
| **MODIFY** | `SuccessScreen.tsx` | Yellow CTA |
| **MODIFY** | `DealsScreen.tsx` | Minor colour tweaks |
| **MODIFY** | `RedemptionScreen.tsx` | Yellow CTA |
| **MODIFY** | `PartnerScreen.tsx` | Branding colour shift |
| **MODIFY** | `DemoNav.tsx` | Yellow progress bar |

**1 new file, 11 modifications.**

---

## Verification Plan

### Build Test
```bash
cd /Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny && npm run build
```

### Browser Tests (Dev Server)
```bash
npm run dev
# → http://localhost:3000/demo/ecp-parkbuddy
```

**Test 1 — Desktop iPhone Frame**
1. Open `http://localhost:3000/demo/ecp-parkbuddy` at 1440px viewport width
2. Verify: iPhone 15 Pro frame visible, centred on screen
3. Verify: Branded background behind the phone (dark blue gradient)
4. Verify: Dynamic Island notch at top of phone
5. Verify: Demo content scrolls within the phone viewport

**Test 2 — Mobile Full-Screen**
1. Resize viewport to 375px width (or use Chrome DevTools mobile emulation)
2. Verify: No iPhone frame — demo fills the entire screen
3. Verify: All buttons remain touch-friendly (min 44px tap targets)

**Test 3 — ECP Branding**
1. Verify: ECP ParkBuddy logo is large and prominent in the header
2. Verify: "Find Parking" button is yellow with dark text
3. Verify: "Start Parking", "Pay", "View Rewards", "Save to Wallet" CTAs are all yellow
4. Verify: Corporate blue (#003399) is the dominant colour throughout
5. Verify: "PARTNER VIEW" badge uses yellow background

**Test 4 — Full Journey Still Works**
1. Complete the full 7-screen journey within the iPhone frame
2. Verify all transitions, payment sim, deals, and partner view still function correctly
