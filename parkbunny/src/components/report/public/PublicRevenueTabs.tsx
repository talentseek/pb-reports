import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { SingleLocationChart, MultiLocationChart, CategoryContributionChart } from "@/components/report/CurrentVsPotentialChart"
import { SingleDistributionChart, MultiDistributionChart } from "@/components/report/DistributionCharts"

export default function PublicRevenueTabs({
  isMulti,
  totalCurrentRevenue,
  upliftValue,
  computedGrowthPercent,
  postcodes,
  locationSummaries,
  estimatedRevenuePerPostcode,
  dbCategorySet,
  categoryContributionRows,
  iconForCategory,
}: any) {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-primary">Revenue Enhancement Opportunity</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 mb-3">Current vs potential revenue with ParkBunny. The uplift shown reflects the modeled {computedGrowthPercent}% increase across analyzed locations.</p>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-primary/10">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">By Category</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            {!isMulti ? (
              <SingleLocationChart current={totalCurrentRevenue} uplift={upliftValue} />
            ) : (
              <MultiLocationChart rows={postcodes.map((pc: string) => {
                const loc = locationSummaries.find((l: any) => l.postcode === pc)
                const includedHere = (loc?.totalIncluded ?? 0)
                const totalIncludedAll = (locationSummaries || []).reduce((s: number, l: any) => s + (l.totalIncluded || 0), 0) || 1
                const share = includedHere / totalIncludedAll
                const current = (estimatedRevenuePerPostcode ?? 50000)
                const uplift = Math.round(upliftValue * share)
                return { postcode: pc, current, uplift }
              })} />
            )}
          </TabsContent>
          <TabsContent value="categories">
            <CategoryContributionChart rows={categoryContributionRows} />
          </TabsContent>
          <TabsContent value="distribution">
            {!isMulti ? (
              <SingleDistributionChart rows={(locationSummaries[0]?.countsByCategory ?? []).map((c: any) => ({ category: `${iconForCategory(c.category)} ${c.category}`, count: c.included }))} />
            ) : (
              <MultiDistributionChart
                rows={postcodes.map((pc: string) => {
                  const loc = locationSummaries.find((l: any) => l.postcode === pc)
                  const total = Math.max(1, loc?.totalIncluded || 0)
                  const row: any = { name: pc }
                  for (const c of loc?.countsByCategory || []) {
                    row[c.category] = Math.round((100 * c.included) / total)
                  }
                  return row
                })}
                categories={Array.from(dbCategorySet) as string[]}
                colors={{
                  "Lodging (Hotels)": '#D05D8B',
                  "Shopping (Retail)": '#d946ef',
                  "Services": '#64748b',
                  "Food and Drink": '#f59e0b',
                  "Health and Wellness": '#10b981',
                  "Entertainment and Recreation": '#22c55e',
                  "Sports": '#3b82f6',
                  // Legacy
                  'Hotels & Accommodation': '#D05D8B',
                  'Restaurants & Cafes': '#f59e0b',
                  'Bars & Nightlife': '#a855f7',
                  'Fitness & Wellness': '#10b981',
                  'Offices & Coworking': '#64748b',
                  'Events & Conferences': '#ef4444',
                  'Entertainment & Venues': '#22c55e',
                  'Retail & Services': '#d946ef',
                  'Community & Public': '#94a3b8',
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}


