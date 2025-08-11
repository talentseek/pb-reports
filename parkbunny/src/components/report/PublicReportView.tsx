import { calculateRevenuePotential, defaultSettings } from "@/lib/calculations"
import DownloadPdfButton from "@/components/report/DownloadPdfButton"
import { getReportLocationSummaries } from "@/lib/placesSummary"

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

export default async function PublicReportView({ report }: { report: any }) {
  const safeSettings = (report.settings && typeof report.settings === 'object') ? (report.settings as any) : {}
  const postcodes = parsePostcodes(report.postcodes)
  const locationSummaries = await getReportLocationSummaries(report.id)
  const revenue = calculateRevenuePotential(
    // Use included-only category counts if available
    (await getReportLocationSummaries(report.id)).flatMap((loc) =>
      loc.countsByCategory.flatMap((c) => Array.from({ length: c.included }, () => ({ category: c.category })))
    ),
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

  return (
    <div className="space-y-12">
      {/* Cover / Executive Intro */}
      <header className="space-y-4 print:space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-wide text-gray-500">ParkBunny</p>
            <h1 className="text-3xl font-semibold">Multi-Location Revenue Enhancement Report</h1>
            <p className="text-sm text-gray-600">Prepared for: Agena Group</p>
          </div>
          <DownloadPdfButton />
        </div>
        <p className="text-gray-800">Unlock your parking revenue potential. ParkBunny partners with local businesses to drive measurable, recurring uplift across your car parks — without CapEx or additional operational burden.</p>
        <p className="text-sm text-gray-600">Postcodes analyzed: {report.postcodes}</p>
      </header>

      {/* Headline Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded border p-4">
          <p className="text-xs text-gray-600">Projected uplift</p>
          <p className="text-xl font-semibold">{formatCurrency(upliftValue)}</p>
          <p className="text-xs text-gray-600 mt-1">Based on uplift scenarios applied to local business mix</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-xs text-gray-600">Total businesses</p>
          <p className="text-xl font-semibold">{totalBusinesses}</p>
          <p className="text-xs text-gray-600 mt-1">Identified partners across analyzed postcodes</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-xs text-gray-600">Categories</p>
          <p className="text-xl font-semibold">{derivedCategoriesCount}</p>
          <p className="text-xs text-gray-600 mt-1">Diverse coverage (e.g., restaurants, gyms, hotels)</p>
        </div>
      </section>

      {/* Context Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded border p-4">
          <p className="text-xs text-gray-600">Total Current Revenue</p>
          <p className="text-xl font-semibold">{formatCurrency(totalCurrentRevenue)}</p>
          <p className="text-xs text-gray-500">Annual</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-xs text-gray-600">Car Parks Analyzed</p>
          <p className="text-xl font-semibold">{postcodes.length || postcodesCount}</p>
          <p className="text-xs text-gray-500">Locations</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-xs text-gray-600">Revenue Potential</p>
          <p className="text-xl font-semibold">+{computedGrowthPercent}%</p>
          <p className="text-xs text-gray-500">≈ {formatCurrency(upliftValue)} uplift</p>
        </div>
      </section>

      {/* Map Overview (High-level) - only for single location */}
      {!isMulti && (
        <section className="space-y-3">
          <h2 className="text-xl font-medium">Map Overview</h2>
          <p className="text-sm text-gray-700">Visual representation of the analyzed car park and nearby business clusters. This informs our partnership targeting and expected demand uplift within the micro-market.</p>
          <div className="w-full h-72 rounded border bg-gray-100 flex items-center justify-center text-gray-500">
            {locationSummaries[0]?.latitude && locationSummaries[0]?.longitude
              ? `Map (${locationSummaries[0].latitude.toFixed(3)}, ${locationSummaries[0].longitude.toFixed(3)})`
              : 'Map placeholder'}
          </div>
        </section>
      )}

      {/* Assumptions */}
      <section className="space-y-2">
        <h2 className="text-xl font-medium">Assumptions</h2>
        {estimatedRevenuePerPostcode ? (
          <p className="text-sm text-gray-700">£{estimatedRevenuePerPostcode} per postcode × {postcodesCount} postcode(s)</p>
        ) : (
          <p className="text-sm text-gray-700">Defaults applied</p>
        )}
        <p className="text-xs text-gray-500">Uplift and sign-up rates reflect ParkBunny defaults unless configured per report. We use conservative benchmarks from comparable sites.</p>
      </section>

      {/* Category Breakdown (Detail) - only for single location */}
      {!isMulti && (
        <section className="space-y-3">
          <h2 className="text-xl font-medium">Business Breakdown</h2>
          <p className="text-sm text-gray-700">Distribution of local business types identified near the location. Categories with higher counts typically correlate with stronger on-peak demand, and thus higher parking conversion potential.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(locationSummaries[0]?.countsByCategory ?? []).map((entry) => (
              <div key={entry.category} className="rounded border p-3 flex items-center justify-between">
                <span className="capitalize">{entry.category}</span>
                <span className="font-medium">{entry.included}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Executive Area Summary (Narrative) */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium">Executive Summary of the Local Area</h2>
        <p className="text-sm text-gray-700">The analyzed catchments present strong demand drivers across hospitality, fitness, and professional services. Weekday occupancy is shaped by nearby offices and co-working hubs; evenings and weekends benefit from restaurants and entertainment venues. Seasonal peaks (e.g., holidays, events) further lift demand. ParkBunny converts this latent demand via targeted partnerships and instant in-app offers.</p>
        <p className="text-sm text-gray-700">This narrative can be generated from live POI context using OpenAI for location-specific insights (e.g., notable attractions, regular events, transport hubs) to guide partnership prioritization.</p>
      </section>

      {/* Opportunity (Current vs Potential) */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium">Revenue Enhancement Opportunity</h2>
        <p className="text-sm text-gray-700">Current vs potential revenue with ParkBunny. The uplift shown reflects the modeled {computedGrowthPercent}% increase across analyzed locations.</p>
        <div className="w-full h-64 rounded border bg-gray-100 flex items-center justify-center text-gray-500">Chart placeholder: Current vs Potential</div>
      </section>

      {/* Per-Location Analysis (for multi-location) */}
      {isMulti && (
        <section className="space-y-4">
          <h2 className="text-xl font-medium">Per-Location Analysis</h2>
          <p className="text-sm text-gray-700">Each postcode section below includes its own map, indicative metrics, and a placeholder breakdown. Real per-location POI breakdowns will be wired once Google Places integration lands.</p>
          <div className="space-y-8">
            {postcodes.map((pc) => {
              const uplift = pseudoRandomPercentFromCode(pc)
              const current = estimatedRevenuePerPostcode ?? 50000
              const growth = Math.round((current * uplift) / 100)
              const total = current + growth
              const loc = locationSummaries.find((l) => l.postcode === pc)
              const top3 = (loc?.countsByCategory ?? categories.slice(0, 3)).slice(0, 3)
              return (
                <div key={pc} className="rounded border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-lg">{pc}</p>
                      <p className="text-xs text-green-700 font-medium">+{uplift}% uplift (indicative)</p>
                    </div>
                    <div className="w-64 h-32 rounded border bg-gray-100 flex items-center justify-center text-gray-500">{loc?.latitude && loc?.longitude ? `Map (${loc.latitude.toFixed(3)}, ${loc.longitude.toFixed(3)})` : 'Map placeholder'}</div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="rounded border p-3">
                      <p className="text-xs text-gray-600">Current</p>
                      <p className="font-medium">{formatCurrency(current)}</p>
                    </div>
                    <div className="rounded border p-3">
                      <p className="text-xs text-gray-600">Growth</p>
                      <p className="font-medium">+{formatCurrency(growth)}</p>
                    </div>
                    <div className="rounded border p-3">
                      <p className="text-xs text-gray-600">Total Potential</p>
                      <p className="font-medium">{formatCurrency(total)}</p>
                    </div>
                    <div className="rounded border p-3">
                      <p className="text-xs text-gray-600">Top Category</p>
                      <p className="font-medium capitalize">{(Array.isArray(top3[0]) ? (top3[0] as any)[0] : top3[0]?.category) ?? 'tbd'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Business Breakdown (placeholder)</p>
                    <ul className="text-sm list-disc pl-4 grid grid-cols-1 md:grid-cols-2 gap-1">
                      {top3.map((entry: any, idx: number) => {
                        const category = Array.isArray(entry) ? entry[0] : entry.category
                        const count = Array.isArray(entry) ? entry[1] : entry.count
                        return (
                          <li key={String(category) + idx} className="capitalize">{category} <span className="text-gray-500">({count})</span></li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
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

      {/* App Showcase */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium">Smart Parking Management (App)</h2>
        <p className="text-sm text-gray-700">Our platform enables multi-location partnership management, centralized revenue tracking, and instant promotional tools. Below are mockups illustrating the driver app and operator console.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded border h-64 bg-gray-100 flex items-center justify-center text-gray-500">App mockup placeholder</div>
          <div className="rounded border h-64 bg-gray-100 flex items-center justify-center text-gray-500">Dashboard mockup placeholder</div>
        </div>
      </section>

      {/* Distribution Overview */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium">Partnership Opportunities</h2>
        <p className="text-sm text-gray-700">Nearby businesses driving parking demand. Distribution varies by location; the illustrative mix below informs activation sequencing (e.g., hospitality first in the evening economy).</p>
        <div className="w-full h-56 rounded border bg-gray-100 flex items-center justify-center text-gray-500">Chart placeholder: Business type distribution</div>
      </section>

      {/* Ancillary Services Revenue Potential */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium">Ancillary Services Revenue Potential</h2>
        <p className="text-sm text-gray-700">Subject to site surveys — projected upside from additional services</p>
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
        <div className="rounded border p-4 text-xs text-gray-600">
          <p className="font-medium">Implementation Notes</p>
          <p>All opportunities subject to site survey and feasibility assessment. Partnership negotiations and planning permissions may apply.</p>
        </div>
      </section>

      {/* Commercial Offer (Close) */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium">Commercial Offer</h2>
        <p className="text-sm text-gray-700">ParkBunny deploys a fully managed, no-CapEx model to activate local partnerships and convert demand into measurable parking revenue. We provide multi-location partner management, in-app promotions, and centralized revenue tracking, with rapid time-to-value.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
      </section>

      {/* Commercial Terms */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium">Commercial Terms</h2>
        <p className="text-sm text-gray-700">Transparent Fee Structure — simple and clear commercial terms</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded border p-4 space-y-3">
            <p className="font-medium">Transparent Fee Structure</p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded border p-3 flex flex-col gap-1">
                <p className="text-xs text-gray-600">% Transaction Fee</p>
                <p className="text-lg font-semibold">Per booking</p>
                <p className="text-2xl font-bold">1.5%</p>
              </div>
              <div className="rounded border p-3 flex flex-col gap-1">
                <p className="text-xs text-gray-600">£ Convenience Fee</p>
                <p className="text-lg font-semibold">Per booking</p>
                <p className="text-2xl font-bold">25p</p>
              </div>
              <div className="rounded border p-3 flex flex-col gap-1">
                <p className="text-xs text-gray-600">Signage & Installation</p>
                <p className="text-lg font-semibold">Provided at no cost</p>
                <p className="text-2xl font-bold text-emerald-700">FREE</p>
              </div>
            </div>
          </div>
          <div className="rounded border p-4 space-y-3">
            <p className="font-medium">Pilot Program</p>
            <p className="text-sm text-gray-700">Risk-free trial period</p>
            <div className="rounded border p-3 text-center">
              <p className="text-xs text-gray-600">Pilot duration</p>
              <p className="text-3xl font-bold">4</p>
              <p className="text-sm font-medium">Month Pilot</p>
              <p className="text-xs text-gray-600">Demonstrate value and performance</p>
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ AI-generated signage mockups</li>
              <li>✓ Monthly transparent reporting</li>
              <li>✓ Dedicated control panel access</li>
              <li>✓ Real-time tariff updates</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t pt-6 text-xs text-gray-600">
        <p>ParkBunny • Contact: jon.sprank@parkbunny.app</p>
      </footer>
    </div>
  )
}


