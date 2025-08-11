import DownloadPdfButton from "@/components/report/DownloadPdfButton"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function PublicHeader({
  reportName,
  locationCount,
  postcodes,
  topCategoryLabels,
}: {
  reportName: string
  locationCount: number
  postcodes: string
  topCategoryLabels: string[]
}) {
  return (
    <header className="space-y-4 print:space-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-wide text-gray-500">ParkBunny</p>
          <h1 className="text-3xl font-semibold">ParkBunny Revenue Enhancement Report</h1>
          <p className="text-sm text-gray-600">Prepared for: {reportName || 'Client'}</p>
          <p className="text-xs text-gray-600 mt-1">Scope: {locationCount} location{locationCount>1?'s':''} • Postcodes analyzed: {postcodes} • Report date: {new Date().toLocaleDateString('en-GB')}</p>
        </div>
        <DownloadPdfButton />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent>
            <p className="text-gray-800">Unlock new revenue by activating nearby businesses and rewarding drivers — with no CapEx or extra ops.</p>
            <p className="text-xs text-gray-600 mt-2">There are ~17k–20k public off‑street car parks in Great Britain, yet most remain transactional rather than demand‑driven.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {topCategoryLabels.map((label) => (
                <Badge key={label} variant="secondary" className="capitalize">{label}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="w-full h-28 bg-gray-100 rounded flex items-center justify-center text-gray-500">Hero image</div>
          </CardContent>
        </Card>
      </div>
    </header>
  )
}


