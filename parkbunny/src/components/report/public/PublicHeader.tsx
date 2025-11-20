import DownloadPdfButton from "@/components/report/DownloadPdfButton"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { PLACE_CATEGORIES } from "@/lib/placesCategories"

function iconForCategory(cat: string): string {
  switch (cat) {
    case 'Lodging (Hotels)': return '🏨'
    case 'Shopping (Retail)': return '🛍️'
    case 'Services': return '🛠️'
    case 'Food and Drink': return '🍽️'
    case 'Health and Wellness': return '🧘'
    case 'Entertainment and Recreation': return '🎭'
    case 'Sports': return '⚽'
    // Legacy
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
    <header className="space-y-6 print:space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image src="/logo.png" alt="ParkBunny" width={200} height={48} className="h-12 w-auto" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Revenue Enhancement Report</h1>
            <p className="text-sm text-gray-600">Prepared for: {reportName || 'Client'}</p>
            <p className="text-xs text-gray-600 mt-1">Scope: {locationCount} location{locationCount > 1 ? 's' : ''} • Postcodes analyzed: {postcodes} • Report date: {new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </div>
        <DownloadPdfButton />
      </div>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2">
              <h2 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight">
                Unlock <span className="text-primary font-bold">new revenue</span> by activating nearby businesses and rewarding drivers
                <span className="text-gray-800"> — with no CapEx or extra ops.</span>
              </h2>
              <p className="text-sm text-gray-700 mt-3">There are ~17k–20k public off‑street car parks in Great Britain, yet most remain transactional rather than demand‑driven.</p>
              <p className="text-xs text-gray-700 mt-3">ParkBunny activates partnerships through deals with:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PLACE_CATEGORIES.map((c) => (
                  <Badge key={c.group} variant="default" className="capitalize">
                    {iconForCategory(c.group)} {c.group}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="w-full h-80 lg:h-[28rem] flex items-center justify-center">
                <Image src="/rabbit.webp" alt="ParkBunny" width={1300} height={1616} className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </header>
  )
}


