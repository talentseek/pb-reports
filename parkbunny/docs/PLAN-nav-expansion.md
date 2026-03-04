# PLAN: Dashboard Navigation Expansion (v2 — Updated)

> Add **Bespoke Reports** and **App Demos** sections to the main nav, with full CRUD for demos backed by Prisma/PostgreSQL.

---

## Auth Architecture (Current State)

| Layer | How it works |
|-------|-------------|
| **Clerk Middleware** | `clerkMiddleware()` runs on ALL routes (`/(.*)`) — it makes auth info _available_ but does NOT block unauthenticated users |
| **Route-level protection** | None. No `auth().protect()` calls anywhere. All routes are publicly accessible |
| **Bespoke reports** | Public routes with client-side password gates (`useState` + hardcoded password) |
| **App demos** | Public routes with per-config password gates (password in JSON config) |
| **AppHeader** | Hidden on `/share`, `/investordeck`, `/jollysailor`, `/demo` — these are "external-facing" pages |

> [!IMPORTANT]
> **Bespoke reports and demos are PUBLIC by design** — they're shared with external clients who don't have Clerk accounts. The password gates are client-side only. Our new `/bespoke` and `/demos` listing pages will be **internal only** (behind Clerk auth).

---

## Bespoke Report Passwords (Extracted)

| Report | Route | Password | Source |
|--------|-------|----------|--------|
| Buzz Bingo | `/buzzbingoproposal` | `nexusbuzz2026` | `ClientProposal.tsx:17` |
| NSL | `/nslproposal` | `nslpb2026` | `ClientProposal.tsx:17` |
| ParkBee | `/parkbeeproposal` | `parkbeepb2026` | `ClientProposal.tsx:17` |
| Nexus Locker | `/nexuslockerproposal` | `nexuspb2026` | `ClientProposal.tsx:25` |
| Jolly Sailor | `/jollysailor` | `jollysailor2026` | `jollysailor-data.ts:4` |
| Investor Deck | `/investordeck` | `parkbunny2026` | `investor-data.ts:25` |

These passwords will be displayed on each card on the Bespoke Reports listing page.

---

## Demo Passwords (Current)

| Demo | Route | Password | Source |
|------|-------|----------|--------|
| ECP ParkBuddy | `/demo/ecp-parkbuddy` | `ecpparkbuddy2026` | `ecp-parkbuddy.json` |
| Intelli-Park | `/demo/intelli-park` | `intllipark2026` | `intelli-park.json` |

---

## Database Safety

> [!CAUTION]
> The production DB contains live data across all existing models. We are **only adding a NEW table** (`AppDemo`). We will:
> - Use `prisma migrate dev` locally first to verify
> - Use `prisma migrate deploy` on production (additive-only, no schema changes to existing tables)
> - **Never** modify or delete data in existing tables
> - Seed data only into the new `AppDemo` table

---

## Phase 1: AppHeader — Add 2 Nav Links

### [MODIFY] `src/components/AppHeader.tsx`
Add between "Outreach" and "Help & Guide":
- **Bespoke Reports** → `/bespoke`
- **App Demos** → `/demos`

Active state: `pathname?.startsWith('/bespoke')` / `pathname?.startsWith('/demos')`

---

## Phase 2: Bespoke Reports Directory

### [NEW] `src/app/bespoke/page.tsx`
- Protected by Clerk (redirect to sign-in if not authenticated)
- Grid of cards, each showing:
  - Client name + logo
  - Brief description
  - **Password** (shown in a copy-able field so you can share it)
  - Link button to the report URL
  - External link icon (opens in new tab)

**Hardcoded data** (no database needed):
```ts
const BESPOKE_REPORTS = [
  { name: 'Buzz Bingo Portfolio', route: '/buzzbingoproposal', password: 'nexusbuzz2026', description: '23-site multi-stream revenue proposal', logo: '/buzzbingo.png' },
  { name: 'NSL Proposal', route: '/nslproposal', password: 'nslpb2026', description: 'NSL parking management proposal', logo: '/nsl-logo.png' },
  { name: 'ParkBee Proposal', route: '/parkbeeproposal', password: 'parkbeepb2026', description: 'ParkBee partnership proposal', logo: null },
  { name: 'Nexus Locker', route: '/nexuslockerproposal', password: 'nexuspb2026', description: 'Smart locker deployment plan', logo: '/groupnexus.jpeg' },
  { name: 'Jolly Sailor', route: '/jollysailor', password: 'jollysailor2026', description: 'Jolly Sailor marina report', logo: null },
  { name: 'Investor Deck', route: '/investordeck', password: 'parkbunny2026', description: 'ParkBunny investor presentation', logo: '/logo.png' },
]
```

---

## Phase 3: Database — `AppDemo` Model

### [MODIFY] `prisma/schema.prisma`
Add at the end (no changes to existing models):

```prisma
model AppDemo {
  id        String   @id @default(cuid())
  slug      String   @unique
  password  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Operator
  operatorName    String
  operatorTagline String
  operatorLogo    String
  operatorLogoAlt String?
  operatorFont    String   @default("Arial, sans-serif")

  // Brand Strip (optional)
  brandStripLogo       String?
  brandStripAlt        String?
  brandStripBackground String?

  // Colours
  colorPrimary    String
  colorSecondary  String
  colorAccent     String
  colorBackground String @default("#f0f4ff")
  colorText       String @default("#0f172a")
  colorCardBg     String @default("rgba(255,255,255,0.92)")
  colorCta        String

  // Location
  locationName     String
  locationAddress  String
  locationPostcode String
  locationPhone    String @default("")
  locationCode     String @default("")
  locationCity     String
  totalSpaces      Int
  hourlyRate       Float
  lat              Float?
  lng              Float?

  // Complex data as JSON
  deals       Json @default("[]")
  partnerView Json @default("{}")
}
```

### Migration
```bash
npx prisma migrate dev --name add-app-demo
```

---

## Phase 4: Seed Existing Demos

### [NEW] `prisma/seed-demos.ts`
Script to insert ECP ParkBuddy and Intelli-Park configs into the `AppDemo` table. Run once after migration.

Data sourced directly from the existing JSON files:
- `src/lib/demo-configs/ecp-parkbuddy.json`
- `src/lib/demo-configs/intelli-park.json`

---

## Phase 5: API Routes (Clerk Protected)

### [NEW] `src/app/api/demos/route.ts`
- **GET** — list all demos (id, slug, operatorName, operatorLogo, locationCity, locationPostcode, totalSpaces, password, createdAt)
- **POST** — create new demo (auto-generate slug from operator name)
- Both protected: `auth().protect()`

### [NEW] `src/app/api/demos/[id]/route.ts`
- **GET** — full demo config by ID
- **PUT** — update demo
- **DELETE** — delete demo
- All protected: `auth().protect()`

---

## Phase 6: Demos Listing Page

### [NEW] `src/app/demos/page.tsx`
- Protected by Clerk
- Fetches demos from API
- Card per demo showing: name, logo, city, postcode, spaces, password
- Link to `/demo/{slug}` for each
- **"Create New Demo"** button → `/demos/new`
- Edit/Delete buttons on each card

---

## Phase 7: Create / Edit Demo Forms

### [NEW] `src/app/demos/new/page.tsx`
Full form with tabbed/accordion sections:
1. **Operator** — name, tagline, logo URL, font
2. **Colours** — primary, secondary, accent, CTA (with colour pickers)
3. **Brand Strip** — toggle on/off, logo URL, alt, background colour
4. **Location** — name, address, postcode, city, total spaces, hourly rate (lat/lng auto-geocoded from postcode)
5. **Password** — access code
6. **Deals** — dynamic array builder (add/remove deals)
7. **Partner View** — stats fields

### [NEW] `src/app/demos/[id]/edit/page.tsx`
Same form, pre-filled from GET `/api/demos/[id]`. On save → PUT → redirect to listing.

---

## Phase 8: Connect Demo Renderer to Database

### [MODIFY] `src/app/demo/[slug]/page.tsx`
Change from JSON import to Prisma query:
```ts
// Before
const config = getDemoConfig(params.slug)

// After
const demo = await prisma.appDemo.findUnique({ where: { slug: params.slug } })
const config = transformToConfig(demo)
```

### [NEW] `src/lib/demo-transform.ts`
Transforms Prisma `AppDemo` row → `DemoConfig` TypeScript type. All downstream components (`ClientDemo`, `LandingScreen`, `DemoNav` etc.) receive the same shape — **zero changes needed**.

### JSON files kept as backup
`src/lib/demo-configs/` stays until DB is confirmed stable. Then can be removed.

---

## File Summary

| # | Action | File | Purpose |
|---|--------|------|---------|
| 1 | MODIFY | `AppHeader.tsx` | 2 new nav links |
| 2 | NEW | `src/app/bespoke/page.tsx` | Bespoke reports directory |
| 3 | MODIFY | `prisma/schema.prisma` | Add `AppDemo` model (additive only) |
| 4 | NEW | `prisma/seed-demos.ts` | Seed ECP + Intelli-Park |
| 5 | NEW | `src/app/api/demos/route.ts` | List + Create API |
| 6 | NEW | `src/app/api/demos/[id]/route.ts` | Get + Update + Delete API |
| 7 | NEW | `src/app/demos/page.tsx` | Demos listing |
| 8 | NEW | `src/app/demos/new/page.tsx` | Create demo form |
| 9 | NEW | `src/app/demos/[id]/edit/page.tsx` | Edit demo form |
| 10 | MODIFY | `src/app/demo/[slug]/page.tsx` | Read from DB |
| 11 | NEW | `src/lib/demo-transform.ts` | DB → DemoConfig transformer |

---

## Verification

### Build
```bash
npm run build
```

### Migration (local only first)
```bash
npx prisma migrate dev --name add-app-demo
npx ts-node prisma/seed-demos.ts
```

### Manual Browser Checks
1. Sign in → verify 2 new nav links appear
2. `/bespoke` → verify 6 cards with passwords visible
3. Click card → opens report in new tab → password from card works
4. `/demos` → verify ECP + Intelli-Park cards
5. "Create New Demo" → fill form → submit → appears in listing
6. Edit demo → change a colour → save → verify persists
7. Delete demo → verify removed
8. `/demo/{slug}` → password gate → full demo works
9. Sign out → `/bespoke` and `/demos` redirect to sign-in
10. `/buzzbingoproposal` still loads without sign-in (public)
11. `/demo/ecp-parkbuddy` still loads without sign-in (public)
