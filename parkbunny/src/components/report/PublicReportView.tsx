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
          <p className="text-xl font-semibold">£{revenue}</p>
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


