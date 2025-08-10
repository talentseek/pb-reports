# ParkBunny – Local Business & Carpark Outreach System
## Proof of Concept (POC) & Offer

### 1. POC Scope & Goals

**Objective:**  
Create a web-based system where authenticated ParkBunny users can:

- Create a **Report** for one or more car parks.
- Enter **Report Name** and **Postcode(s)**.
- Generate a **Local Business Report** showing nearby businesses (mock data first).
- View reports inside the dashboard.
- Download report as PDF (optional in POC).
- Configure **uplift percentages** and business-type sign-up assumptions in a settings panel.

**Stage 1 Focus:**  
- No Unipile, FullEnrich, or outreach automation.
- Google Places API integration will come after the UI and mock data flow works.
- Clerk authentication in place from day one.

---

### 2. Tech Stack & Dependencies

**Core**  
- **Next.js 15** (App Router)  
- **TypeScript**  
- **Tailwind CSS**  
- **shadcn/ui** for components  
- **Clerk** for authentication  
- **PostgreSQL** for persistence  
- **Prisma ORM** for DB queries  
- **Zod** for schema validation  

**Install**  

```bash
# Core
npm install next@latest react@latest react-dom@latest typescript @types/node

# Styling & UI
npm install tailwindcss postcss autoprefixer @shadcn/ui clsx

# Auth
npm install @clerk/nextjs

# DB
npm install prisma @prisma/client

# Validation
npm install zod

# Dev tools
npm install -D prettier eslint
```

Initialize Tailwind:  
```bash
npx tailwindcss init -p
```

Initialize Prisma:  
```bash
npx prisma init
```

---

### 3. Architecture & File Structure

```plaintext
src/
  app/
    layout.tsx
    page.tsx
    dashboard/
      page.tsx
    reports/
      new/
        page.tsx
      [id]/
        page.tsx
    settings/
      page.tsx
  components/
    ui/                # shadcn components
    report/
      ReportForm.tsx
      ReportList.tsx
      ReportView.tsx
  lib/
    db.ts              # Prisma DB client
    mockData.ts        # Mock business data
    calculations.ts    # Logic for uplift calculations
  styles/
    globals.css
  middleware.ts        # Clerk middleware
prisma/
  schema.prisma
.env.local
```

---

### 4. Database Schema (SQL via Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String   @unique
  reports   Report[]
  createdAt DateTime @default(now())
}

model Report {
  id         String        @id @default(cuid())
  name       String
  postcodes  String[]
  businesses Business[]
  settings   Json
  createdAt  DateTime      @default(now())
  user       User?         @relation(fields: [userId], references: [id])
  userId     String?
}

model Business {
  id        String   @id @default(cuid())
  name      String
  category  String
  address   String
  website   String?
  mapsLink  String?
  report    Report?  @relation(fields: [reportId], references: [id])
  reportId  String?
}
```

---

### 5. Frontend Flow (Mock Data First)

#### **Dashboard Page (`/dashboard`)**
- Shows list of reports for logged-in user.
- Button: “Create New Report”.

#### **Create Report Page (`/reports/new`)**
- Form fields:
  - Report Name
  - Postcode(s) (comma-separated)
- On submit:
  - Save to DB.
  - Generate mock business data from `mockData.ts`.
  - Redirect to `/reports/[id]`.

#### **Report View Page (`/reports/[id]`)**
- Show:
  - Executive Overview (static example now)
  - Table of businesses (shadcn Table)
  - Revenue potential calculation (from settings)
- Button: “Download PDF” (future optional).

---

### 6. Settings & Calculation Logic

In `/lib/calculations.ts`:

```ts
export const defaultSettings = {
  upliftPercentages: {
    restaurants: 0.08,
    bars: 0.08,
    hotels: 0.05,
    coworking: 0.07,
    gyms: 0.06,
  },
  signUpRates: {
    restaurants: 0.2,
    bars: 0.15,
    hotels: 0.3,
    coworking: 0.5,
    gyms: 0.25,
  }
}

export function calculateRevenuePotential(businesses, settings = defaultSettings) {
  let totalUplift = 0;
  businesses.forEach(biz => {
    const uplift = settings.upliftPercentages[biz.category.toLowerCase()] || 0.05;
    totalUplift += uplift * 1000; // placeholder
  });
  return totalUplift;
}
```

Settings Panel (`/settings`):
- Editable percentages & sign-up rates.
- Stored in DB JSON field for each user.

---

### 7. API Endpoints (Stage 1)

```plaintext
POST /api/reports
  body: { name, postcodes }
  creates a report with mock data

GET /api/reports
  returns all reports for current user

GET /api/reports/[id]
  returns single report with businesses
```

Example `/api/reports/route.ts`:

```ts
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import mockBusinesses from "@/lib/mockData";

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const data = await req.json();
  const report = await prisma.report.create({
    data: {
      name: data.name,
      postcodes: data.postcodes,
      businesses: {
        create: mockBusinesses.map(b => ({
          name: b.name,
          category: b.category,
          address: b.address,
          website: b.website,
          mapsLink: b.mapsLink,
        }))
      },
      userId
    }
  });
  return Response.json(report);
}
```

---

### 8. Next Steps (Post-POC)

1. **Replace mock data with Google Places API results**:
   - Fetch businesses within 0.75 miles of postcode.
   - Store results in DB.
2. **Add PDF export** using `react-pdf` or server-side `pdfkit`.
3. **Automated Outreach**:
   - Integrate Unipile API.
   - Build outreach sequences.
4. **Advanced reporting**:
   - Charts with `recharts`.
   - ROI calculators.
