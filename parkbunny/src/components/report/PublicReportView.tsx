import { calculateRevenuePotential, defaultSettings } from "@/lib/calculations"
import DownloadPdfButton from "@/components/report/DownloadPdfButton"

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

export default function PublicReportView({ report }: { report: any }) {
  const safeSettings = (report.settings && typeof report.settings === 'object') ? (report.settings as any) : {}
  const revenue = calculateRevenuePotential(
    (report.businesses ?? []).map((b: any) => ({ category: b.category as any })),
    { ...defaultSettings, ...safeSettings },
  )

  const totalBusinesses = (report.businesses ?? []).length
  const categories = getCategoryBreakdown(report.businesses ?? [])
  const estimatedRevenuePerPostcode: number | undefined = safeSettings?.estimatedRevenuePerPostcode
  const postcodesCount: number = safeSettings?.postcodesCount ?? 1
  const postcodes = parsePostcodes(report.postcodes)
  const totalCurrentRevenue = (estimatedRevenuePerPostcode ?? 50000) * (postcodes.length || postcodesCount || 1)
  const assumedGrowthPercent = 21 // headline
  const growthValue = Math.round((totalCurrentRevenue * assumedGrowthPercent) / 100)

  return (
    <div className="space-y-10">
      <header className="space-y-3 print:space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{report.name}</h1>
            <p className="text-sm text-gray-600">Prepared for: Agena Group</p>
          </div>
          <DownloadPdfButton />
        </div>
        <p className="text-sm text-gray-600">Postcodes analyzed: {report.postcodes}</p>
        <p className="text-gray-700">Unlock Your Parking Revenue Potential — increase parking revenue by 20–25% through smart business partnerships across all locations. No CapEx, fully managed, instant impact.</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded border p-4">
          <p className="text-xs text-gray-600">Projected revenue</p>
          <p className="text-xl font-semibold">{formatCurrency(revenue)}</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-xs text-gray-600">Total businesses</p>
          <p className="text-xl font-semibold">{totalBusinesses}</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-xs text-gray-600">Categories</p>
          <p className="text-xl font-semibold">{categories.length}</p>
        </div>
      </section>

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
          <p className="text-xl font-semibold">+{assumedGrowthPercent}%</p>
          <p className="text-xs text-gray-500">≈ {formatCurrency(growthValue)} uplift</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Revenue Enhancement Opportunity</h2>
        <p className="text-sm text-gray-700">Current vs Potential Revenue with ParkBunny (Average {assumedGrowthPercent}% growth potential).</p>
        <div className="w-full h-64 rounded border bg-gray-100 flex items-center justify-center text-gray-500">
          Chart placeholder: Current vs Potential
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Assumptions</h2>
        {estimatedRevenuePerPostcode ? (
          <p className="text-sm text-gray-700">£{estimatedRevenuePerPostcode} per postcode × {postcodesCount} postcode(s)</p>
        ) : (
          <p className="text-sm text-gray-700">Defaults applied</p>
        )}
        <p className="text-xs text-gray-500">Uplift and sign-up rates based on ParkBunny defaults unless configured per report.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Business breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map(([cat, count]) => (
            <div key={cat} className="rounded border p-3 flex items-center justify-between">
              <span className="capitalize">{cat}</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Map Overview</h2>
        <p className="text-sm text-gray-700">Visual representation of analyzed car parks and nearby business clusters. (Placeholder map; will be populated from Google Places results.)</p>
        <div className="w-full h-72 rounded border bg-gray-100 flex items-center justify-center text-gray-500">
          Map placeholder
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Executive Summary of Local Area</h2>
        <p className="text-sm text-gray-700">This area presents strong demand drivers from hospitality, fitness, and professional services. Weekday occupancy is influenced by nearby offices and co-working hubs, while evening and weekend peaks are driven by restaurants and entertainment venues. ParkBunny’s instant deals and local partnerships can convert these audiences with minimal friction. (This narrative can be generated via OpenAI with live POI context.)</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Revenue Enhancement by Location</h2>
        <div className="w-full h-64 rounded border bg-gray-100 flex items-center justify-center text-gray-500">
          Chart placeholder: Growth potential by location
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">Parking Locations</h2>
        <p className="text-sm text-gray-700">Overview of analyzed car parks and nearby business mix.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {postcodes.map((pc) => {
            const uplift = pseudoRandomPercentFromCode(pc)
            const current = estimatedRevenuePerPostcode ?? 50000
            const growth = Math.round((current * uplift) / 100)
            const total = current + growth
            const top3 = categories.slice(0, 3)
            return (
              <div key={pc} className="rounded border p-4 space-y-3">
                <div>
                  <p className="font-medium">{pc}</p>
                  <p className="text-xs text-green-700 font-medium">+{uplift}% uplift</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded border p-2">
                    <p className="text-xs text-gray-600">Current</p>
                    <p className="font-medium">{formatCurrency(current)}</p>
                  </div>
                  <div className="rounded border p-2">
                    <p className="text-xs text-gray-600">Growth</p>
                    <p className="font-medium">+{formatCurrency(growth)}</p>
                  </div>
                  <div className="rounded border p-2 col-span-2">
                    <p className="text-xs text-gray-600">Total Potential</p>
                    <p className="font-medium">{formatCurrency(total)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Top 3 Business Types</p>
                  <ul className="text-sm list-disc pl-4">
                    {top3.map(([c, n]) => (
                      <li key={String(c)} className="capitalize">{c} <span className="text-gray-500">({n})</span></li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Partnership Opportunities</h2>
        <p className="text-sm text-gray-700">Nearby businesses driving parking demand. Mix varies by location; categories below reflect the broader opportunity.</p>
        <div className="w-full h-56 rounded border bg-gray-100 flex items-center justify-center text-gray-500">
          Chart placeholder: Business type distribution
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">Additional Revenue Streams</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded border p-4">
            <p className="font-medium">Digital Signage</p>
            <p className="text-sm text-gray-600">High footfall areas</p>
            <p className="text-sm">£4K - £40K</p>
            <p className="text-xs text-gray-500">Subject to survey</p>
          </div>
          <div className="rounded border p-4">
            <p className="font-medium">WeBuyAnyCar.com</p>
            <p className="text-sm text-gray-600">8-12 spaces</p>
            <p className="text-sm">£15K - £20K / year</p>
          </div>
          <div className="rounded border p-4">
            <p className="font-medium">Tesla</p>
            <p className="text-sm text-gray-600">3 spaces test drive centre</p>
            <p className="text-sm">£50K</p>
            <p className="text-xs text-gray-500">Affluent areas</p>
          </div>
          <div className="rounded border p-4">
            <p className="font-medium">Amazon Lockers</p>
            <p className="text-sm text-gray-600">Convenient pickup points</p>
            <p className="text-sm">£5K - £8K / year</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Evolution Of Parking</h2>
        <p className="text-sm text-gray-700">ParkBunny is a revolutionary Parking & Marketing app: leverage additional income for shopping centres, increase footfall for retailers, and unlock alternative revenue streams.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="rounded border p-4 space-y-2">
            <p className="font-medium">The Evolution Of Parking - A New Opportunity</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>Traditional Parking = Transactional</li>
              <li>No direct way to communicate with drivers and families</li>
              <li>No visibility on footfall or driver behaviour</li>
              <li>No tools to support independent retailers</li>
            </ul>
          </div>
          <div className="rounded border p-4 space-y-2">
            <p className="font-medium">With ParkBunny</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>Instant Deals to support independent retailers</li>
              <li>Turn car parks into smart, data-driven customer acquisition hubs</li>
              <li>Real time footfall and behaviour tracking</li>
              <li>Direct comms with drivers via in-app promo and messaging</li>
            </ul>
          </div>
        </div>
        <div className="rounded border p-4 text-sm space-y-1">
          <p className="font-medium">Parking is Transactional — ParkBunny Makes it Profitable</p>
          <ul className="list-disc pl-5 text-gray-700 space-y-1">
            <li>Drive Footfall to Your Tenants</li>
            <li>Instant Deals platform promotes retailers & fills quiet periods</li>
            <li>Nearby Business Activation engages hotels, gyms, offices</li>
            <li>Direct Communication with Drivers for events, offers & activities</li>
            <li>No CapEx — fully managed</li>
            <li>Simple Payment — cashless parking</li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Contact</h2>
        <p className="text-sm">jon.sprank@parkbunny.app</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-medium">ParkBunny Solutions</h2>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Revenue Driving: drive footfall via instant deals and partner packages.</li>
          <li>Nearby Business Activation: engage hotels, gyms, and offices to fill underutilized spaces.</li>
          <li>Direct Communication: promote events and offers to drivers via the app.</li>
          <li>Zero CapEx: fully managed by ParkBunny; simple, cashless payments.</li>
        </ul>
      </section>
    </div>
  )
}


