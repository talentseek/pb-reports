import { Card, CardContent } from "@/components/ui/card"

export function HeadlineMetrics({
  upliftValue,
  growthPercent,
  totalBusinesses,
  categories,
  formatCurrency,
}: {
  upliftValue: number
  growthPercent: number
  totalBusinesses: number
  categories: number
  formatCurrency: (n:number)=>string
}) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-gray-600">Projected uplift</p>
          <p className="text-xl font-semibold">{formatCurrency(upliftValue)} <span className="text-sm font-medium">(+{growthPercent}%)</span></p>
          <p className="text-xs text-gray-600 mt-1">Based on uplift scenarios applied to local business mix</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-gray-600">Total businesses</p>
          <p className="text-xl font-semibold">{totalBusinesses}</p>
          <p className="text-xs text-gray-600 mt-1">Identified partners across analyzed postcodes</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-gray-600">Categories</p>
          <p className="text-xl font-semibold">{categories}</p>
          <p className="text-xs text-gray-600 mt-1">Diverse coverage (e.g., restaurants, gyms, hotels)</p>
        </CardContent>
      </Card>
    </section>
  )
}

export function ContextMetrics({
  totalCurrentRevenue,
  locations,
  growthPercent,
  upliftValue,
  formatCurrency,
}: {
  totalCurrentRevenue: number
  locations: number
  growthPercent: number
  upliftValue: number
  formatCurrency: (n:number)=>string
}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card><CardContent className="p-4"><p className="text-xs text-gray-600">Total Current Revenue</p><p className="text-xl font-semibold">{formatCurrency(totalCurrentRevenue)}</p><p className="text-xs text-gray-500">Annual</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs text-gray-600">Car Parks Analyzed</p><p className="text-xl font-semibold">{locations}</p><p className="text-xs text-gray-500">Locations</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs text-gray-600">Revenue Potential</p><p className="text-xl font-semibold">+{growthPercent}%</p><p className="text-xs text-gray-500">≈ {formatCurrency(upliftValue)} uplift</p></CardContent></Card>
    </section>
  )
}


