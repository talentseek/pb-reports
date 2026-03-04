# Fix Mobile Layout — Comprehensive Plan

## Root Cause Analysis (with screenshots)

### Desktop ✅ Working
Desktop layout inside the phone frame is correct:
- Heading at top, map pin visible in centre gap, search bar above ECP strip
- ECP strip fully visible, tab nav clean

### Mobile ❌ Three issues

**Issue 1: Site header showing on demo pages**
`AppHeader` (line 10) hides on `/share`, `/investordeck`, `/jollysailor` but NOT `/demo`. On desktop this is hidden behind the phone frame background. On mobile it takes up ~80px at top, pushing all demo content down.

**Issue 2: Height chain broken on mobile**
`.phone-frame-mobile` has `min-height: 100dvh` but NOT `height`. CSS rule: `height: 100%` on child elements does NOT inherit from `min-height`. So:
```
.phone-frame-mobile { min-height: 100dvh } ← parent has min-height only
  └─ ClientDemo wrapper { height: 100% }    ← resolves to 0
      └─ Content { height: 100% }           ← resolves to 0
          └─ LandingScreen { height: 100% } ← resolves to 0
```
Map, search bar, and nav all collapse.

**Issue 3: DemoNav absolute positioning floats mid-screen**
DemoNav uses `position: absolute; bottom: 0` but the parent's height is 0 (see above), so it positions relative to the nearest ancestor with actual height — the viewport. Combined with the squashed content, the nav appears mid-screen.

---

## Proposed Changes

### 1. Hide AppHeader on demo pages

#### [MODIFY] `src/components/AppHeader.tsx` (line 10)
Add `/demo` to the early-return check:
```diff
- if (pathname?.startsWith('/share') || pathname?.startsWith('/investordeck') || pathname?.startsWith('/jollysailor')) return null
+ if (pathname?.startsWith('/share') || pathname?.startsWith('/investordeck') || pathname?.startsWith('/jollysailor') || pathname?.startsWith('/demo')) return null
```

### 2. Fix mobile container height

#### [MODIFY] `src/app/demo/[slug]/components/PhoneFrame.tsx` (line 82)
Change `min-height` to `height` so children's `height: 100%` resolves properly:
```diff
- <div className="phone-frame-mobile" style={{ position: 'relative', minHeight: '100dvh' }}>
+ <div className="phone-frame-mobile" style={{ position: 'relative', height: '100dvh', overflow: 'hidden' }}>
```

### 3. Reduce search bar margin on mobile

#### [MODIFY] `src/app/demo/[slug]/components/LandingScreen.tsx` (line 81)
The current `marginBottom: 120px` accounts for the desktop phone's border-radius eating into space. On mobile there is no border-radius, so the nav area is smaller. Use a responsive approach:
```diff
- <div className="mt-auto w-full max-w-xs mx-auto" style={{ marginBottom: '120px' }}>
+ <div className="mt-auto w-full max-w-xs mx-auto mb-[100px] md:mb-[120px]">
```
- Mobile: `100px` (just clears ECP strip + tab bar without border-radius padding)
- Desktop: `120px` (clears ECP strip + tab bar + phone border-radius)

---

## Verification

### Browser check (manual by user)
1. Reload desktop view — confirm no regression
2. Resize to 390×844 — confirm:
   - No site header visible
   - Map fills screen
   - Heading at top, search bar above nav
   - ECP strip + tab bar pinned to bottom
   - No white space below nav
