# New Outreach — Research & Strategy

> The core problem: Google Places gives us **where** a business is, but not **who** runs it. Resolving a map pin into a verified decision-maker is the pipeline challenge.

---

## Documents

| # | Document | Focus | Status |
|---|----------|-------|--------|
| 1 | [Problem Statement](./01-problem-statement.md) | The Spatial-to-Identity gap, data quality, prospect filtering | ✅ Reviewed |
| 2 | [Chain Bifurcation](./02-chain-bifurcation.md) | Three-way classification (independent/group/chain), detection options, grey zones | ✅ Reviewed |
| 3 | [Independent Path](./03-independent-path.md) | 6-layer waterfall resolution with scoring, conflict resolution, social media | ✅ Reviewed |
| 4 | [Chain Path](./04-chain-path.md) | London density, 15+ edge cases, turnover, landlord control, ROI estimates | ✅ Reviewed |
| 5 | [Tech Stack](./05-tech-stack.md) | Tools, pricing, pipeline engineering, orchestration, expanded Prisma schema | ✅ Reviewed |
| 6 | [Compliance](./06-compliance.md) | UK compliance (PECR, GDPR), sole trader email blocker, LIA, ICO, data retention | ✅ Reviewed |
| 7 | [Edge Cases](./07-edge-cases.md) | 20 general edge cases & failure modes | ✅ Reviewed |
| 8 | [Gaps & Priorities](./08-gaps-and-priorities.md) | 19 identified research gaps (6 P0), prioritised backlog | ✅ Reviewed |

---

## Quick Reference

### Pipeline Summary

```
Google Places → Chain Detection → Independent / Chain split
                                      │                │
                          Firecrawl + LLM      Apollo People Search
                          Companies House      Location Emails
                                      │                │
                                      └──→ Apollo Enrich ←──┘
                                              │
                                      Email Verification
                                              │
                                        ParkBunny DB
```

### Cost Summary

| Item | First Run | Monthly Ongoing |
|------|-----------|-----------------|
| Firecrawl (3 pages/site) | $83 | $16/mo |
| Companies House | Free | Free |
| Apollo.io | $0-49 | $49/mo |
| LLM extraction | ~$8 | ~$1.50 |
| Email verification (Reoon) | Credits available | Credits available |
| **Total** | **~$140-190** | **~$65-80/mo** |

### Recommendation

**Option C (Hybrid)** — ParkBunny owns UK-specific intelligence (chain detection, Companies House, website scraping). Apollo handles people-finding.

### P0 Actions (Updated)

1. **Prospect qualification** — filter non-prospects from ~10,115 before enrichment (run SQL query on `types`)
2. **Scoring model** — independent/chain is #1 signal, distance less important within catchment
3. **Email infrastructure** — ✅ Instantly with multiple domains (check if domains are warmed)
4. **Pipeline testing** — test on 10 → 50 → 200 before full batch (per-report processing)
5. ~~Sole trader fallback~~ — deprioritised (user will email all)
6. ~~Sole trader email compliance~~ — deprioritised (risk accepted for v1)

---

*Previously: `RESEARCH-new-outreach.md` (archived)*
