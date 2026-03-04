# PLAN: Intelli-Park Demo Config

## Research Summary

### Brand Identity (extracted from intelli-park.com)

| Property | Value |
|----------|-------|
| **Name** | Intelli-Park |
| **Tagline** | "Your Partner In Parking Solutions" |
| **Primary colour** | `#93D500` (lime green / chartreuse) |
| **Secondary colour** | `#1a1a1a` (dark grey/black) |
| **Accent/CTA** | `#93D500` (same lime green) |
| **Font** | TT Firs Neue (geometric sans-serif) |
| **Logo** | Black text, lime green bracket on "lli" |
| **Logo URL** | `https://www.intelli-park.com/wp-content/uploads/2024/11/opera_IqLKyxgSP6.png` |

### Location (SY1 1QH)

| Property | Value |
|----------|-------|
| **City** | Shrewsbury |
| **Area** | Castle Foregate / town centre |
| **Lat** | 52.708487 |
| **Lng** | -2.757175 |
| **Region** | West Midlands / Shropshire |

### Company Profile
- UK parking technology & management company (20+ years, 300+ staff)
- Services: ANPR, bay sensors, parking apps, EV charging, enforcement
- Focus on "fair enforcement" and making parking "simpler and fairer"
- Manages thousands of sites: retail, NHS, universities, hospitality

---

## Proposed Changes

### 1. Download and save logo
- Save the Intelli-Park logo to `/public/demo/intelli-park/logo.png`
- Need a **white version** for dark map background (apply invert filter in code like ECP)

### 2. Create JSON config

#### [NEW] `src/lib/demo-configs/intelli-park.json`

```json
{
    "slug": "intelli-park",
    "operator": {
        "name": "Intelli-Park",
        "tagline": "Your Partner In Parking Solutions",
        "logo": "/demo/intelli-park/logo.png",
        "colors": {
            "primary": "#93D500",
            "secondary": "#1a1a1a",
            "accent": "#93D500",
            "background": "#f0f4f0",
            "text": "#0f172a",
            "cardBg": "rgba(255,255,255,0.92)",
            "cta": "#93D500"
        },
        "font": "'TT Firs Neue', Arial, sans-serif"
    },
    "location": {
        "name": "Shrewsbury Town Centre",
        "address": "Barker Street, Shrewsbury",
        "postcode": "SY1 1QH",
        "phone": "",
        "locationCode": "",
        "city": "Shrewsbury",
        "totalSpaces": 150,
        "hourlyRate": 2.50,
        "lat": 52.708487,
        "lng": -2.757175
    },
    "deals": [ ... 4-6 local Shrewsbury businesses ... ],
    "partnerView": { ... demo stats ... }
}
```

### 3. Register config

#### [MODIFY] `src/lib/demo-configs/index.ts`
Add 2 lines:
```ts
import intelliPark from './intelli-park.json'
// In configs record:
'intelli-park': intelliPark as unknown as DemoConfig,
```

### 4. Result
Live at: `/demo/intelli-park` (password protected with `ecpparkbuddy2026`)

---

## Open Questions for User

1. **Hourly parking rate** — I've assumed £2.50/hr for Shrewsbury. Is there a specific rate?
2. **Total spaces** — Assumed 150. Do you know the actual count?
3. **Specific deals** — Should I use generic Shrewsbury businesses (Costa, Greggs, Nando's etc.) or do you have specific partners in mind?
4. **Password** — Reuse `ecpparkbuddy2026` or set a different one for Intelli-Park?
5. **CTA text colour** — The lime green `#93D500` on white buttons may need dark text (`#1a1a2e`). Should I adjust?

## Verification
- Build passes (`npm run build`)
- Navigate to `/demo/intelli-park` → login screen with Intelli-Park × ParkBunny branding
- Enter password → full demo with Shrewsbury map, local deals, partner view
