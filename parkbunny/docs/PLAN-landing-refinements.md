# Demo Landing Screen Refinements

4 targeted changes to the demo's landing screen and navigation.

---

## Proposed Changes

### 1. Move Partner Toggle Outside Phone Frame

**Current:** Floating `Eye` button inside the phone screen (absolute positioned in `DemoNav.tsx`).
**Target:** Move it to the **desktop page** bottom-right corner, **outside** the iPhone bezel. On mobile, keep it accessible but outside the main app UI.

#### [MODIFY] `src/app/demo/[slug]/components/DemoNav.tsx`
- Remove the `.demo-partner-btn` from DemoNav entirely

#### [MODIFY] `src/app/demo/[slug]/components/PhoneFrame.tsx`
- Add the partner toggle button to the **desktop branded background** area (bottom-right of viewport)
- Pass `onTogglePartner` callback through to PhoneFrame

#### [MODIFY] `src/app/demo/[slug]/ClientDemo.tsx`
- Pass `onTogglePartner` prop to PhoneFrame

---

### 2. Euro Car Parks Branding Strip Above Nav

**Target:** A slim horizontal strip **above the tab bar** inside the phone showing the Euro Car Parks logo from `https://handheldapi.eurocarparks.com/Content/wp_content/themes/eurocarparks/images/logo.gif`

#### [MODIFY] `src/app/demo/[slug]/components/DemoNav.tsx`
- Add a branding strip `div` above the tab buttons
- Contains the ECP logo (centred, small) with subtle background
- We'll download the logo to `/public/ecp-logo.gif` first for reliability

---

### 3. Remove "ECP ParkBuddy Rewards" Badge

#### [MODIFY] `src/app/demo/[slug]/components/LandingScreen.tsx`
- Delete the `<div>` containing `<Sparkles>` icon and "ECP ParkBuddy Rewards" text (lines 51-61)
- Remove `Sparkles` from lucide-react import

---

### 4. Move Heading Text Higher

**Current:** Heading sits in the vertical centre which overlaps the map pin marker.
**Target:** Shift content block towards the **top** of the screen so the heading sits above the pin.

#### [MODIFY] `src/app/demo/[slug]/components/LandingScreen.tsx`
- Content container: change `justify-center` → `justify-start` with `pt-8` top padding
- This pushes "Park. Pay. Get rewarded." and the tagline above the map pin area
- Search bar stays below the text, clear of the marker

---

## Files Summary

| File | Changes |
|------|---------|
| `LandingScreen.tsx` | Remove badge, shift text up |
| `DemoNav.tsx` | Remove partner button, add ECP branding strip |
| `PhoneFrame.tsx` | Add partner toggle to desktop background |
| `ClientDemo.tsx` | Pass onTogglePartner to PhoneFrame |

**0 new files, 4 modifications + 1 asset download.**

---

## Verification

```bash
npm run build
```
Visual check at `/demo/ecp-parkbuddy` — confirm:
1. Partner toggle visible outside phone frame (desktop bottom-right)
2. ECP logo strip visible above tab nav inside phone
3. No "ECP ParkBuddy Rewards" badge on landing
4. Heading text sits higher, clear of map pin
