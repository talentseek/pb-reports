# 6. UK Compliance & Delivery

[← Back to Index](./README.md)

---

## ⚠️ AI Voice Agent Compliance Risk

| Method | Corporate (Ltd, LLP) | Individual (Sole Trader) |
|--------|---------------------|--------------------------|
| **Cold Email** | ✅ Allowed (opt-out required) | ❌ Prior consent required |
| **Live Calls** | ✅ Allowed (screen TPS/CTPS) | ✅ Allowed (screen TPS) |
| **Automated / AI Voice** | ❌ **CONSENT REQUIRED** | ❌ **CONSENT REQUIRED** |

> **£500,000 fine or 4% of global turnover** for AI voice agents without prior consent.

## Implications for Sarah

> **User decision:** B2B automated/AI voice calls are on the table. The user considers this acceptable for B2B outreach.

- **Option 1:** Inbound only — businesses call us after email
- **Option 2:** Warm follow-up only — after email establishes consent
- **Option 3:** Email-first outreach, Sarah for callback scheduling
- **Option 4:** Legal review — does real-time conversational AI qualify as "automated" under PECR?

---

## 🚨 The Sole Trader Cold Email Problem

**This is a critical compliance gap.** Under PECR, sole traders and partnerships are classified as **individuals**, not corporate entities. This means:

- Cold email to a Ltd/LLP company → ✅ Legal (with opt-out)
- Cold email to a sole trader → ❌ Requires prior consent (same rules as personal email)

**The pipeline problem:** If we can't determine whether a business is a Ltd company or sole trader BEFORE sending the first email, we risk breaking PECR by cold-emailing sole traders.

**Potential mitigations:**
1. **Companies House check first** — if we find a company number, it's Ltd → safe to email
2. **If no company found** → assume sole trader → do not cold email, use phone instead (live calls to sole traders ARE legal)
3. **Conservative approach** — only email businesses we've confirmed as Ltd/LLP
4. **Legal review** — the B2B exemption may apply if emailing a "business" address (e.g., info@), even for sole traders. Legal advice needed.

**Impact on pipeline:** This means the enrichment pipeline isn't just about efficiency — it's legally required. We CANNOT just blast emails to all places. We must classify first.

> **User decision:** Will email all businesses for now. User believes sole traders are unlikely to be a significant portion of the dataset. Compliance risk accepted for v1.

---

## GDPR Requirements

### Legitimate Interest Assessment (LIA)

GDPR allows processing personal data without consent IF there is a "legitimate interest." But we must document this:

| LIA Element | Our Position |
|------------|-------------|
| **Purpose** | We want to contact business decision-makers about a parking partnership |
| **Necessity** | We cannot achieve this without processing their business contact details |
| **Balancing test** | The data subjects are business professionals expecting B2B outreach; the data is work-related, not personal; we provide easy opt-out |
| **Safeguards** | Data minimisation, suppression list, clear opt-out mechanism, data retention limits |

**Action:** Write and file the LIA document before any outreach begins. This is a legal requirement, not optional.

### Data Minimisation

Only collect what's needed:
- ✅ Name, role, work email, work phone — required for outreach
- ❌ Personal address, personal phone, date of birth — not needed, don't collect

### ICO Registration

ParkBunny may need to register with the Information Commissioner's Office (ICO) as a data controller if processing personal data for direct marketing. Registration fee is £40-£2,900/year depending on company size.

**Action:** Check if already registered. If not, register before launching outreach.

---

## Data Retention Policy

Enriched personal data (names, emails, phones) can't be kept indefinitely.

| Data Category | Retention Period | Action at Expiry |
|--------------|-----------------|-----------------|
| Active leads (contacted, in sequence) | Until deal closed or 12 months after last contact | Delete or anonymise |
| Opted-out contacts | Keep email on suppression list indefinitely | Delete all other personal data |
| Uncontacted enriched data | 6 months from enrichment date | Re-assess or delete |
| Companies House data (public) | No limit | Public data, no GDPR restriction |
| Google Places data (public) | No limit | Public data, no GDPR restriction |

---

## Enrichment Tool Stack (Compliance View)

> The full pipeline waterfall is defined in [doc 03 (Independent Path)](./03-independent-path.md) and [doc 04 (Chain Path)](./04-chain-path.md). The tool details and costs are in [doc 05 (Tech Stack)](./05-tech-stack.md). This section covers the compliance implications of the enrichment outputs.

### Enrichment Outputs Per Lead

- ✅ Verified work email (>98% accuracy)
- ✅ LinkedIn profile URL (when available via Apollo)
- ✅ Seniority & department level
- ⚠️ Direct/mobile number — only if Cognism added (auto-scrubbed TPS/CTPS). Not in current stack.

> **Note:** Prospeo and Cognism were considered but are not in the current stack. Apollo + ZeroBounce covers the core need. Cognism adds mobile numbers with TPS/CTPS screening — evaluate only if phone outreach becomes a priority.

---

## Delivery & Hyper-Personalisation

### Email Infrastructure Requirements

> See [Gap 6 in Gaps doc](./08-gaps-and-priorities.md) for full detail

> **✅ User confirmed:** Has an **Instantly** account with **multiple domains** already set up.

- **Separate outreach domain** — already handled via Instantly
- SPF, DKIM, DMARC configuration on outreach domain
- 2-4 week domain warming before first campaign
- **Instantly** for domain rotation and warm-up
- Gradual volume scaling to avoid UK ISP spam filters

> **⚠️ Timeline pressure:** User wants outreach to begin within **days**, not weeks. Domain warming may be a blocker if domains aren't already warmed.

### Hyper-Personalisation Layer

Use Google Maps data for authenticity:
- Reference review count and rating in opening line
- Mention specific business type context (e.g., "parking for your hotel guests")
- Reference proximity to specific car park by name

**Example:**
> "Hi [Name], I noticed The Crown Hotel has 5,205 reviews and a 4.2 rating — impressive for Cricklewood. We've just taken over the car park at [carpark_name] nearby and have a budget to offer your guests and staff discounted parking..."

### Compliance Checklist Per Email

Every outreach email MUST include:
- [ ] Sender identified as ParkBunny / ParkBunny Offers
- [ ] Physical address in footer
- [ ] Clear unsubscribe / opt-out link
- [ ] Reason: "We're contacting you because your business is near our car park at [location]"
- [ ] No misleading subject line
