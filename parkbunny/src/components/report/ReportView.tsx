import { calculateRevenuePotential, defaultSettings } from "@/lib/calculations";
import { getReportLocationSummaries } from "@/lib/placesSummary";
import { CategoryTileClient } from "@/components/report/ReportViewClient";
import LocationStatusButton from "@/components/LocationStatusButton";

export default async function ReportView({ report }: { report: any }) {
  const safeSettings = (report.settings && typeof report.settings === 'object') ? (report.settings as any) : {};
  const summaries = await getReportLocationSummaries(report.id)
  const dbTotalPlaces = summaries.reduce((sum, l) => sum + (l.totalIncluded || 0), 0)
  const dbCategorySet = new Set<string>()
  for (const loc of summaries) for (const c of loc.countsByCategory) dbCategorySet.add(c.category)

  const includedBusinessList = summaries.flatMap((loc) =>
    loc.countsByCategory.flatMap((c) => Array.from({ length: c.included }, () => ({ category: c.category })))
  )
  const revenue = calculateRevenuePotential(
    includedBusinessList,
    { ...defaultSettings, ...safeSettings },
  );
  const estimatedRevenuePerPostcode: number = safeSettings?.estimatedRevenuePerPostcode ?? 50000
  const postcodesCount: number = safeSettings?.postcodesCount ?? 1
  const totalCurrentRevenue = estimatedRevenuePerPostcode * postcodesCount
  const computedGrowthPercent = Math.round((revenue / Math.max(1, totalCurrentRevenue)) * 100)

  return (
    <>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{report.name}</h1>
          <p className="text-sm text-gray-600">Postcodes: {report.postcodes}</p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <div className="rounded border p-4">
          <p className="text-xs text-gray-600">Projected uplift</p>
          <p className="text-xl font-semibold">£{revenue} <span className="text-sm font-medium">(+{computedGrowthPercent}%)</span></p>
        </div>
        <div className="rounded border p-4">
          <p className="text-xs text-gray-600">Total businesses</p>
          <p className="text-xl font-semibold">{dbTotalPlaces}</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-xs text-gray-600">Categories</p>
          <p className="text-xl font-semibold">{dbCategorySet.size}</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-xs text-gray-600">Location Status</p>
          <p className="text-xl font-semibold">
            {summaries.filter(l => l.status === 'LIVE').length} Live / {summaries.length} Total
          </p>
        </div>
      </section>

      {summaries.length > 0 && (
        <section className="space-y-4 mt-6">
          <h2 className="text-xl font-medium">Per-location breakdown</h2>
          <div className="space-y-6">
            {summaries.map((loc) => (
              <div key={loc.id} className="rounded border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{loc.postcode}</p>
                    <p className="text-xs text-gray-600">{loc.latitude?.toFixed(3)}, {loc.longitude?.toFixed(3)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-700">Total places: <span className="font-medium">{loc.totalPlaces}</span></div>
                    <LocationStatusButton 
                      locationId={loc.id}
                      reportId={report.id}
                      status={loc.status}
                      postcode={loc.postcode}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {loc.countsByCategory.map((c) => (
                    <CategoryTileClient key={c.category} reportId={report.id} postcode={loc.postcode} category={c.category} count={c.included} total={c.total} />
                  ))}
                  <p className="text-xs text-gray-600">Counts show included/total.</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-medium mb-2">Assumptions</h2>
        {safeSettings?.estimatedRevenuePerPostcode && (
          <p className="text-sm text-gray-600">£{safeSettings.estimatedRevenuePerPostcode} per postcode × {safeSettings.postcodesCount ?? 1} postcode(s)</p>
        )}
        <p className="mt-2">
          <a href={`/reports/${report.id}/settings`} className="text-sm underline">Edit settings</a>
        </p>
      </section>
    </>
  );
}


