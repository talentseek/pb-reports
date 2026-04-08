"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { StreamType } from "@prisma/client"
import { t, type Language } from "@/lib/translations"

// ── Types (serialisable from server) ──────────────────────────────────

type StreamData = {
    streamType: StreamType
    label: string
    siteCount: number
    annualRevenue: number | null
    annualMin: number | null
    annualMax: number | null
    isRange: boolean
    isTextOnly: boolean
    textDisplay: string | null
    statusLabel: string
    isAlternative: boolean
}

type StreamMeta = {
    label: string
    icon: string
    image: string
    description: string
    bullets: string[]
    statusLabel: string
}

type Props = {
    streams: StreamData[]
    streamMeta: Record<string, StreamMeta>
    locationCount: number
    totalCurrentRevenue: number
    upliftValue: number
    growthPercent: number
    lang?: Language
    currency?: string
    locale?: string
    currencySymbol?: string
}

// ── Helpers ───────────────────────────────────────────────────────────

// ── Helpers ───────────────────────────────────────────────────────────

function getEmoji(st: StreamType): string {
    const map: Record<string, string> = {
        LOCKER: '📦', CAR_WASH: '🚗', EV_CHARGING: '⚡', FARMERS_MARKET: '🛒',
        TESLA_DEMO: '🚘', WE_BUY_ANY_CAR: '🏷️', GIANT_WASHING_MACHINE: '🧺',
        DOG_GROOMING: '🐕', NHS_MRI_SCANNER: '🏥', FILM_CREW_HOSTING: '🎬',
        ELECTRIC_BIKE_BAY: '🚲', WATERLESS_CAR_WASH: '✨', DIGITAL_SIGNAGE: '📺',
        DOMINOS_POD: '🍕', LAST_MILE_LOCKER: '🏭',
        DOG_WASH_UNIT: '🛁', SELF_SERVICE_LAUNDRY: '🧼', SOLAR_PPA: '☀️',
        SOLAR_PV_PAID: '🔋', TARIFF_OPTIMISATION: '💡', SITE_MAINTENANCE: '🔧',
        OCTOPUS_ENERGY: '🐙',
    }
    return map[st] ?? '📊'
}

// ── Component ─────────────────────────────────────────────────────────

export default function InteractiveStreamSection({
    streams,
    streamMeta,
    locationCount,
    totalCurrentRevenue,
    upliftValue,
    growthPercent,
    lang = 'en',
    currency = 'GBP',
    locale = 'en-GB',
    currencySymbol = '£',
}: Props) {
    const [included, setIncluded] = useState<Set<string>>(new Set())

    function fmt(n: number): string {
        return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
    }

    function replaceCurrency(text: string): string {
        return text.replace(/£/g, currencySymbol)
    }

    if (streams.length === 0) return null

    function toggle(streamType: string) {
        setIncluded((prev) => {
            const next = new Set(prev)
            next.has(streamType) ? next.delete(streamType) : next.add(streamType)
            return next
        })
    }

    const includedStreams = streams.filter((s) => included.has(s.streamType))
    const hasIncluded = includedStreams.length > 0

    // Calculate summary totals from included streams only
    const streamMinTotal = includedStreams.reduce((sum, s) => {
        if (s.isTextOnly) return sum
        if (s.isRange) return sum + (s.annualMin ?? 0)
        return sum + (s.annualRevenue ?? 0)
    }, 0)

    const streamMaxTotal = includedStreams.reduce((sum, s) => {
        if (s.isTextOnly) return sum
        if (s.isRange) return sum + (s.annualMax ?? 0)
        return sum + (s.annualRevenue ?? 0)
    }, 0)

    const hasRange = streamMinTotal !== streamMaxTotal
    const grandTotalMin = totalCurrentRevenue + upliftValue + streamMinTotal
    const grandTotalMax = totalCurrentRevenue + upliftValue + streamMaxTotal

    return (
        <>
            {/* ── Stream Cards ─────────────────────────────────────────── */}
            <section className="space-y-6">
                <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
                    <CardHeader>
                        <CardTitle className="text-primary">{t(lang, 'section.additionalUplift')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-sm text-gray-700">{t(lang, 'section.additionalUplift.subtitle')}</p>

                        {streams.map((stream) => {
                            const meta = streamMeta[stream.streamType]
                            if (!meta) return null
                            const isIncluded = included.has(stream.streamType)
                            return (
                                <div
                                    key={stream.streamType}
                                    className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-200 ${isIncluded ? 'ring-2 ring-green-400 border-green-300' : ''}`}
                                >
                                    <div className="md:grid md:grid-cols-2">
                                        <div className="p-6">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-2xl">{getEmoji(stream.streamType)}</span>
                                                <h3 className="text-xl font-semibold">{meta.label}</h3>
                                                <span className={`ml-auto text-xs px-2 py-1 rounded-full ${stream.statusLabel === 'Confirmed' || stream.statusLabel === 'Portfolio-Wide'
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
                                                        <span>{replaceCurrency(b)}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            {/* Pricing box */}
                                            {stream.isTextOnly ? (
                                                <div className="bg-amber-50 rounded-lg p-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-600">{t(lang, 'stream.estimatedPerEvent')}</span>
                                                        <span className="font-semibold text-amber-700">{stream.textDisplay}</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-800 mt-3 bg-amber-100 rounded px-3 py-2">
                                                        {t(lang, 'stream.subjectToSurvey')}
                                                    </p>
                                                </div>
                                            ) : stream.isRange ? (
                                                <div className="bg-blue-50 rounded-lg p-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-600">{t(lang, 'stream.estimatedPerSiteYear')}</span>
                                                        <span className="font-semibold text-blue-700">
                                                            {fmt(stream.annualMin! / Math.max(1, stream.siteCount))} – {fmt(stream.annualMax! / Math.max(1, stream.siteCount))}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
                                                        <span className="font-medium">{t(lang, 'stream.portfolioTotal')} ({stream.siteCount} {stream.siteCount === 1 ? t(lang, 'header.locations') : t(lang, 'header.locations_plural')})</span>
                                                        <span className="text-xl font-bold text-blue-700">
                                                            {fmt(stream.annualMin ?? 0)} – {fmt(stream.annualMax ?? 0)}/yr
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-800 mt-3 bg-amber-100 rounded px-3 py-2">
                                                        {t(lang, 'stream.subjectToSurvey')}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="bg-indigo-50 rounded-lg p-4">
                                                    <div className="flex justify-between items-center">
                                                            <span className="text-sm text-gray-600">
                                                            {stream.streamType === 'LOCKER' ? t(lang, 'stream.perLockerYear') : t(lang, 'stream.perSiteYear')}
                                                        </span>
                                                        <span className="font-semibold text-indigo-700">
                                                            {fmt(stream.annualRevenue! / Math.max(1, stream.siteCount))}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-indigo-200">
                                                        <span className="font-medium">{t(lang, 'stream.portfolioTotal')} ({stream.siteCount} {stream.siteCount === 1 ? t(lang, 'header.locations') : t(lang, 'header.locations_plural')})</span>
                                                        <span className="text-xl font-bold text-indigo-700">
                                                            {fmt(stream.annualRevenue ?? 0)}/yr
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ── Tick box: Include in Revenue Summary ── */}
                                            <label
                                                className={`flex items-center gap-3 mt-4 p-3 rounded-lg cursor-pointer transition-all duration-200 border ${isIncluded
                                                    ? 'bg-green-50 border-green-300 text-green-800'
                                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isIncluded}
                                                    onChange={() => toggle(stream.streamType)}
                                                    className="h-4 w-4 rounded accent-green-600"
                                                />
                                                <span className="text-sm font-medium">
                                                    {isIncluded ? t(lang, 'stream.includedInSummary') : t(lang, 'stream.includeInSummary')}
                                                </span>
                                            </label>
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
                            <p className="font-medium">{t(lang, 'stream.implementationNotes')}</p>
                            <p>{t(lang, 'stream.implementationNotesText')}</p>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* ── Portfolio Revenue Summary ─────────────────────────────── */}
            <section className="space-y-4">
                <Card className="border-primary/20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                    <CardHeader>
                        <CardTitle className="text-white">{t(lang, 'section.revenueSummary')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-600">
                                        <th className="text-left py-2 pr-4 font-medium text-gray-300">{t(lang, 'section.revenueSummary.stream')}</th>
                                        <th className="text-center py-2 px-4 font-medium text-gray-300">{t(lang, 'section.revenueSummary.sites')}</th>
                                        <th className="text-right py-2 pl-4 font-medium text-gray-300">{t(lang, 'section.revenueSummary.annual')}</th>
                                        <th className="text-right py-2 pl-4 font-medium text-gray-300">{t(lang, 'section.revenueSummary.status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Baseline — always shown */}
                                    <tr className="border-b border-gray-700">
                                        <td className="py-3 pr-4">{t(lang, 'section.revenueSummary.baseline')}</td>
                                        <td className="py-3 px-4 text-center">{locationCount}</td>
                                        <td className="py-3 pl-4 text-right font-medium">{fmt(totalCurrentRevenue)}</td>
                                        <td className="py-3 pl-4 text-right">
                                            <span className="bg-gray-600 text-gray-200 text-xs px-2 py-1 rounded-full">{t(lang, 'section.revenueSummary.current')}</span>
                                        </td>
                                    </tr>

                                    {/* Local Offers Uplift — always shown */}
                                    <tr className="border-b border-gray-700">
                                        <td className="py-3 pr-4">{t(lang, 'section.revenueSummary.localOffers')}</td>
                                        <td className="py-3 px-4 text-center">{locationCount}</td>
                                        <td className="py-3 pl-4 text-right font-medium text-green-400">+{fmt(upliftValue)}</td>
                                        <td className="py-3 pl-4 text-right">
                                            <span className="bg-green-900 text-green-300 text-xs px-2 py-1 rounded-full">+{growthPercent}%</span>
                                        </td>
                                    </tr>

                                    {/* Included streams — only shown when ticked */}
                                    {includedStreams.map((s) => (
                                        <tr key={s.streamType} className="border-b border-gray-700 animate-in fade-in duration-200">
                                            <td className="py-3 pr-4">{s.label}</td>
                                            <td className="py-3 px-4 text-center">{s.siteCount}</td>
                                            <td className="py-3 pl-4 text-right font-medium text-green-400">
                                                {s.isTextOnly
                                                    ? s.textDisplay
                                                    : s.isRange
                                                        ? `+${fmt(s.annualMin ?? 0)} – ${fmt(s.annualMax ?? 0)}`
                                                        : `+${fmt(s.annualRevenue ?? 0)}`}
                                            </td>
                                            <td className="py-3 pl-4 text-right">
                                                <span className="bg-indigo-900 text-indigo-300 text-xs px-2 py-1 rounded-full">{s.statusLabel}</span>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Total */}
                                    <tr className="border-t-2 border-white">
                                        <td className="py-4 pr-4 font-bold text-base">{t(lang, 'section.revenueSummary.total')}</td>
                                        <td className="py-4 px-4 text-center font-bold">{locationCount}</td>
                                        <td className="py-4 pl-4 text-right font-bold text-base text-green-400">
                                            {hasRange
                                                ? `${fmt(grandTotalMin)} – ${fmt(grandTotalMax)}`
                                                : fmt(grandTotalMin)}
                                        </td>
                                        <td className="py-4 pl-4 text-right">
                                            <span className="bg-green-700 text-white text-xs px-2 py-1 rounded-full font-medium">{t(lang, 'section.revenueSummary.projected')}</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {hasIncluded && (
                            <p className="text-xs text-gray-400 mt-4">
                                {includedStreams.length} {t(lang, 'stream.includedHint')}
                            </p>
                        )}
                        {!hasIncluded && (
                            <p className="text-xs text-gray-400 mt-4">
                                {t(lang, 'stream.notIncludedHint')}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </section>
        </>
    )
}
