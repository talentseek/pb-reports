# Voice Agent Outreach Pipeline — Implementation Plan

> Build an AI Voice Agent ("Sarah") pipeline that calls businesses from the ParkBunny database using Twilio + Vapi.ai, qualifies leads via a gatekeeper pivot strategy, extracts decision-maker contact info, and tracks per-location outreach progress in the dashboard.

---

## Background

ParkBunny has **6,363 places** in its database with **87.6% phone coverage** from Google Places API (`nationalPhoneNumber`). The aim is to use an AI voice agent to call these businesses, pitch discounted parking, and extract decision-maker contact details — turning the voice agent into both an **outreach tool** and a **data enrichment pipeline**.

> [!WARNING]
> **LIVE locations only.** Voice outreach must only target businesses linked to `ReportLocation` records with `status = 'LIVE'`. Non-live locations represent car parks ParkBunny is still negotiating contracts for — calling businesses near those sites before the deal is closed would be premature and damaging. The `ReportLocation.status` enum (`PENDING` / `LIVE`) is the single source of truth for this filter.

### Existing Infrastructure (Reference Only)

The existing outreach pages (`/outreach`, `/outreach/campaigns`, etc.) are **demo scaffolds with mock data** — they are not a spec. The following existing files will be **rewritten or deleted**:

| Existing File | Disposition |
|---------------|-------------|
| `src/app/outreach/page.tsx` | **REWRITE** — Voice Outreach Hub |
| `src/app/outreach/[locationId]/page.tsx` | **KEEP** — Per-location business drill-down (useful as-is) |
| `src/app/outreach/[locationId]/[category]/page.tsx` | **KEEP** — Category drill-down (useful for campaign creation) |
| `src/app/outreach/campaigns/page.tsx` | **REWRITE** — Campaign listing |
| `src/app/outreach/campaigns/[campaignId]/page.tsx` | **REWRITE** — Campaign Control Room |
| `src/app/outreach/campaigns/[campaignId]/CampaignSteps.tsx` | **REWRITE** — Voice outreach workflow |
| `src/app/outreach/campaigns/[campaignId]/launch/page.tsx` | **DELETE** — Replaced by in-page calling controls |
| `src/app/outreach/inbox/page.tsx` | **KEEP** — Will be enhanced later for email follow-ups |
| `src/components/EnrichmentStep.tsx` | **KEEP** — Still used for Outscraper enrichment |
| `src/components/LaunchStep.tsx` | **DELETE** — Email launch replaced by voice calling |
| `src/components/ui/step-indicator.tsx` | **KEEP** — Reusable for new workflow steps |

### Current Schema (Key Models)

```
Campaign { id, name, businessType, postcode, status, businesses[] }
CampaignBusiness { id, campaignId, reportLocationPlaceId }
ReportLocationPlace { locationId, placeId, groupedCategory, included }
Place { placeId, name, phone, email, website, contactPeople, ... }
ReportLocation { reportId, postcode, status (PENDING/LIVE), latitude, longitude }
```

> [!IMPORTANT]
> **Gap: Campaign has no direct link to ReportLocation.** It stores `postcode` as a string but has no FK to `ReportLocation`. We need to add a `locationId` field so we can check the LIVE status and aggregate stats per location.

---

## Proposed Changes

### 1. Database Layer

#### [MODIFY] [schema.prisma](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/prisma/schema.prisma)

**1a. Add `locationId` FK to Campaign:**

```diff
 model Campaign {
   id           String            @id @default(cuid())
   name         String
   businessType String
   postcode     String
+  locationId   String
   status       CampaignStatus    @default(CREATED)
+  carparkName  String            @default("the car park")
   createdAt    DateTime          @default(now())
   updatedAt    DateTime          @updatedAt
   businesses   CampaignBusiness[]
+  location     ReportLocation    @relation(fields: [locationId], references: [id])
 }
```

Also add to `ReportLocation`:

```diff
 model ReportLocation {
   ...
   places            ReportLocationPlace[]
   streamExclusions  RevenueStreamExclusion[]
+  campaigns         Campaign[]
 }
```

**1b. Extend `CampaignBusiness` with call tracking:**

```diff
 model CampaignBusiness {
   id                    String               @id @default(cuid())
   campaignId            String
   reportLocationPlaceId String
   createdAt             DateTime             @default(now())
+  updatedAt             DateTime             @updatedAt
+
+  // Voice call tracking
+  vapiCallId            String?              @unique
+  callStatus            CallStatus           @default(PENDING)
+  callAttempts          Int                  @default(0)
+  lastCallAt            DateTime?
+  nextCallAt            DateTime?
+  callDuration          Int?                 // seconds
+  callSummary           String?
+  transcript            String?              @db.Text
+  recordingUrl          String?
+
+  // Extracted data from call
+  extractedName         String?
+  extractedEmail        String?
+  extractedPhone        String?
+  callbackTime          String?
+
   campaign              Campaign             @relation(fields: [campaignId], references: [id])
   reportLocationPlace   ReportLocationPlace  @relation(fields: [reportLocationPlaceId], references: [id])
   @@unique([campaignId, reportLocationPlaceId])
 }
```

**1c. Add `CallStatus` enum:**

```prisma
enum CallStatus {
  PENDING         // Not yet attempted
  QUEUED          // In the calling queue
  IN_PROGRESS     // Vapi is currently calling
  LEAD_CAPTURED   // Decision-maker info obtained
  CALLBACK_BOOKED // Gatekeeper gave callback time
  NOT_INTERESTED  // Politely declined
  VOICEMAIL       // Went to voicemail
  GATEKEEPER_BLOCKED // Refused to share info
  NO_ANSWER       // Phone rang, no pickup
  INVALID_NUMBER  // Phone number couldn't be parsed/dialled
  FAILED          // Technical failure
  CTPS_BLOCKED    // On CTPS register, cannot call
}
```

**1d. Extend `CampaignStatus` enum:**

```diff
 enum CampaignStatus {
   CREATED
   ENRICHING
   ENRICHED
   READY_TO_LAUNCH
   LAUNCHED
+  CALLING
+  PAUSED
+  COMPLETED
 }
```

**1e. Add `VoiceConfig` model (global Twilio/Vapi settings):**

```prisma
model VoiceConfig {
  id              String   @id @default(cuid())
  twilioSid       String
  twilioAuthToken String   // Stored encrypted or via env var reference
  vapiApiKey      String
  vapiAssistantId String
  vapiPhoneNumId  String
  callingEnabled  Boolean  @default(false)
  maxConcurrent   Int      @default(1)
  maxAttempts     Int      @default(3)
  webhookSecret   String?  // For verifying Vapi webhook signatures
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

> [!NOTE]
> `carparkName` is on the **Campaign** model (not VoiceConfig) because different car parks have different names. When creating a campaign for a location, the user sets the car park name that Sarah will use in her pitch.

---

### 2. Shared Logic

#### [NEW] `src/lib/voice-agent.ts`

Core Vapi integration and calling utilities:

| Function | Description |
|----------|-------------|
| `formatPhoneE164(phone: string): string \| null` | Converts UK national numbers (e.g. `0113 819 4900`) to E.164 (`+441138194900`) using `libphonenumber-js`. Returns `null` if unparseable. |
| `isWithinCallingWindow(): boolean` | Returns `true` if current UK time is **10:00–11:30** or **14:30–16:30** (Mon–Fri only). |
| `dispatchCall(cb: CampaignBusiness, carparkName: string): Promise<string>` | Sends a Vapi outbound call request with `assistantOverrides` injecting `business_name` and `carpark_name`. Returns `vapiCallId`. |
| `processCallResult(payload: VapiWebhookPayload): ProcessedCallResult` | Parses the `end-of-call-report` and extracts structured data (name, email, outcome). |
| `getCallableBusinesses(campaignId: string): Promise<CampaignBusiness[]>` | Finds businesses with `callStatus = PENDING` or (`VOICEMAIL`/`NO_ANSWER` where `callAttempts < maxAttempts` and `nextCallAt <= now`). |

**Vapi Structured Data Schema** (configured in the Vapi Assistant settings):

```json
{
  "type": "object",
  "properties": {
    "decision_maker_name": { "type": "string", "description": "Name of the manager or decision-maker" },
    "decision_maker_email": { "type": "string", "description": "Email address to send parking discount codes to" },
    "best_callback_time": { "type": "string", "description": "Best time to call back if the person is unavailable" },
    "call_outcome": {
      "type": "string",
      "enum": ["LEAD_CAPTURED", "CALLBACK_BOOKED", "NOT_INTERESTED", "VOICEMAIL", "GATEKEEPER_BLOCKED"]
    }
  }
}
```

#### [NEW] `src/lib/ctps-check.ts`

CTPS (Corporate Telephone Preference Service) register screening:

| Function | Description |
|----------|-------------|
| `checkCTPS(phoneE164: string): Promise<boolean>` | Returns `true` if the number is on the CTPS register. |
| `screenCampaign(campaignId: string): Promise<{ screened: number, blocked: number }>` | Checks all campaign businesses, marks CTPS-registered ones as `CTPS_BLOCKED`. |

> [!IMPORTANT]
> **Legal requirement.** B2B cold calling is legal in the UK under "Legitimate Interest" (PECR), but calling a CTPS-registered business is a legal offense. Options for the CTPS API: TPS Services, Data8, or TPS Protect. This must be configured before any calls are made.
>
> **Fallback for v1:** If no CTPS API is configured, log a warning and skip screening (but show a prominent warning in the UI). Do not silently proceed.

#### [NEW] `src/lib/voice-queue.ts`

Call scheduling and dispatch:

| Function | Description |
|----------|-------------|
| `processNextCalls(campaignId: string, maxConcurrent: number): Promise<number>` | Dispatches up to `maxConcurrent` calls for the next callable businesses. Returns number dispatched. |
| `scheduleRetry(cbId: string): Promise<void>` | Sets `nextCallAt` to 24–48hrs later at a different time slot than the last attempt. |
| `getCampaignStats(campaignId: string): Promise<CampaignStats>` | Returns aggregate counts by `CallStatus` for dashboard rendering. |
| `getLocationStats(locationId: string): Promise<LocationStats>` | Returns aggregate outreach progress for a location (across all its campaigns). |

**Calling Rules (hardcoded for v1):**
- Windows: Mon–Fri, **10:00–11:30** and **14:30–16:30** UK time
- Min gap between calls: 30 seconds
- Max concurrent: configurable (default 1, max 5)
- Max attempts per business: configurable (default 3)
- Retry delay: 24–48hrs at alternating time slot

> [!NOTE]
> **v1 is manually triggered** — operator clicks "Start Calling" in the dashboard. Calls dispatch sequentially up to `maxConcurrent`. A future version could use Vercel Cron or Inngest for fully automated queuing.

---

### 3. API Layer

#### [NEW] `src/app/api/webhooks/vapi/route.ts`

**Public endpoint** — no Clerk auth (Vapi calls this server-to-server).

| Method | Behaviour |
|--------|-----------|
| `POST` | Receives Vapi webhook events. Validates `webhookSecret` header if configured. |

**Events handled:**

| Event | Action |
|-------|--------|
| `end-of-call-report` | Extract `structuredData`, update `CampaignBusiness` with `callStatus`, `callSummary`, `transcript`, `recordingUrl`, `callDuration`. If email captured → push to `Place.contactPeople` with `{ source: "AI Voice Agent" }`. If outcome is VOICEMAIL/NO_ANSWER and attempts < max → call `scheduleRetry()`. |
| `status-update` | Update `CampaignBusiness.callStatus` for real-time tracking (e.g. `IN_PROGRESS`). |

**Security:**
- Webhook secret verification via Vapi's `x-vapi-secret` header
- Log all webhook payloads for debugging (strip PII from logs)
- Return 200 immediately, process async to avoid timeouts

#### [NEW] `src/app/api/outreach/voice/route.ts`

Campaign voice operations (Clerk auth required):

| Action | Behaviour |
|--------|-----------|
| `POST { action: 'start', campaignId }` | Verify location is LIVE. Set `campaign.status = CALLING`. Dispatch first batch of calls via `processNextCalls()`. |
| `POST { action: 'pause', campaignId }` | Set `campaign.status = PAUSED`. Stop dispatching new calls (in-progress calls complete naturally). |
| `POST { action: 'resume', campaignId }` | Verify location still LIVE. Set `campaign.status = CALLING`. Resume dispatching. |
| `POST { action: 'call-next', campaignId }` | Trigger exactly 1 call for testing. Does not require calling window. |
| `POST { action: 'screen', campaignId }` | Run CTPS screening on all PENDING businesses. |

#### [NEW] `src/app/api/outreach/voice/config/route.ts`

Voice configuration management (Clerk auth required):

| Method | Behaviour |
|--------|-----------|
| `GET` | Returns current `VoiceConfig` (masks the auth token and API key in response). |
| `PATCH` | Creates or updates the global VoiceConfig. |
| `POST { action: 'test-call', phoneNumber }` | Triggers Sarah to call the provided phone number for testing. |

#### [MODIFY] [campaigns/route.ts](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/app/api/outreach/campaigns/route.ts)

Extend the existing `POST` handler:

- **Require `locationId`** in the request body (in addition to existing `postcode`, `category`, `businessIds`)
- **Validate** that the location has `status = 'LIVE'` — return 400 if not
- **Accept** optional `carparkName` field — stored on the Campaign
- **Save** the `locationId` FK on the new Campaign record
- **Auto-screen** CTPS if VoiceConfig has a CTPS API configured and `callingEnabled = true`

---

### 4. Frontend — Voice Outreach Dashboard

> [!NOTE]
> Existing outreach pages are demo scaffolding. They will be **rewritten from scratch**. Mock functions like `getMockProgress()` will be deleted.

#### [REWRITE] `src/app/outreach/page.tsx` — Voice Outreach Hub

**Server component** showing per-location outreach progress across all LIVE locations.

**Layout:**

```
┌──────────────────────────────────────────────────────────────────┐
│ 🎯 Voice Outreach                     [Voice Settings ⚙️]       │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│ │ 📞 5,571  │ │ ✅ 42    │ │ 📅 18    │ │ ⏳ 4,200  │            │
│ │ Callable  │ │ Leads    │ │ Callbacks│ │ Pending  │            │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│                                                                  │
│ ⚠️ CTPS screening not configured — set up in Voice Settings     │
│                                                                  │
│ ┌─ LS1 (Leeds Central) ──────────────────────────────────────┐  │
│ │ Report: Q1 Leeds Portfolio          [Calling] ████████░░ 75% │  │
│ │ 📊 120 businesses → 104 callable → 3 CTPS blocked          │  │
│ │ ✅ 12 leads · 📅 5 callbacks · ❌ 30 declined · ⏳ 54 left  │  │
│ │ Last: Hampton by Hilton — lead captured 2hrs ago            │  │
│ │                                      [View Campaign →]      │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌─ SW1A (Westminster) ───────────────────────────────────────┐  │
│ │ Report: London Pilot                [Not Started]           │  │
│ │ 📊 85 businesses → 72 callable                              │  │
│ │                                      [Start Outreach →]     │  │
│ └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Per-location card data** (queried from DB, not mocked):

| Element | Source |
|---------|--------|
| Postcode + report name | `ReportLocation` → `Report.name` |
| Calling status badge | `Campaign.status` for this location (or "Not Started" if no campaign) |
| Progress bar | `CampaignBusiness` count with terminal status / total callable |
| Funnel stats | Count of `Place.phone IS NOT NULL` for included places at this location |
| Outcome breakdown | Aggregate `CallStatus` counts via `getCampaignStats()` |
| Recent activity | Latest `CampaignBusiness` with `lastCallAt` not null, ordered desc |
| Action button | "Start Outreach" → creates campaign + navigates. "View Campaign" → links to control room. |

#### [REWRITE] `src/app/outreach/campaigns/[campaignId]/page.tsx` — Campaign Control Room

**Server component** — the command centre for an active calling campaign.

- **Header**: Campaign name, car park name, postcode, business type, status badge
- **Action bar** (client component island):
  - "Start Calling" / "Pause" / "Resume" buttons based on `campaign.status`
  - "Call Next" debug button (bypasses calling window)
  - "Screen CTPS" button (if not yet screened)
- **Stats row**: 4 metric cards — Total Calls Made, Leads Captured, Callbacks Booked, Pending
- **Business table**: All campaign businesses with columns:
  - Business name, phone number, call status (colour-coded badge), attempts count, last called timestamp, extracted email/name
  - Expandable row: call summary, transcript snippet, recording audio player
- **Outcome chart**: Pie or horizontal bar chart of call outcome distribution

#### [REWRITE] `src/app/outreach/campaigns/[campaignId]/CampaignSteps.tsx` — Campaign Workflow

**Client component** — purpose-built step wizard for voice outreach:

```
Step 1: Review Businesses    — Phone coverage stats, business list with phone/no-phone indicators
Step 2: CTPS Screening       — Run compliance check, show blocked count, proceed/skip
Step 3: Launch Calling        — Set car park name, confirm settings, "Start Calling" button
Step 4: Monitor & Results     — Embedded version of Campaign Control Room stats
Step 5: Follow-up             — Export captured leads as CSV, copy email list
```

#### [NEW] `src/app/outreach/campaigns/[campaignId]/calls/page.tsx` — Call Log

Detailed call history for a campaign:

- Table: business name, phone, call status badge, call duration (mm:ss), outcome, timestamp
- Expandable rows: AI-generated call summary, full transcript text, audio recording player (`<audio>` tag with `recordingUrl`)
- Filters: status dropdown (all outcomes), search by business name
- Export: CSV download of all call results (business name, phone, status, extracted email, summary)

#### [NEW] `src/app/outreach/voice-config/page.tsx` — Voice Settings

**Client component** (form with API calls):

- **Twilio/Vapi Credentials**: Account SID, Auth Token (masked), Vapi API Key (masked), Assistant ID, Phone Number ID
- **Webhook Secret**: Auto-generated or manual entry
- **Calling Config**: Max concurrent calls (1–5 slider), max retry attempts (1–5)
- **Calling Windows**: Displayed as read-only (10:00–11:30 + 14:30–16:30 UK, Mon–Fri)
- **Test Call**: Phone number input + "Call Me" button — triggers Sarah to call you
- **Connection Status**: Green/red indicators showing if Twilio + Vapi are connected (validated via API ping)

#### [DELETE] `src/app/outreach/campaigns/[campaignId]/launch/page.tsx`

Replaced by the in-page calling controls in the Campaign Control Room.

#### [DELETE] `src/components/LaunchStep.tsx`

Email-based launch step — replaced by voice calling workflow.

---

### 5. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VAPI_PRIVATE_API_KEY` | Yes (for calling) | Vapi API key for server-to-server calls |
| `VAPI_WEBHOOK_SECRET` | Recommended | Secret for validating incoming Vapi webhooks |
| `CTPS_API_KEY` | Optional | API key for CTPS register checking service |
| `CTPS_API_URL` | Optional | Base URL for the CTPS checking API |

> [!NOTE]
> Twilio credentials (SID + Auth Token) are stored in the `VoiceConfig` DB row — they are **not** environment variables. The Vapi Assistant ID and Phone Number ID are also stored in the DB via the Voice Config page, but the **Vapi API key** itself should remain in env vars for security (it has full API access).

---

### 6. Dependencies

| Package | Purpose | Install |
|---------|---------|---------|
| `libphonenumber-js` | Convert UK national phone numbers to E.164 | `npm install libphonenumber-js` |

No other new dependencies. Vapi API is called via native `fetch()`. Twilio is managed by Vapi (no direct Twilio SDK).

---

### 7. Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ OUTREACH HUB                                                         │
│ User clicks "Start Outreach" on a LIVE location                     │
│   → POST /api/outreach/campaigns { locationId, category, ... }      │
│   → Validates location status = LIVE                                 │
│   → Creates Campaign with locationId FK + carparkName                │
│   → Redirects to Campaign Control Room                               │
└──────────────────────────────────────┬──────────────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ CAMPAIGN CONTROL ROOM                                                │
│ Step 2: User clicks "Screen CTPS"                                    │
│   → POST /api/outreach/voice { action: 'screen', campaignId }       │
│   → Marks CTPS_BLOCKED businesses                                    │
│                                                                       │
│ Step 3: User clicks "Start Calling"                                  │
│   → POST /api/outreach/voice { action: 'start', campaignId }        │
│   → Verify location still LIVE (abort if changed)                    │
│   → Set campaign.status = CALLING                                    │
│   → For each callable business (up to maxConcurrent):                │
│       1. Validate phone → formatPhoneE164()                          │
│       2. If invalid → set INVALID_NUMBER, skip                       │
│       3. Check calling window (skip if outside, unless debug)        │
│       4. POST to Vapi API with assistantOverrides:                   │
│          { business_name, carpark_name }                             │
│       5. Save vapiCallId → CampaignBusiness                         │
│       6. Set callStatus = IN_PROGRESS                                │
└──────────────────────────────────────┬──────────────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ VAPI COMPLETES CALL                                                  │
│   → POST /api/webhooks/vapi (end-of-call-report)                    │
│   → Verify webhook secret                                            │
│   → Extract structuredData:                                          │
│       decision_maker_name, decision_maker_email, call_outcome        │
│   → Update CampaignBusiness:                                         │
│       callStatus, callSummary, transcript, recordingUrl, callDuration│
│   → If LEAD_CAPTURED + email:                                        │
│       Push to Place.contactPeople { name, email, source: "Voice AI" }│
│   → If VOICEMAIL/NO_ANSWER + attempts < max:                        │
│       scheduleRetry() → set nextCallAt 24-48hrs later                │
│   → If all businesses in campaign have terminal status:              │
│       Set campaign.status = COMPLETED                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 8. Files Changed Summary

| Action | File | Description |
|--------|------|-------------|
| **MODIFY** | `prisma/schema.prisma` | Campaign.locationId FK, CampaignBusiness call fields, CallStatus enum, VoiceConfig model, CampaignStatus extension |
| **NEW** | `src/lib/voice-agent.ts` | Vapi integration, E.164 formatting, call dispatch/result processing |
| **NEW** | `src/lib/ctps-check.ts` | CTPS register screening |
| **NEW** | `src/lib/voice-queue.ts` | Call scheduling, stats aggregation, retry logic |
| **NEW** | `src/app/api/webhooks/vapi/route.ts` | Vapi webhook handler (public, secret-verified) |
| **NEW** | `src/app/api/outreach/voice/route.ts` | Campaign voice operations (start/pause/resume/call-next/screen) |
| **NEW** | `src/app/api/outreach/voice/config/route.ts` | VoiceConfig CRUD + test call |
| **MODIFY** | `src/app/api/outreach/campaigns/route.ts` | Add locationId requirement, LIVE validation, CTPS auto-screen |
| **REWRITE** | `src/app/outreach/page.tsx` | Voice Outreach Hub with per-location progress |
| **REWRITE** | `src/app/outreach/campaigns/[campaignId]/page.tsx` | Campaign Control Room |
| **REWRITE** | `src/app/outreach/campaigns/[campaignId]/CampaignSteps.tsx` | Voice outreach workflow (5 steps) |
| **NEW** | `src/app/outreach/campaigns/[campaignId]/calls/page.tsx` | Call log with transcripts + recordings |
| **NEW** | `src/app/outreach/voice-config/page.tsx` | Voice settings page |
| **DELETE** | `src/app/outreach/campaigns/[campaignId]/launch/page.tsx` | Replaced by in-page controls |
| **DELETE** | `src/components/LaunchStep.tsx` | Replaced by voice calling |

**Total: 8 new · 4 modified/rewritten · 2 deleted**

---

## Implementation Order

| Phase | Tasks | Depends On |
|-------|-------|------------|
| **Phase 1: Database** | Schema migration — Campaign.locationId, CampaignBusiness call fields, CallStatus enum, VoiceConfig model | — |
| **Phase 2: Core Logic** | `voice-agent.ts`, `ctps-check.ts`, `voice-queue.ts`. Install `libphonenumber-js`. | Phase 1 |
| **Phase 3: API Routes** | Vapi webhook, voice operations API, voice config API, campaign API updates | Phase 2 |
| **Phase 4: Frontend** | Voice config page → Outreach Hub → Campaign Control Room → CampaignSteps → Call Log. Delete launch page + LaunchStep. | Phase 3 |
| **Phase 5: Testing** | End-to-end test call to own phone via Ngrok | All phases |

---

## Pre-requisites (User Action Required)

Before implementation begins, the following must be done by the user:

1. **Purchase a UK Twilio number** — local area code matching the car park (e.g. 0113 for Leeds) for higher pickup rates. Complete the Twilio Regulatory Bundle (requires Company Registration Number + address).
2. **Create a Vapi account** — set up the "Sarah" assistant with the gatekeeper pivot prompt and the structured data extraction schema above.
3. **Import the Twilio number into Vapi** — Vapi Dashboard → Phone Numbers → Import Twilio Number. Note the `phoneNumberId`.
4. **Set environment variables**: `VAPI_PRIVATE_API_KEY`, `VAPI_WEBHOOK_SECRET`.
5. **(Optional) CTPS API**: Sign up for a CTPS checking service and set `CTPS_API_KEY` + `CTPS_API_URL`.

---

## Verification Plan

### Automated (run after each phase)

1. `npx tsc --noEmit` — zero TypeScript errors
2. `npm run build` — Next.js build exits with code 0
3. `npx prisma migrate dev` — migration applies cleanly

### Manual Testing

**Test 1: Voice Config** — Navigate to `/outreach/voice-config`, enter credentials, save, reload, verify values persist (masked display).

**Test 2: Outreach Hub** — Navigate to `/outreach`. Verify:
- Only LIVE locations appear as cards
- Per-location stats show correct business/phone counts
- "Start Outreach" button appears for locations without campaigns

**Test 3: Campaign Creation** — Click "Start Outreach" on a LIVE location. Verify:
- Campaign is created with the correct `locationId` FK
- Campaign detail page shows the business list with phone/no-phone indicators

**Test 4: CTPS Screening** — Run CTPS screen on a campaign (if API is configured). Verify blocked businesses show `CTPS_BLOCKED` status.

**Test 5: Test Call (Ngrok required)** — Set up Ngrok (`ngrok http 3000`), register the URL as the Vapi webhook. Use "Call Next" on a campaign containing your own phone number. Verify:
- Sarah calls your phone with the correct business name and car park name
- After hanging up, the webhook fires
- CampaignBusiness row updates with transcript, summary, recording URL, and extracted data
- The call appears in the `/calls` log page

**Test 6: Outreach Hub Progress** — After test calls complete, return to `/outreach` and verify the per-location progress card updates with correct stats and the latest activity.

> [!IMPORTANT]
> **Test 5 requires Ngrok** to expose the local webhook endpoint. Run `ngrok http 3000` and register the Ngrok HTTPS URL as the Vapi webhook endpoint.
