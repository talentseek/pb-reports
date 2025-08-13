import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardHelpPage() {
  return (
    <main className="mx-auto max-w-5xl p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Help & Guide</h1>
        <Link href="/dashboard" className="underline text-sm">Back to dashboard</Link>
      </header>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
        <CardHeader>
          <CardTitle className="text-primary">Quick start</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6">
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Create a report (Dashboard → Create New Report). Enter:
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Report name and UK postcodes (comma‑separated)</li>
                <li>Estimated revenue per postcode (defaults to £50,000)</li>
                <li>Search radius (e.g., 0.75 miles) and max results per category</li>
              </ul>
            </li>
            <li>
              Open the report → press Refresh Places. Choose Normal (uses cached data if fresh) or Force (re‑pulls data now).
            </li>
            <li>
              Review maps and categories. Click a category tile to open the drawer and include/exclude individual businesses.
            </li>
            <li>
              Tune assumptions in Settings (uplift % and sign‑up % per category). Projections update from included businesses only.
            </li>
            <li>
              Optional: Share a public link (Settings). Enable, set a password, and copy <code>/share/{'{'}code{'}'}</code> to preview.
            </li>
          </ol>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Reports & data</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 space-y-2">
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium">Radius enforcement:</span> We search within a strict circle and filter by distance. Change radius → Force refresh.</li>
              <li><span className="font-medium">Categories:</span> Hotels, Restaurants, Bars, Fitness, Offices, Events, Entertainment, Retail, Community.</li>
              <li><span className="font-medium">Include/exclude:</span> Use the category drawer to toggle places. Projections only count included items.</li>
              <li><span className="font-medium">Caching:</span> Normal refresh reuses fresh data (e.g., last 12h). Force refresh bypasses cache.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Revenue model</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 space-y-2">
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium">Baseline:</span> Estimated revenue per postcode × number of postcodes.</li>
              <li><span className="font-medium">Uplift:</span> Sum over categories of (included businesses × sign‑up % × uplift %) × baseline per postcode.</li>
              <li><span className="font-medium">Assumptions:</span> Adjust sign‑up % and uplift % per category in Settings to fit your market.</li>
              <li><span className="font-medium">Scenarios:</span> View Conservative/Expected/Stretch in the public summary to communicate ranges.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Public sharing</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 space-y-2">
            <ul className="list-disc pl-5 space-y-1">
              <li>Enable sharing and set a password to generate a protected link.</li>
              <li>Copy the link from the report header or your dashboard list.</li>
              <li>Disable or regenerate anytime. Views can be counted for analytics in a future update.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">API cost management</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 space-y-2">
            <ul className="list-disc pl-5 space-y-1">
              <li>Start with a smaller radius and lower max results. Increase only if needed.</li>
              <li>Use Normal refresh first; use Force refresh for major changes or stale data.</li>
              <li>Check the in‑app cost estimate shown in the Refresh Places menu before running.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-primary/20 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-primary">Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 space-y-3">
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium">No places appear:</span> Ensure the API is enabled in your Google project and run Force refresh.</li>
              <li><span className="font-medium">Results outside radius:</span> We filter by distance; confirm the radius and Force refresh after changing it.</li>
              <li><span className="font-medium">Public page shows old content:</span> Hard refresh the <code>/share/{'{'}code{'}'}</code> page or append <code>?ts=123</code>.</li>
              <li><span className="font-medium">Errors on refresh:</span> Try again with a smaller radius or fewer results; check console/server logs.</li>
            </ul>
            <p>
              Need help? <a href="mailto:hello@parkbunny.app" className="underline">hello@parkbunny.app</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}


