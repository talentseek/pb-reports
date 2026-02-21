# Voice Agent Outreach — Research & Strategic Plan

> ParkBunny wants to use Twilio + Vapi.ai voice agents to call businesses discovered via Google Places API and pitch parking partnerships. The AI Voice Agent ("Sarah") serves as both the **lead qualification tool** and **data enrichment pipeline**.

---

## Data Availability (as of 18 Feb 2026)

**Database: 6,363 places stored**

| Data Field | Count | Coverage | Source |
|-----------|-------|----------|--------|
| Phone number | 5,571 | **87.6%** | Google Places `nationalPhoneNumber` |
| Website | 5,554 | 87.3% | Google Places `websiteUri` |
| Email | 305 | 4.8% | Outscraper enrichment only |
| Enriched (Outscraper) | 355 | 5.6% | Manual enrichment pipeline |
| allPhones (multi-source) | 314 | 4.9% | Outscraper enrichment only |

### Why Voice > Email Scraping

- 87.6% phone coverage vs 4.8% email coverage makes voice the obvious channel.
- Outscraper is expensive at scale and often returns outdated LinkedIn data for hospitality/retail.
- The AI Voice Agent costs pennies per minute and yields **100% verified, real-time** decision-maker contact data when a gatekeeper shares an email.
- Only run Outscraper on the ~12% without phone numbers, or after 3 failed call attempts.

### Data Flow

```
Google Places API (searchNearby)
  → PLACES_FIELD_MASK includes `places.nationalPhoneNumber`
  → Stored as Place.phone (e.g., "0113 819 4900")
  → libphonenumber-js converts to E.164 for Twilio ("+441138194900")
```

Defined in `src/lib/placesFetch.ts` line 17.

---

## Phase 1: Strategic Decisions

### 1. Calling Pipeline Architecture

**Use a background job queue** (BullMQ, Inngest, or Trigger.dev) — not a simple forEach loop. Start with **1–2 simultaneous calls** to monitor quality and avoid carrier spam flags.

**Time-of-Day Restrictions (hardcoded):**
- 🟢 **10:00 AM – 11:30 AM** UK time
- 🟢 **2:30 PM – 4:30 PM** UK time
- 🔴 Avoids opening/closing hours and lunchtime rush

**Retry Logic:**
- Voicemail / unanswered → reschedule 24–48 hours later at a different time slot
- Max 3 attempts before marking as FAILED

### 2. Voice Agent Persona — "The Gatekeeper Pivot"

Since 95% of Google Places numbers reach a **receptionist/bartender/clerk**, not a decision-maker.

**Persona:** Sarah — friendly, professional, concise, British voice (ElevenLabs "Matilda" or "Rachel" via Vapi).

**Strategy:** Don't pitch the complex footfall strategy to frontline workers. Pitch **immediate value** (discounted parking), then pivot to **extracting decision-maker contact info**.

**Prompt:**
> "Hi there, I'm Sarah calling from ParkBunny. We just took over the management of the {{carpark_name}} nearby. I'm reaching out because we have a budget to offer your staff and customers exclusive discounted parking rates. I know you're likely busy, so I'm just trying to find out who handles staff perks or management for {{business_name}}? Could I grab their name and the best email to send these discount codes to?"

### 3. Outcome Tracking — Vapi Structured Data Extraction

Vapi can auto-extract a JSON schema from the conversation. No manual transcript parsing needed:

```json
{
  "decision_maker_name": "String",
  "decision_maker_email": "String",
  "best_callback_time": "String",
  "call_outcome": "Enum: LEAD_CAPTURED | CALLBACK_BOOKED | NOT_INTERESTED | VOICEMAIL | GATEKEEPER_BLOCKED"
}
```

### 4. Integration with Existing Models

Tie directly into existing `Campaign` / `CampaignBusiness` models. Extend `CampaignBusiness` with:

| New Field | Type | Purpose |
|-----------|------|---------|
| `vapiCallId` | String? | Links to Vapi call record |
| `callStatus` | Enum | PENDING → IN_PROGRESS → outcome |
| `extractedEmail` | String? | Decision-maker email from call |
| `callSummary` | String? | AI-generated summary |
| `transcript` | Text? | Full conversation transcript |
| `recordingUrl` | String? | Twilio recording link |

### 5. Twilio Setup & UK Compliance

- **Number:** Buy a **local UK +44 number** matching the car park area code (e.g., 0113 for Leeds). Local numbers have significantly higher pickup rates than 0800 or 07 mobile numbers.
- **Regulatory Bundle:** Twilio requires ParkBunny's Company Registration Number and address.
- **CTPS Compliance (CRITICAL):** B2B cold calling is legal under "Legitimate Interest" (PECR), BUT you **must** screen all 5,500 numbers against the **CTPS register** (Corporate Telephone Preference Service). It is a legal offense to call CTPS-registered businesses. Use a UK TPS-checking API before adding numbers to the queue.

### 6. Enrichment Strategy

- **Don't pre-enrich with Outscraper.** Let the Voice Agent be the enrichment tool.
- Only use Outscraper for the ~12% without phone numbers, or businesses where calls fail 3× .

### 7. Category Prioritisation

| Tier | Categories | Rationale |
|------|-----------|-----------|
| **Tier 1** 🟢 | Hotels, Gyms, Clinics, Corporate Offices | Large staff counts needing daily parking, guests/clients needing validated parking, clear management hierarchies |
| **Tier 2** 🟡 | Retail / High Street Shops | Good for staff parking, but customer parking usually too short-term |
| **Tier 3** 🔴 | Restaurants / Bars | Staff notoriously busy, hate phone calls during prep, rarely have generic admin emails |

---

## Phase 2: Technical Implementation

### Architecture Overview

```
Job Queue (BullMQ/Inngest)
  → Picks CampaignBusiness from DB
  → Converts phone to E.164 via libphonenumber-js
  → Triggers Vapi call with assistantOverrides (business_name, carpark_name)
  → Saves vapiCallId to CampaignBusiness
  
Vapi Webhook (POST /api/webhooks/vapi)
  → Receives end-of-call-report
  → Extracts structuredData (decision_maker_name, email, outcome)
  → Updates CampaignBusiness with call results
  → If email captured: enriches Place.contactPeople
```

### 1. Linking Twilio to Vapi

Vapi handles Twilio configuration automatically:
1. Copy Twilio **Account SID** and **Auth Token**
2. Vapi Dashboard → Phone Numbers → Import Twilio Number
3. Paste credentials → Vapi configures webhooks behind the scenes
4. Returns a `phoneNumberId` for API calls

### 2. Triggering a Call (Node.js)

```typescript
import axios from 'axios';
import { parsePhoneNumber } from 'libphonenumber-js';

async function dispatchParkBunnyCall(place, campaignBusinessId, carparkName) {
  const e164Number = parsePhoneNumber(place.phone, 'GB').format('E.164');

  const payload = {
    assistantId: process.env.VAPI_SARAH_ASSISTANT_ID,
    phoneNumberId: process.env.VAPI_TWILIO_NUMBER_ID,
    customer: { number: e164Number, name: place.name },
    assistantOverrides: {
      variableValues: {
        business_name: place.name,
        carpark_name: carparkName,
      },
    },
    metadata: {
      campaignBusinessId,
      placeId: place.id,
    },
  };

  const response = await axios.post('https://api.vapi.ai/call/phone', payload, {
    headers: { Authorization: `Bearer ${process.env.VAPI_PRIVATE_API_KEY}` },
  });

  await prisma.campaignBusiness.update({
    where: { id: campaignBusinessId },
    data: { vapiCallId: response.data.id, callStatus: 'IN_PROGRESS' },
  });
}
```

### 3. Webhook Handler (POST /api/webhooks/vapi)

```typescript
export async function POST(req: Request) {
  const body = await req.json();

  if (body.message?.type === 'end-of-call-report') {
    const callData = body.message.call;
    const { campaignBusinessId, placeId } = callData.metadata;
    const extractedData = body.message.analysis.structuredData;

    // Update campaign business with call results
    await prisma.campaignBusiness.update({
      where: { id: campaignBusinessId },
      data: {
        callStatus: extractedData.call_outcome || body.message.endedReason,
        callSummary: body.message.summary,
        transcript: body.message.transcript,
        recordingUrl: body.message.recordingUrl,
      },
    });

    // Enrich Place record if decision-maker email was captured
    if (extractedData.decision_maker_email) {
      await prisma.place.update({
        where: { id: placeId },
        data: {
          contactPeople: {
            push: {
              name: extractedData.decision_maker_name || 'Manager',
              email: extractedData.decision_maker_email,
              source: 'AI Voice Agent',
            },
          },
        },
      });
    }
  }

  return new Response('OK', { status: 200 });
}
```

---

## Next Steps (Implementation Order)

1. **Purchase local UK Twilio number** + complete Regulatory Bundle (Company Registration Number + address)
2. **Set up Vapi assistant** in GUI with Sarah's system prompt; test by calling your own phone
3. **CTPS register screening** — integrate a TPS-checking API to filter out registered businesses
4. **Schema migration** — extend `CampaignBusiness` with `vapiCallId`, `callStatus`, `extractedEmail`, `callSummary`, `transcript`, `recordingUrl`
5. **Job queue** — set up BullMQ/Inngest worker with time-of-day restrictions and retry logic
6. **Webhook endpoint** — `POST /api/webhooks/vapi` for end-of-call-report processing
7. **Dashboard UI** — call status column in outreach view, transcript viewer, outcome filters
8. **Expose via Ngrok** for local webhook testing before production deployment
