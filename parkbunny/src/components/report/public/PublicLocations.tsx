import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const PublicLocationMap = dynamic(() => import("@/components/report/PublicLocationMap"), { ssr: false })

export function SingleMap({ center, markers, apiKey }: any) {
  return (
    <Card>
      <CardHeader><CardTitle>Map Overview</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 mb-3">Visual representation of the analyzed car park and nearby business clusters. This informs our partnership targeting and expected demand uplift within the micro-market.</p>
        <div className="w-full h-80 rounded border bg-gray-100">
          {center?.lat && center?.lng ? (
            <PublicLocationMap apiKey={apiKey} center={center} markers={markers} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">Map placeholder</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function MultiLocationSection({
  postcodes,
  locationSummaries,
  markersByPostcode,
  estimatedRevenuePerPostcode,
  iconForCategory,
  rateForCategory,
  apiKey,
}: any) {
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-medium">Per-Location Analysis</h2>
      <p className="text-sm text-gray-700">Each postcode section includes its own full-width map and indicative metrics derived from local business mix.</p>
      <div className="space-y-10">
        {postcodes.map((pc: string) => {
          const loc = locationSummaries.find((l: any) => l.postcode === pc)
          const current = estimatedRevenuePerPostcode ?? 50000
          const markers = markersByPostcode?.[pc] ?? []
          const top3 = (loc?.countsByCategory ?? []).slice(0,3)
          return (
            <Card key={pc}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-lg">{pc}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full h-80 border rounded bg-gray-100">
                  {loc?.latitude && loc?.longitude ? (
                    <PublicLocationMap apiKey={apiKey} center={{ lat: loc.latitude as number, lng: loc.longitude as number }} markers={markers} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">Map placeholder</div>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-4">
                  <div className="rounded border p-3">
                    <p className="text-xs text-gray-600">Current</p>
                    <p className="font-medium">£{current.toLocaleString('en-GB')}</p>
                  </div>
                  <div className="rounded border p-3">
                    <p className="text-xs text-gray-600">Top Category</p>
                    <p className="font-medium capitalize">{(Array.isArray(top3[0]) ? (top3[0] as any)[0] : top3[0]?.category) ?? 'tbd'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-gray-600 mb-2">Business Breakdown</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(loc?.countsByCategory ?? []).map((entry: any) => {
                      const { uplift, signUp } = rateForCategory(entry.category)
                      const pct = Math.round(entry.included * signUp * uplift * 1000) / 10
                      return (
                        <div key={entry.category} className="rounded border p-2 flex items-center justify-between">
                          <span className="capitalize flex items-center gap-2">{iconForCategory(entry.category)} {entry.category}</span>
                            <span className="text-sm text-right">
                            <span className="mr-2 font-medium">{entry.included}</span>
                              <span className="font-medium">+{pct}%</span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}


