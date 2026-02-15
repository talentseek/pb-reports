'use client'

import React, { useState } from 'react'
import type { ParkBeeSite } from '@/lib/parkbee-logic'
import { calculatePortfolioSummary, formatCurrency, REVENUE_RATES } from '@/lib/parkbee-logic'
import type { PostcodePlaces } from '@/lib/buzzbingo-places'
import { calculatePortfolioDemandSummary } from '@/lib/buzzbingo-places'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Lock, MapPin, Package, Car, Zap, ShoppingBag, CheckCircle, Clock, TrendingUp, Building2 } from 'lucide-react'

const ParkBeeMap = dynamic(() => import('./ParkBeeMap'), {
    loading: () => <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">Loading Map...</div>,
    ssr: false
})

const PASSWORD = 'parkbeepb2026'

interface Props {
    sites: ParkBeeSite[]
    placesData: PostcodePlaces[]
}

export default function ClientProposal({ sites, placesData }: Props) {
    const [authed, setAuthed] = useState(false)
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        if (password === PASSWORD) {
            setAuthed(true)
            setError('')
        } else {
            setError('Incorrect password')
        }
    }

    if (!authed) {
        return <LoginScreen password={password} setPassword={setPassword} error={error} onSubmit={handleLogin} />
    }

    return <ProposalReport data={sites} placesData={placesData} selectedSiteId={selectedSiteId} setSelectedSiteId={setSelectedSiteId} />
}

// ============ LOGIN SCREEN ============
function LoginScreen({ password, setPassword, error, onSubmit }: {
    password: string
    setPassword: (v: string) => void
    error: string
    onSubmit: (e: React.FormEvent) => void
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white/95 backdrop-blur rounded-2xl shadow-2xl overflow-hidden grid md:grid-cols-2">
                {/* Left: Branding */}
                <div className="relative hidden md:block bg-gradient-to-br from-green-600 to-green-800 p-8">
                    <div className="absolute inset-0 opacity-15 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/parkbee-logo.png" alt="ParkBee" className="w-3/4 h-auto" />
                    </div>
                    <div className="relative z-10 h-full flex flex-col justify-end text-white">
                        <h2 className="text-3xl font-bold mb-2">ParkBee Portfolio</h2>
                        <p className="text-white/80">Revenue Enhancement Proposal</p>
                        <p className="text-white/60 text-sm mt-2">2 Sites | Liverpool & London</p>
                    </div>
                </div>

                {/* Right: Login Form */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                    {/* Dual Branding */}
                    <div className="flex items-center gap-4 mb-8 justify-center">
                        <Image src="/logo.png" alt="ParkBunny" width={100} height={32} className="h-8 w-auto" />
                        <span className="text-gray-300">|</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/parkbee-logo.png" alt="ParkBee" className="h-8 w-auto" />
                    </div>

                    <h3 className="text-xl font-semibold text-center mb-2">Revenue Portfolio</h3>
                    <p className="text-gray-600 text-center text-sm mb-6">Enter access code to view proposal.</p>

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                placeholder="Access Code"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            />
                        </div>
                        {error && <p className="text-red-600 text-sm">{error}</p>}
                        <button
                            type="submit"
                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                        >
                            View Proposal
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

// ============ PROPOSAL REPORT ============
function ProposalReport({ data, placesData, selectedSiteId, setSelectedSiteId }: {
    data: ParkBeeSite[]
    placesData: PostcodePlaces[]
    selectedSiteId: string | null
    setSelectedSiteId: (id: string | null) => void
}) {
    const demandSummary = calculatePortfolioDemandSummary(placesData)
    const summary = calculatePortfolioSummary(data)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Image src="/logo.png" alt="ParkBunny" width={200} height={64} className="h-14 w-auto" />
                        <span className="text-gray-300">|</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/parkbee-logo.png" alt="ParkBee" className="h-10 w-auto" />
                    </div>
                    <div className="text-right text-sm text-gray-600">
                        <p className="font-medium">Revenue Uplift Proposal</p>
                        <p className="text-xs">February 2026</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">
                {/* Hero Section */}
                <section className="bg-gradient-to-r from-green-600 to-green-800 rounded-2xl p-8 text-white">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">ParkBee Portfolio</h1>
                    <p className="text-white/80 mb-6">Revenue Enhancement Strategy for 2 Locations</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Total Sites" value="2" />
                        <StatCard label="Current Baseline" value={formatCurrency(summary.baseline)} />
                        <StatCard label="Revenue Streams" value="3+" />
                        <StatCard label="Regions" value="2" />
                    </div>
                </section>

                {/* ============ PER-LOCATION ANALYSIS ============ */}
                <section className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Per-Location Analysis</h2>
                        <p className="text-sm text-gray-600">Each location includes its own map and indicative metrics derived from local business mix.</p>
                    </div>

                    {data.map((site) => {
                        const sitePlace = placesData.find(p => p.postcode === site.postcode)
                        return (
                            <div key={site.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                <div className="p-4 border-b bg-gradient-to-r from-green-50 to-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-semibold flex items-center gap-2">
                                                <MapPin className="w-5 h-5 text-green-600" />
                                                {site.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">{site.postcode} · {site.region}</p>
                                        </div>
                                        {sitePlace && (
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-green-600">+{formatCurrency(sitePlace.localOffersUpliftValue)}</p>
                                                <p className="text-xs text-gray-500">+{sitePlace.localOffersUpliftPercent}% uplift</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Map for this location */}
                                <div className="h-[350px]">
                                    <ParkBeeMap
                                        sites={[site]}
                                        selectedSiteId={selectedSiteId}
                                        onSelectSite={setSelectedSiteId}
                                        center={site.lat && site.lng ? [site.lat, site.lng] : undefined}
                                        zoom={14}
                                    />
                                </div>

                                {/* Business breakdown */}
                                {sitePlace && (
                                    <div className="p-4 border-t">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                                            <div className="rounded border p-3">
                                                <p className="text-xs text-gray-600">Baseline Revenue</p>
                                                <p className="font-medium">{formatCurrency(50000)}</p>
                                            </div>
                                            <div className="rounded border p-3">
                                                <p className="text-xs text-gray-600">Businesses Nearby</p>
                                                <p className="font-medium">{sitePlace.totalPlaces}</p>
                                            </div>
                                            <div className="rounded border p-3 bg-green-50">
                                                <p className="text-xs text-gray-600">Projected Uplift</p>
                                                <p className="font-medium text-green-700">+{formatCurrency(sitePlace.localOffersUpliftValue)}</p>
                                            </div>
                                            <div className="rounded border p-3">
                                                <p className="text-xs text-gray-600">Uplift %</p>
                                                <p className="font-medium">+{sitePlace.localOffersUpliftPercent}%</p>
                                            </div>
                                        </div>

                                        {/* Category breakdown */}
                                        <h4 className="text-sm font-medium mb-2 text-gray-700">Business Breakdown</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {sitePlace.categories.map(cat => {
                                                const pct = Math.round(cat.count * cat.signUp * cat.uplift * 1000) / 10
                                                return (
                                                    <div key={cat.group} className="rounded border p-2 flex items-center justify-between">
                                                        <span className="text-sm text-gray-900">{cat.group}</span>
                                                        <span className="text-sm">
                                                            <span className="mr-2 font-medium">{cat.count}</span>
                                                            <span className="font-medium text-green-600">+{pct}%</span>
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </section>

                {/* ============ LOCAL OFFERS UPLIFT SUMMARY ============ */}
                <section className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-6 border-b bg-gradient-to-r from-green-50 to-white">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            Local Offers Uplift — Portfolio Summary
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">Combined projected revenue increase from nearby business partnerships</p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-slate-900">{formatCurrency(demandSummary.totalBaselineRevenue)}</p>
                                <p className="text-sm text-gray-600">Portfolio Baseline</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                                <p className="text-2xl font-bold text-green-700">+{formatCurrency(demandSummary.totalLocalOffersUplift)}</p>
                                <p className="text-sm text-gray-600">Projected Uplift</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-slate-900">+{demandSummary.avgUpliftPercent}%</p>
                                <p className="text-sm text-gray-600">Avg. Uplift</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-slate-900">{demandSummary.totalBusinesses}</p>
                                <p className="text-sm text-gray-600">Partner Businesses</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-4">*Uplift calculated using industry-standard formula: business count × sign-up rate × uplift rate × baseline revenue</p>
                    </div>
                </section>

                {/* ============ ADDITIONAL PORTFOLIO UPLIFT ============ */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">Additional Portfolio Uplift</h2>

                    {/* SMART LOCKERS — Updated copy per Jon */}
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="md:grid md:grid-cols-2">
                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Package className="w-6 h-6 text-indigo-600" />
                                    <h3 className="text-xl font-semibold">Smart Locker Solution</h3>
                                    <span className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Confirmed</span>
                                </div>
                                <p className="text-gray-600 mb-4">
                                    Minimum revenue <strong>£900 + VAT per year</strong> — this can dramatically increase subject to location and footfall.
                                </p>
                                <ul className="space-y-2 text-sm text-gray-700 mb-4">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Per locker, per location</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> 1 year contract</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> No power required</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Fully serviced and insured</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Solar + battery powered</li>
                                </ul>
                                <div className="bg-indigo-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Per locker/year (minimum)</span>
                                        <span className="font-semibold text-indigo-700">{formatCurrency(REVENUE_RATES.locker)} + VAT</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-indigo-200">
                                        <span className="font-medium">Portfolio Total ({summary.locker.count} sites)</span>
                                        <span className="text-xl font-bold text-indigo-700">{formatCurrency(summary.locker.annual)}/yr + VAT</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">£{(summary.locker.annual * 1.2).toLocaleString()} inc. VAT</p>
                                </div>
                            </div>
                            <div className="relative h-64 md:h-auto bg-gray-100">
                                <Image src="/lockerphoto.webp" alt="Smart Lockers" fill className="object-cover" />
                            </div>
                        </div>
                    </div>

                    {/* SELF-SERVICE CAR WASH — Range with Subject to Survey */}
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="md:grid md:grid-cols-2">
                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Car className="w-6 h-6 text-blue-600" />
                                    <h3 className="text-xl font-semibold">Self-Service Car Wash</h3>
                                    <span className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Portfolio-Wide</span>
                                </div>
                                <p className="text-gray-600 mb-4">Available across both ParkBee locations. All hardware supplied, maintained, and insured including liquids.</p>

                                <h4 className="font-medium mb-2">Key Benefits</h4>
                                <ul className="space-y-2 text-sm text-gray-700 mb-4">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> <strong>ZERO CAPEX</strong> for ParkBee</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> All hardware supplied & maintained</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Fully insured including liquids</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Revenue share basis</li>
                                </ul>

                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Estimated per site/year</span>
                                        <span className="font-semibold text-blue-700">{formatCurrency(REVENUE_RATES.carwash.min)} – {formatCurrency(REVENUE_RATES.carwash.max)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
                                        <span className="font-medium">Portfolio Total ({summary.carwash.count} sites)</span>
                                        <span className="text-xl font-bold text-blue-700">{formatCurrency(summary.carwash.annualMin)} – {formatCurrency(summary.carwash.annualMax)}/yr</span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-800 mt-3 bg-amber-100 rounded px-3 py-2">⚠️ Subject to survey</p>
                                </div>
                            </div>
                            <div className="relative h-64 md:h-auto bg-gray-100">
                                <Image src="/selfservicecarwash.webp" alt="Self-Service Car Wash" fill className="object-cover" />
                            </div>
                        </div>
                    </div>

                    {/* ============ OPTIONAL EXTRAS ============ */}
                    <h3 className="text-lg font-semibold text-gray-700 mt-8">Optional Revenue Streams</h3>

                    {/* EV CHARGING */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-6 h-6 text-emerald-600" />
                            <h3 className="text-xl font-semibold">EV Charging Infrastructure</h3>
                            <span className="ml-auto bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">Optional Extra</span>
                        </div>
                        <p className="text-gray-600 mb-4">
                            EV charging can be deployed via a revenue-share model with zero upfront cost. Typical deployment is 4 × 22kW AC chargers (8 bays) per site.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div className="border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50">
                                <h4 className="font-semibold text-emerald-800 mb-2">Revenue Share Model</h4>
                                <ul className="text-sm space-y-1 text-gray-700">
                                    <li>• Partner funds, owns & operates chargers</li>
                                    <li>• ParkBee provides land & power access</li>
                                    <li>• Typical split: 85/15 or 80/20</li>
                                    <li>• <strong>Zero upfront cost</strong></li>
                                </ul>
                            </div>
                            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                                <h4 className="font-semibold text-blue-800 mb-2">Estimated Revenue</h4>
                                <ul className="text-sm space-y-1 text-gray-700">
                                    <li>• Gross profit: ~£24,000/yr per site</li>
                                    <li>• ParkBee share (15%): ~£3,600/yr per site</li>
                                    <li>• Portfolio potential: ~£7,200/yr</li>
                                    <li>• Subject to site survey & DNO assessment</li>
                                </ul>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Site surveys required to confirm viability and grid capacity
                        </p>
                    </div>

                    {/* FARMERS MARKETS */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <ShoppingBag className="w-6 h-6 text-orange-600" />
                            <h3 className="text-xl font-semibold">Farmers Markets</h3>
                            <span className="ml-auto bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">Optional Extra</span>
                        </div>
                        <p className="text-gray-600">
                            Potential for regular farmers markets at suitable sites. Revenue estimated at <strong>£1,000-£2,500 per day</strong> depending on footfall and site configuration.
                        </p>
                        <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Site surveys required to confirm viability
                        </p>
                    </div>
                </section>

                {/* ============ SUMMARY ============ */}
                <section className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white">
                    <h2 className="text-2xl font-bold mb-6">Portfolio Revenue Summary</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/20">
                                    <th className="py-3 pr-4">Revenue Stream</th>
                                    <th className="py-3 px-4 text-center">Sites</th>
                                    <th className="py-3 px-4 text-right">Annual Revenue</th>
                                    <th className="py-3 pl-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-white/90">
                                {/* BASELINE */}
                                <tr className="border-b border-white/10 bg-white/5">
                                    <td className="py-3 pr-4 flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400" /> Portfolio Baseline</td>
                                    <td className="py-3 px-4 text-center">{demandSummary.totalSites}</td>
                                    <td className="py-3 px-4 text-right font-semibold">{formatCurrency(demandSummary.totalBaselineRevenue)}</td>
                                    <td className="py-3 pl-4 text-right"><span className="bg-slate-500/20 text-slate-300 text-xs px-2 py-1 rounded">Current</span></td>
                                </tr>
                                {/* LOCAL OFFERS UPLIFT */}
                                <tr className="border-b border-white/10 bg-green-900/20">
                                    <td className="py-3 pr-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-400" /> Local Offers Uplift</td>
                                    <td className="py-3 px-4 text-center">{demandSummary.totalSites}</td>
                                    <td className="py-3 px-4 text-right font-semibold text-green-400">+{formatCurrency(demandSummary.totalLocalOffersUplift)}</td>
                                    <td className="py-3 pl-4 text-right"><span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded">+{demandSummary.avgUpliftPercent}%</span></td>
                                </tr>
                                {/* ANCILLARY STREAMS */}
                                <tr className="border-b border-white/10">
                                    <td className="py-3 pr-4 flex items-center gap-2"><Package className="w-4 h-4 text-indigo-400" /> Smart Lockers</td>
                                    <td className="py-3 px-4 text-center">{summary.locker.count}</td>
                                    <td className="py-3 px-4 text-right font-semibold">+{formatCurrency(summary.locker.annual)} + VAT</td>
                                    <td className="py-3 pl-4 text-right"><span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded">Confirmed</span></td>
                                </tr>
                                <tr className="border-b border-white/10">
                                    <td className="py-3 pr-4 flex items-center gap-2"><Car className="w-4 h-4 text-blue-400" /> Self-Service Car Wash</td>
                                    <td className="py-3 px-4 text-center">{summary.carwash.count}</td>
                                    <td className="py-3 px-4 text-right font-semibold">+{formatCurrency(summary.carwash.annualMin)} – {formatCurrency(summary.carwash.annualMax)}</td>
                                    <td className="py-3 pl-4 text-right"><span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded">Portfolio-Wide</span></td>
                                </tr>
                                {/* OPTIONAL */}
                                <tr className="border-b border-white/10 opacity-60">
                                    <td className="py-3 pr-4 flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-400" /> EV Charging (RevShare)</td>
                                    <td className="py-3 px-4 text-center">TBD</td>
                                    <td className="py-3 px-4 text-right font-semibold">~£7.2k/yr</td>
                                    <td className="py-3 pl-4 text-right"><span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-1 rounded">Optional</span></td>
                                </tr>
                                <tr className="opacity-60">
                                    <td className="py-3 pr-4 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-orange-400" /> Farmers Markets</td>
                                    <td className="py-3 px-4 text-center">TBD</td>
                                    <td className="py-3 px-4 text-right font-semibold">£1k-2.5k/day</td>
                                    <td className="py-3 pl-4 text-right"><span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-1 rounded">Optional</span></td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-white/30">
                                    <td className="py-4 pr-4 font-bold text-lg">Core Revenue Opportunity</td>
                                    <td className="py-4 px-4 text-center font-bold">{demandSummary.totalSites}</td>
                                    <td className="py-4 px-4 text-right font-bold text-2xl text-green-400">{formatCurrency(demandSummary.totalBaselineRevenue + demandSummary.totalLocalOffersUplift + summary.locker.annual + summary.carwash.annualMin)}</td>
                                    <td className="py-4 pl-4"></td>
                                </tr>
                                <tr>
                                    <td className="py-2 pr-4 text-white/70">Uplift from baseline</td>
                                    <td className="py-2 px-4 text-center text-white/70"></td>
                                    <td className="py-2 px-4 text-right font-semibold text-white/70">+{formatCurrency(demandSummary.totalLocalOffersUplift + summary.locker.annual + summary.carwash.annualMin)} – {formatCurrency(demandSummary.totalLocalOffersUplift + summary.locker.annual + summary.carwash.annualMax)}</td>
                                    <td className="py-2 pl-4"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </section>

                {/* Next Steps */}
                <section className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="border rounded-lg p-4">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold mb-3">1</div>
                            <h3 className="font-medium mb-1">Site Surveys</h3>
                            <p className="text-sm text-gray-600">Arrange surveys for both locations to confirm locker placement and car wash suitability.</p>
                        </div>
                        <div className="border rounded-lg p-4">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold mb-3">2</div>
                            <h3 className="font-medium mb-1">Locker Deployment</h3>
                            <p className="text-sm text-gray-600">Finalize locker agreements at {formatCurrency(summary.locker.annual)} P.A. plus VAT for the portfolio.</p>
                        </div>
                        <div className="border rounded-lg p-4">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold mb-3">3</div>
                            <h3 className="font-medium mb-1">Car Wash Rollout</h3>
                            <p className="text-sm text-gray-600">Confirm car wash installations for an estimated {formatCurrency(summary.carwash.annualMin)} – {formatCurrency(summary.carwash.annualMax)}/yr additional revenue.</p>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t pt-8 mt-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Image src="/logo.png" alt="ParkBunny" width={100} height={32} className="h-6 w-auto" />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/parkbee-logo.png" alt="ParkBee" className="h-6 w-auto" />
                        </div>
                        <div className="text-sm text-gray-600 text-center md:text-right">
                            <p>© {new Date().getFullYear()} ParkBunny | <a href="mailto:hello@parkbunny.app" className="underline">hello@parkbunny.app</a></p>
                            <p className="text-xs mt-1">Prepared for ParkBee — Liverpool & London Portfolio</p>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    )
}

// Simple stat card for hero
function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-white/70 text-sm">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    )
}
