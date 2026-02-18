import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { StreamRevenueSummary } from "@/lib/revenue-streams"

type Props = {
    locationCount: number
    totalCurrentRevenue: number
    upliftValue: number
    growthPercent: number
    streams: StreamRevenueSummary[]
    formatCurrency: (n: number) => string
}

export default function PublicRevenueSummary({
    locationCount,
    totalCurrentRevenue,
    upliftValue,
    growthPercent,
    streams,
    formatCurrency,
}: Props) {
    // Calculate totals
    const streamMinTotal = streams.reduce((sum, s) => {
        if (s.isTextOnly) return sum
        if (s.isRange) return sum + (s.annualMin ?? 0)
        return sum + (s.annualRevenue ?? 0)
    }, 0)

    const streamMaxTotal = streams.reduce((sum, s) => {
        if (s.isTextOnly) return sum
        if (s.isRange) return sum + (s.annualMax ?? 0)
        return sum + (s.annualRevenue ?? 0)
    }, 0)

    const hasRange = streamMinTotal !== streamMaxTotal
    const grandTotalMin = totalCurrentRevenue + upliftValue + streamMinTotal
    const grandTotalMax = totalCurrentRevenue + upliftValue + streamMaxTotal

    return (
        <section className="space-y-4">
            <Card className="border-primary/20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                <CardHeader>
                    <CardTitle className="text-white">Portfolio Revenue Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-600">
                                    <th className="text-left py-2 pr-4 font-medium text-gray-300">Revenue Stream</th>
                                    <th className="text-center py-2 px-4 font-medium text-gray-300">Sites</th>
                                    <th className="text-right py-2 pl-4 font-medium text-gray-300">Annual Revenue</th>
                                    <th className="text-right py-2 pl-4 font-medium text-gray-300">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Baseline */}
                                <tr className="border-b border-gray-700">
                                    <td className="py-3 pr-4">Portfolio Baseline</td>
                                    <td className="py-3 px-4 text-center">{locationCount}</td>
                                    <td className="py-3 pl-4 text-right font-medium">{formatCurrency(totalCurrentRevenue)}</td>
                                    <td className="py-3 pl-4 text-right">
                                        <span className="bg-gray-600 text-gray-200 text-xs px-2 py-1 rounded-full">Current</span>
                                    </td>
                                </tr>

                                {/* Local Offers Uplift */}
                                <tr className="border-b border-gray-700">
                                    <td className="py-3 pr-4">Local Offers Uplift</td>
                                    <td className="py-3 px-4 text-center">{locationCount}</td>
                                    <td className="py-3 pl-4 text-right font-medium text-green-400">+{formatCurrency(upliftValue)}</td>
                                    <td className="py-3 pl-4 text-right">
                                        <span className="bg-green-900 text-green-300 text-xs px-2 py-1 rounded-full">+{growthPercent}%</span>
                                    </td>
                                </tr>

                                {/* Revenue Streams */}
                                {streams.map((s) => (
                                    <tr key={s.streamType} className="border-b border-gray-700">
                                        <td className="py-3 pr-4">{s.label}</td>
                                        <td className="py-3 px-4 text-center">{s.siteCount}</td>
                                        <td className="py-3 pl-4 text-right font-medium text-green-400">
                                            {s.isTextOnly
                                                ? s.textDisplay
                                                : s.isRange
                                                    ? `+${formatCurrency(s.annualMin ?? 0)} – ${formatCurrency(s.annualMax ?? 0)}`
                                                    : `+${formatCurrency(s.annualRevenue ?? 0)}`}
                                        </td>
                                        <td className="py-3 pl-4 text-right">
                                            <span className="bg-indigo-900 text-indigo-300 text-xs px-2 py-1 rounded-full">{s.statusLabel}</span>
                                        </td>
                                    </tr>
                                ))}

                                {/* Total */}
                                <tr className="border-t-2 border-white">
                                    <td className="py-4 pr-4 font-bold text-base">Total Revenue Opportunity</td>
                                    <td className="py-4 px-4 text-center font-bold">{locationCount}</td>
                                    <td className="py-4 pl-4 text-right font-bold text-base text-green-400">
                                        {hasRange
                                            ? `${formatCurrency(grandTotalMin)} – ${formatCurrency(grandTotalMax)}`
                                            : formatCurrency(grandTotalMin)}
                                    </td>
                                    <td className="py-4 pl-4 text-right">
                                        <span className="bg-green-700 text-white text-xs px-2 py-1 rounded-full font-medium">Projected</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-gray-400 mt-4">
                        All figures are annualised estimates. Ancillary streams subject to site surveys and feasibility assessment.
                    </p>
                </CardContent>
            </Card>
        </section>
    )
}
