import { calculateRevenuePotential, defaultSettings } from "@/lib/calculations"
import { getReportLocationSummaries, getMarkersForLocation } from "@/lib/placesSummary"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table"
import PublicHeader from "@/components/report/public/PublicHeader"
import { HeadlineMetrics, ContextMetrics } from "@/components/report/public/PublicMetrics"
import PublicRevenueTabs from "@/components/report/public/PublicRevenueTabs"
import { ExecutiveAreaSummary, AppShowcase, WhatMakesDifferent, ActivationPlan, MeasurementReporting, ComplianceGoodPractice } from "@/components/report/public/PublicSections"
import { AncillaryServices, CommercialOffer, CommercialTerms } from "@/components/report/public/PublicCommercial"
import { SingleMap, MultiLocationSection } from "@/components/report/public/PublicLocations"

function getCategoryBreakdown(businesses: any[]) {
  const counts: Record<string, number> = {}
  for (const b of businesses) {
    const key = String(b.category || 'unknown')
    counts[key] = (counts[key] ?? 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
}

function parsePostcodes(postcodes: string | null | undefined): string[] {
  if (!postcodes) return []
  return String(postcodes)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function pseudoRandomPercentFromCode(code: string): number {
  // Deterministic small hash to pick uplift between 19.0 and 24.0
  let h = 0
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0
  const min = 19.0
  const max = 24.0
  const frac = (h % 1000) / 1000
  return Math.round((min + (max - min) * frac) * 10) / 10
}

function formatCurrency(n: number): string {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)
  } catch {
    return `£${Math.round(n).toLocaleString('en-GB')}`
  }
}

function iconForCategory(cat: string): string {
  switch (cat) {
    case 'Hotels & Accommodation': return '🏨'
    case 'Restaurants & Cafes': return '🍽️'
    case 'Bars & Nightlife': return '🍸'
    case 'Fitness & Wellness': return '🏋️'
    case 'Offices & Coworking': return '🏢'
    case 'Events & Conferences': return '🎪'
    case 'Entertainment & Venues': return '🎭'
    case 'Retail & Services': return '🛍️'
    case 'Community & Public': return '🏛️'
    default: return '📍'
  }
}

function rateForCategory(settings: any, cat: string): { uplift: number; signUp: number } {
  const uplift = (settings?.categoryUplift?.[cat] ?? settings?.upliftPercentages?.[cat] ?? 0.06) as number
  const signUp = (settings?.categorySignUp?.[cat] ?? settings?.signUpRates?.[cat] ?? 0.05) as number
  return { uplift, signUp }
}

export default async function PublicReportView({ report }: { report: any }) {
  const safeSettings = (report.settings && typeof report.settings === 'object') ? (report.settings as any) : {}
  const postcodes = parsePostcodes(report.postcodes)
  const locationSummaries = await getReportLocationSummaries(report.id)
  const includedBusinessList = locationSummaries.flatMap((loc) =>
    loc.countsByCategory.flatMap((c) => Array.from({ length: c.included }, () => ({ category: c.category })))
  )
  const revenue = calculateRevenuePotential(
    includedBusinessList,
    { ...defaultSettings, ...safeSettings },
  )

  const dbTotalPlaces = (locationSummaries || []).reduce((sum, l) => sum + (l.totalIncluded || 0), 0)
  const reportBusinesses = (report.businesses ?? [])
  const totalBusinesses = dbTotalPlaces > 0 ? dbTotalPlaces : reportBusinesses.length
  const categories = getCategoryBreakdown(reportBusinesses)
  const dbCategorySet = new Set<string>()
  for (const loc of (locationSummaries || [])) {
    for (const c of loc.countsByCategory) dbCategorySet.add(c.category)
  }
  const derivedCategoriesCount = dbCategorySet.size > 0 ? dbCategorySet.size : categories.length
  const estimatedRevenuePerPostcode: number | undefined = safeSettings?.estimatedRevenuePerPostcode
  const postcodesCount: number = safeSettings?.postcodesCount ?? 1
  const totalCurrentRevenue = (estimatedRevenuePerPostcode ?? 50000) * (postcodes.length || postcodesCount || 1)
  const upliftValue = revenue
  const computedGrowthPercent = Math.round((upliftValue / Math.max(1, totalCurrentRevenue)) * 100)
  const locationCount = postcodes.length || postcodesCount
  const isMulti = locationCount > 1
  const singleMarkers = !isMulti && postcodes[0] ? await getMarkersForLocation(report.id, postcodes[0]) : []
  const multiMarkers: Record<string, any[]> = isMulti
    ? Object.fromEntries(
        await Promise.all(
          postcodes.map(async (pc) => [pc, await getMarkersForLocation(report.id, pc)])
        )
      )
    : {}
  const categoryContributionRows = (locationSummaries || [])
    .reduce((acc: { category: string; value: number }[], loc) => {
      for (const c of loc.countsByCategory) {
        const { uplift, signUp } = rateForCategory(safeSettings, c.category)
        const value = (estimatedRevenuePerPostcode ?? 50000) * (c.included * signUp * uplift)
        const found = acc.find((x) => x.category === c.category)
        if (found) found.value += value; else acc.push({ category: c.category, value })
      }
      return acc
    }, [])
    .sort((a,b)=> b.value - a.value)
    .slice(0,8)
  const topCategories = Array.from(dbCategorySet)
    .map((c) => ({
      name: c,
      included: (locationSummaries || []).reduce((s,l)=> s + ((l.countsByCategory.find(x=>x.category===c)?.included)||0), 0),
    }))
    .sort((a,b)=> b.included - a.included)
    .slice(0,3)

  return (
    <div className="space-y-12">
      <PublicHeader
        reportName={report.name || 'Client'}
        locationCount={locationCount}
        postcodes={report.postcodes}
        topCategoryLabels={topCategories.map((c)=> `${iconForCategory(c.name)} ${c.name}`)}
      />

      <HeadlineMetrics
        upliftValue={upliftValue}
        growthPercent={computedGrowthPercent}
        totalBusinesses={totalBusinesses}
        categories={derivedCategoriesCount}
        formatCurrency={formatCurrency}
      />

      <ContextMetrics
        totalCurrentRevenue={totalCurrentRevenue}
        locations={postcodes.length || postcodesCount}
        growthPercent={computedGrowthPercent}
        upliftValue={upliftValue}
        formatCurrency={formatCurrency}
      />

      {/* Map Overview (High-level) - only for single location */}
      {!isMulti && (
        <SingleMap
          center={locationSummaries[0]?.latitude && locationSummaries[0]?.longitude ? { lat: locationSummaries[0].latitude as number, lng: locationSummaries[0].longitude as number } : undefined}
          markers={singleMarkers as any}
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
        />
      )}

      {/* Locations & Inputs */}
      <section className="space-y-2">
        <Card>
          <CardHeader>
            <CardTitle>Locations & Inputs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Postcode</TableHead>
                    <TableHead>Latitude</TableHead>
                    <TableHead>Longitude</TableHead>
                    <TableHead>Spaces</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locationSummaries.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.postcode}</TableCell>
                      <TableCell>{typeof l.latitude==='number'? l.latitude.toFixed(5) : '—'}</TableCell>
                      <TableCell>{typeof l.longitude==='number'? l.longitude.toFixed(5) : '—'}</TableCell>
                      <TableCell>—</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-2 text-xs text-gray-600">Methodology: Nearby partners identified via Places APIs (category + radius filters) and scored for parking demand potential.</div>
          </CardContent>
        </Card>
      </section>

      <ExecutiveAreaSummary />

      {/* Category Breakdown (Detail) - only for single location */}
      {!isMulti && (
        <section className="space-y-3">
          <Card>
            <CardHeader><CardTitle>Business Breakdown</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-3">Distribution of local business types identified near the location. Categories with higher counts typically correlate with stronger on-peak demand, and thus higher parking conversion potential.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(locationSummaries[0]?.countsByCategory ?? []).map((entry) => {
                  const { uplift, signUp } = rateForCategory(safeSettings, entry.category)
                  const pct = Math.round(entry.included * signUp * uplift * 1000) / 10
                  return (
                    <div key={entry.category} className="rounded border p-3 flex items-center justify-between">
                      <span className="capitalize flex items-center gap-2">{iconForCategory(entry.category)} {entry.category}</span>
                      <span className="font-medium text-right">
                        <span className="mr-2">{entry.included}</span>
                        <span className="">+{pct}%</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* (Removed duplicate executive summary to avoid repetition) */}

      <PublicRevenueTabs
        isMulti={isMulti}
        totalCurrentRevenue={totalCurrentRevenue}
        upliftValue={upliftValue}
        computedGrowthPercent={computedGrowthPercent}
        postcodes={postcodes}
        locationSummaries={locationSummaries}
        estimatedRevenuePerPostcode={estimatedRevenuePerPostcode}
        dbCategorySet={dbCategorySet}
        categoryContributionRows={categoryContributionRows}
        iconForCategory={iconForCategory}
      />

      {isMulti && (
        <MultiLocationSection
          postcodes={postcodes}
          locationSummaries={locationSummaries}
          markersByPostcode={multiMarkers}
          estimatedRevenuePerPostcode={estimatedRevenuePerPostcode}
          iconForCategory={iconForCategory}
          rateForCategory={(cat:string)=> rateForCategory(safeSettings, cat)}
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
        />
      )}

      {/* Omit card grid if multi-location section is shown */}
      {!isMulti && locationSummaries[0] && (
        <section className="space-y-4">
          <h2 className="text-xl font-medium">Parking Location (Detail)</h2>
          <div className="rounded border p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-600">Postcode</p>
              <p className="font-medium">{locationSummaries[0].postcode}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Coordinates</p>
              <p className="font-medium">{locationSummaries[0].latitude?.toFixed(3)}, {locationSummaries[0].longitude?.toFixed(3)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Total nearby places</p>
              <p className="font-medium">{locationSummaries[0].totalPlaces}</p>
            </div>
          </div>
        </section>
      )}

      <AppShowcase />

      {/* Distribution visualization is provided within Revenue tabs */}

      {/* Partnership Opportunity Model */}
      <section className="space-y-3">
        <Card>
          <CardHeader>
            <CardTitle>Partnership Opportunity Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from(dbCategorySet).map((cat) => (
                <div key={cat} className="rounded border p-4 space-y-2">
                  <p className="font-medium flex items-center gap-2">{iconForCategory(cat)} {cat}</p>
                  <ul className="text-sm list-disc pl-5 text-gray-700">
                    {cat === 'Hotels & Accommodation' || cat === 'Offices & Coworking' ? (
                      <>
                        <li>Member/guest parking rates via promo codes or license‑plate validation</li>
                        <li>Recurring passes for employees/guests to lift weekday or overnight occupancy</li>
                      </>
                    ) : null}
                    {cat === 'Restaurants & Cafes' || cat === 'Entertainment & Venues' || cat === 'Retail & Services' ? (
                      <>
                        <li>Merchant‑funded validated parking to drive visits</li>
                        <li>Instant Deals for time‑of‑day offers (pre‑theatre, lunch rush)</li>
                      </>
                    ) : null}
                    {cat === 'Fitness & Wellness' ? (
                      <>
                        <li>Member passes or session‑based validation aligned to peak hours</li>
                      </>
                    ) : null}
                    {cat === 'Events & Conferences' ? (
                      <>
                        <li>Event‑aligned promos and pre‑book offers</li>
                      </>
                    ) : null}
                    {cat === 'Community & Public' ? (
                      <>
                        <li>Community partner validations for recurring activities</li>
                      </>
                    ) : null}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Uplift & Revenue Scenarios */}
      <section className="space-y-3">
        <Card>
          <CardHeader>
            <CardTitle>Uplift & Revenue Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(() => {
                const expected = upliftValue
                const conservative = Math.round(expected * 0.6)
                const stretch = Math.round(expected * 1.4)
                const items = [
                  { label: 'Scenario A (Conservative)', value: conservative },
                  { label: 'Scenario B (Expected)', value: expected },
                  { label: 'Scenario C (Stretch)', value: stretch },
                ]
                return items.map((it) => (
                  <div key={it.label} className="rounded border p-4">
                    <p className="text-sm text-gray-600">{it.label}</p>
                    <p className="text-xl font-semibold">{formatCurrency(it.value)}</p>
                  </div>
                ))
              })()}
            </div>
            <p className="text-xs text-gray-600 mt-2">Drivers: partner sign‑ups, offer redemption/validation, off‑peak pricing optimisation, and repeat behaviour (loyalty).</p>
          </CardContent>
        </Card>
      </section>

      {/* What Makes ParkBunny Different */}
      <section className="space-y-3">
        <Card>
          <CardHeader>
            <CardTitle>What Makes ParkBunny Different</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm list-disc pl-5 text-gray-700 space-y-1">
              <li>Beyond “pay and leave”: Instant Local Deals to reward drivers and lift merchant footfall</li>
              <li>Direct comms + real‑time control: target offers, adjust tariffs, view behaviour analytics across sites</li>
              <li>Multi‑location rollout: centralised partner management, signage, codes/validation, merchant onboarding</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Activation Plan */}
      <section className="space-y-3">
        <Card>
          <CardHeader>
            <CardTitle>Activation Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm list-disc pl-5 text-gray-700 space-y-1">
              <li>Weeks 0–2: site checks, signage assets, shortlist & outreach to top categories; enable validated/discounted links</li>
              <li>Weeks 3–4: first offers live; event‑aligned promos; test off‑peak pricing</li>
              <li>Weeks 5–6: expand partners; optimise offers by time of day; push loyalty nudges in‑app</li>
            </ul>
            <p className="text-xs text-gray-600 mt-2">Success metrics: +paid sessions vs. baseline, partner count, validation/redemption rate, repeat sessions, off‑peak fill.</p>
          </CardContent>
        </Card>
      </section>

      {/* Measurement & Reporting */}
      <section className="space-y-3">
        <Card>
          <CardHeader>
            <CardTitle>Measurement & Reporting</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm list-disc pl-5 text-gray-700 space-y-1">
              <li>Core KPIs: paid sessions, conversion from partner clicks/validations, avg stay, yield by hour/day, repeat rate</li>
              <li>Partner KPIs: redemptions, new vs returning mix, top‑performing offers</li>
              <li>Operator dashboard: tariff edits, offer scheduling, multi‑site comparisons (monthly PDF + live)</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Compliance & Good Practice */}
      <section className="space-y-3">
        <Card>
          <CardHeader>
            <CardTitle>Compliance & Good Practice</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm list-disc pl-5 text-gray-700 space-y-1">
              <li>Clear signage & terms (Code of Practice alignment)</li>
              <li>Privacy: ANPR/CCTV and app data handled under UK GDPR/DPA; proportionate, transparent use</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      

      {/* Ancillary Services Revenue Potential */}
      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Ancillary Services Revenue Potential</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 mb-3">Subject to site surveys — projected upside from additional services</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div className="rounded border p-4 space-y-1">
                <p className="font-medium">Smart Lockers</p>
                <p className="text-sm">£36k</p>
                <p className="text-xs text-gray-600">Per year recurring revenue</p>
              </div>
              <div className="rounded border p-4 space-y-1">
                <p className="font-medium">Digital Signage</p>
                <p className="text-sm">£4k–£40k</p>
                <p className="text-xs text-gray-600">Per year depending on location</p>
              </div>
              <div className="rounded border p-4 space-y-1">
                <p className="font-medium">WeBuyAnyCar.com</p>
                <p className="text-sm">£15k–£20k</p>
                <p className="text-xs text-gray-600">Per year per site</p>
              </div>
              <div className="rounded border p-4 space-y-1">
                <p className="font-medium">Tesla Test Drive Centre</p>
                <p className="text-sm">£50k</p>
                <p className="text-xs text-gray-600">Per year per site</p>
              </div>
              <div className="rounded border p-4 space-y-1">
                <p className="font-medium">Waterless Car Wash</p>
                <p className="text-sm">£12k–£45k/year</p>
                <p className="text-xs text-gray-600">Eco-friendly car washing; minimal water usage</p>
              </div>
              <div className="rounded border p-4 space-y-1">
                <p className="font-medium">Courier Partnerships</p>
                <p className="text-sm">Up to £30k/year per site</p>
                <p className="text-xs text-gray-600">Delivery partnerships for efficient logistics</p>
              </div>
              <div className="rounded border p-4 space-y-1">
                <p className="font-medium">Markets & Events</p>
                <p className="text-sm">Flexible activation</p>
                <p className="text-xs text-gray-600">Pop-up markets and community events</p>
              </div>
            </div>
            <div className="rounded border p-4 text-xs text-gray-600 mt-4">
              <p className="font-medium">Implementation Notes</p>
              <p>All opportunities subject to site survey and feasibility assessment. Partnership negotiations and planning permissions may apply.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Commercial Offer (Close) */}
      <section className="space-y-3">
        <Card>
          <CardHeader>
            <CardTitle>Commercial Offer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">ParkBunny deploys a fully managed, no-CapEx model to activate local partnerships and convert demand into measurable parking revenue. We provide multi-location partner management, in-app promotions, and centralized revenue tracking, with rapid time-to-value.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
              <div className="rounded border p-4">
                <p className="font-medium">What we deliver</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Partner sourcing and onboarding</li>
                  <li>Instant deals and demand activation</li>
                  <li>Analytics and uplift reporting</li>
                  <li>Ancillary services feasibility & rollouts</li>
                </ul>
              </div>
              <div className="rounded border p-4">
                <p className="font-medium">Next steps</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Confirm target locations and priorities</li>
                  <li>Site surveys and partner pipeline build</li>
                  <li>Pilot activation (4–6 weeks) and measure uplift</li>
                  <li>Scale to full estate</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <CommercialTerms />

      {/* Footer */}
      <footer className="border-t pt-6 text-xs text-gray-600">
        <p>ParkBunny • Contact: jon.sprank@parkbunny.app</p>
      </footer>
    </div>
  )
}


