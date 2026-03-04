# Fix Landing Screen Layout — Comprehensive Plan

## Root Cause Analysis

After reviewing all 4 files, here's what's broken and why:

### Problem 1: Search bar too low (outside phone screen)
**Cause:** `LandingScreen` uses `paddingBottom: '120px'` on the content div. But that 120px is calculated wrong — the DemoNav (tab bar `bottom: 0` with `padding: 6px 8px 24px` ≈ 62px) plus ECP strip (`bottom: 72px`, ~40px tall = top at ~112px from bottom). The search bar sits at the 120px mark — right ON the ECP strip, not above it.

**Fix:** Remove magic pixel padding. Instead, give the bottom group an explicit `margin-bottom` matching the combined height of the nav elements (ECP strip top ≈ 112px + 8px breathing = ~120px margin-bottom on the search bar div itself). But also keep the outer container padding minimal so `justify-between` works as expected.

### Problem 2: Mobile completely broken
**Cause:** On mobile (`<768px`), `PhoneFrame` renders children in `.phone-frame-mobile` which is just `<div>{children}</div>` — a basic block div with NO height set. `ClientDemo` wraps content with `height: '100%'` which resolves to 0 on a block div with no parent height. The `DemoNav`'s `position: absolute` also fails because `.phone-frame-mobile` has no `position: relative` or height.

**Fix:** `.phone-frame-mobile` needs `position: relative; min-height: 100vh` (or `100dvh`) to serve as the positioning parent for `DemoNav` and give the content proper height.

### Problem 3: Nav area measurements are fragile
**Cause:** Tab bar padding `6px 8px 24px`, ECP strip at `bottom: 72px` — all magic numbers. The total nav footprint is approximately:
- Tab bar: 62px (6px top pad + ~32px icons/text + 24px bottom pad)  
- ECP strip: 40px (8px×2 pad + 24px logo)
- Total from bottom: ~102px

But the LandingScreen uses 120px, and counting differs across breakpoints.

**Fix:** Use a single CSS custom property `--nav-height` set to the measured height, and reference it everywhere. Or simpler: just set the search bar's `margin-bottom` to a value that works.

---

## Proposed Changes

### 1. PhoneFrame — Fix mobile container

#### [MODIFY] `PhoneFrame.tsx`
```diff
- <div className="phone-frame-mobile">
+ <div className="phone-frame-mobile" style={{ position: 'relative', minHeight: '100dvh' }}>
```

This gives mobile a proper height and positioning context for absolute children.

---

### 2. LandingScreen — Simpler layout, no magic padding

#### [MODIFY] `LandingScreen.tsx`
- Remove `paddingBottom: '120px'` from the outer content div
- Change from `justify-between` to `justify-start` 
- Put top content (logo, heading, tagline, co-branding) in one group at the top
- Put search bar AFTER with `margin-top: auto` so it pushes to the bottom of available space
- Give the search bar `margin-bottom: 7.5rem` (mb-[120px]) directly so it sits above the nav

This means the layout is:
```
pt-12: top padding
[logo + heading + tagline + co-branding] — natural height
[spacer via mt-auto]
[search bar with mb-[120px]] — 120px above bottom
```

The search bar will sit in the lower portion of the screen but always 120px above the bottom — clearing the nav/strip regardless of screen height.

---

### 3. DemoNav — No changes needed
The current absolute positioning at `bottom: 0` (tab bar) and `bottom: 72px` (ECP strip) works fine as long as the parent container has `position: relative` and proper height — which ClientDemo provides on desktop and the fixed PhoneFrame.mobile will provide on mobile.

---

## Verification

### Manual (user):
1. **Desktop:** Reload `https://app.parkbunnyreports.com/demo/ecp-parkbuddy` — confirm search bar visible inside phone, above ECP strip, map pin visible in gap
2. **Mobile:** Open same URL on phone or resize browser to < 768px — confirm full-bleed layout works with nav at bottom and search bar visible
