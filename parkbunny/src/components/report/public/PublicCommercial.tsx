import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export function AncillaryServices() {
  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Ancillary Services Revenue Potential</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-3">Subject to site surveys — projected upside from additional services</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[
              ['Smart Lockers','£36k','Per year recurring revenue'],
              ['Digital Signage','£4k–£40k','Per year depending on location'],
              ['WeBuyAnyCar.com','£15k–£20k','Per year per site'],
              ['Tesla Test Drive Centre','£50k','Per year per site'],
              ['Waterless Car Wash','£12k–£45k/year','Eco-friendly; minimal water usage'],
              ['Courier Partnerships','Up to £30k/year','Delivery partnerships'],
              ['Markets & Events','Flexible activation','Pop-up markets and community events'],
            ].map(([title,amount,desc]) => (
              <div key={String(title)} className="rounded border p-4 space-y-1">
                <p className="font-medium">{title}</p>
                <p className="text-sm">{amount}</p>
                <p className="text-xs text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
          <div className="rounded border p-4 text-xs text-gray-600 mt-4">
            <p className="font-medium">Implementation Notes</p>
            <p>All opportunities subject to site survey and feasibility assessment. Partnership negotiations and planning permissions may apply.</p>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export function CommercialOffer() {
  return (
    <section className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Commercial Offer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">ParkBunny deploys a fully managed, no-CapEx model to activate local partnerships and convert demand into measurable parking revenue. We provide multi-location partner management, in-app promotions, and centralized revenue tracking, with rapid time-to-value.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
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
        </CardContent>
      </Card>
    </section>
  )
}

export function CommercialTerms() {
  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Commercial Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">Transparent, simple pricing aligned to delivery.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fee structure */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Transparent Fee Structure</p>
              <div className="overflow-x-auto rounded border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <div className="text-sm">Transaction fee</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-xl font-semibold leading-tight">1.5%</div>
                        <div className="text-xs text-gray-600">Per booking</div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <div className="text-sm">Convenience fee</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-xl font-semibold leading-tight">25p</div>
                        <div className="text-xs text-gray-600">Per booking</div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <div className="text-sm">Signage & installation</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-xl font-semibold leading-tight">FREE</div>
                        <div className="text-xs text-gray-600">Provided at no cost</div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pilot program */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Pilot Program</p>
              <div className="overflow-x-auto rounded border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <div className="text-sm">Pilot length</div>
                        <div className="text-xs text-gray-600">Risk‑free trial</div>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">4 months</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                <li>AI‑generated signage mockups</li>
                <li>Monthly transparent reporting</li>
                <li>Dedicated control panel access</li>
                <li>Real‑time tariff updates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}


