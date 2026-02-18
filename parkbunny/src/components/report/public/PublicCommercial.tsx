import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { StreamRevenueSummary } from "@/lib/revenue-streams"
import { STREAM_DEFAULTS } from "@/lib/revenue-streams"
import type { StreamType } from "@prisma/client"

type AncillaryProps = {
  streams: StreamRevenueSummary[]
  formatCurrency: (n: number) => string
}

export function AncillaryServices({ streams, formatCurrency }: AncillaryProps) {
  if (streams.length === 0) return null

  return (
    <section className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
        <CardHeader>
          <CardTitle className="text-primary">Additional Portfolio Uplift</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-gray-700">Subject to site surveys — projected upside from additional services deployed across the portfolio.</p>

          {streams.map((stream) => {
            const meta = STREAM_DEFAULTS[stream.streamType]
            return (
              <div key={stream.streamType} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="md:grid md:grid-cols-2">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{getStreamEmoji(stream.streamType)}</span>
                      <h3 className="text-xl font-semibold">{meta.label}</h3>
                      <span className={`ml-auto text-xs px-2 py-1 rounded-full ${stream.statusLabel === 'Confirmed'
                          ? 'bg-green-100 text-green-700'
                          : stream.statusLabel === 'Portfolio-Wide'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                        {stream.statusLabel}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{meta.description}</p>
                    <ul className="text-sm text-gray-700 space-y-1 mb-4">
                      {meta.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Pricing box */}
                    {stream.isTextOnly ? (
                      <div className="bg-amber-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Estimated per event</span>
                          <span className="font-semibold text-amber-700">{stream.textDisplay}</span>
                        </div>
                        <p className="text-sm font-bold text-gray-800 mt-3 bg-amber-100 rounded px-3 py-2">
                          ⚠️ Subject to site feasibility assessment
                        </p>
                      </div>
                    ) : stream.isRange ? (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Estimated per site/year</span>
                          <span className="font-semibold text-blue-700">
                            {formatCurrency(stream.annualMin! / Math.max(1, stream.siteCount))} – {formatCurrency(stream.annualMax! / Math.max(1, stream.siteCount))}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
                          <span className="font-medium">Portfolio Total ({stream.siteCount} sites)</span>
                          <span className="text-xl font-bold text-blue-700">
                            {formatCurrency(stream.annualMin ?? 0)} – {formatCurrency(stream.annualMax ?? 0)}/yr
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-800 mt-3 bg-amber-100 rounded px-3 py-2">
                          ⚠️ Subject to survey
                        </p>
                      </div>
                    ) : (
                      <div className="bg-indigo-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Per site/year</span>
                          <span className="font-semibold text-indigo-700">
                            {formatCurrency(stream.annualRevenue! / Math.max(1, stream.siteCount))}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-indigo-200">
                          <span className="font-medium">Portfolio Total ({stream.siteCount} sites)</span>
                          <span className="text-xl font-bold text-indigo-700">
                            {formatCurrency(stream.annualRevenue ?? 0)}/yr
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative h-64 md:h-auto bg-gray-100">
                    <img
                      src={meta.image}
                      alt={meta.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            )
          })}

          <div className="rounded border p-4 text-xs text-gray-600">
            <p className="font-medium">Implementation Notes</p>
            <p>All opportunities subject to site survey and feasibility assessment. Partnership negotiations and planning permissions may apply.</p>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function getStreamEmoji(streamType: StreamType): string {
  switch (streamType) {
    case 'LOCKER': return '📦'
    case 'CAR_WASH': return '🚗'
    case 'EV_CHARGING': return '⚡'
    case 'FARMERS_MARKET': return '🛒'
    default: return '📊'
  }
}

export function CommercialOffer() {
  return (
    <section className="space-y-3">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">Commercial Offer</CardTitle>
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

export function CommercialTerms({
  transactionFeePercent = 1.5,
  convenienceFeePence = 25,
  useCustomCommercialTerms = false,
  customCommercialTermsText = ''
}: {
  transactionFeePercent?: number;
  convenienceFeePence?: number;
  useCustomCommercialTerms?: boolean;
  customCommercialTermsText?: string;
}) {
  return (
    <section className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">Commercial Terms</CardTitle>
        </CardHeader>
        <CardContent>
          {useCustomCommercialTerms && customCommercialTermsText ? (
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                {customCommercialTermsText}
              </div>
            </div>
          ) : (
            <>
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
                            <div className="text-2xl font-semibold leading-tight text-primary">{transactionFeePercent}%</div>
                            <div className="text-xs text-gray-600">Per booking</div>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="text-sm">Convenience fee</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="text-2xl font-semibold leading-tight text-primary">{convenienceFeePence}p</div>
                            <div className="text-xs text-gray-600">Per booking</div>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="text-sm">Signage & installation</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="text-2xl font-semibold leading-tight">FREE</div>
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
                          <TableCell className="text-right text-sm font-medium text-primary">4 months</TableCell>
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
            </>
          )}
        </CardContent>
      </Card>
    </section>
  )
}


