'use client'

import React, { useState } from 'react'
import type { NSLSite } from '@/lib/nsl-logic'
import { calculatePortfolioSummary, groupByRegion, formatCurrency, REVENUE_RATES } from '@/lib/nsl-logic'
import type { PostcodePlaces } from '@/lib/buzzbingo-places'
import { calculatePortfolioDemandSummary } from '@/lib/buzzbingo-places'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Lock, MapPin, Package, Car, Zap, ShoppingBag, CheckCircle, Clock, TrendingUp, Building2 } from 'lucide-react'

const NSLMap = dynamic(() => import('./NSLMap'), {
    loading: () => <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">Loading Map...</div>,
    ssr: false
})

const PASSWORD = 'nslpb2026'

interface Props {
    data: NSLSite[]
    placesData: PostcodePlaces[]
}

export default function ClientProposal({ data, placesData }: Props) {
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

    return <ProposalReport data={data} placesData={placesData} selectedSiteId={selectedSiteId} setSelectedSiteId={setSelectedSiteId} />
}

// ============ LOGIN SCREEN ============
function LoginScreen({ password, setPassword, error, onSubmit }: {
    password: string
    setPassword: (v: string) => void
    error: string
    onSubmit: (e: React.FormEvent) => void
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white/95 backdrop-blur rounded-2xl shadow-2xl overflow-hidden grid md:grid-cols-2">
                {/* Left: Branding Image */}
                <div className="relative hidden md:block bg-gradient-to-br from-blue-600 to-blue-800 p-8">
                    <div className="absolute inset-0 opacity-15 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/nsl-logo.svg" alt="NSL" className="w-3/4 h-auto" />
                    </div>
                    <div className="relative z-10 h-full flex flex-col justify-end text-white">
                        <h2 className="text-3xl font-bold mb-2">NSL Portfolio</h2>
                        <p className="text-white/80">Revenue Enhancement Proposal</p>
                        <p className="text-white/60 text-sm mt-2">12 Sites | West London</p>
                    </div>
                </div>

                {/* Right: Login Form */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                    {/* Dual Branding */}
                    <div className="flex items-center gap-4 mb-8 justify-center">
                        <Image src="/logo.png" alt="ParkBunny" width={100} height={32} className="h-8 w-auto" />
                        <span className="text-gray-300">|</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/nsl-logo.svg" alt="NSL" className="h-10 w-auto" />
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
                                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        {error && <p className="text-red-600 text-sm">{error}</p>}
                        <button
                            type="submit"
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
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
    data: NSLSite[]
    placesData: PostcodePlaces[]
    selectedSiteId: string | null
    setSelectedSiteId: (id: string | null) => void
}) {
    const demandSummary = calculatePortfolioDemandSummary(placesData)
    const summary = calculatePortfolioSummary(data)
    const regionGroups = groupByRegion(data)
    const regionOrder = ['Hounslow', 'Feltham', 'Chiswick', 'Isleworth']

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Image src="/logo.png" alt="ParkBunny" width={200} height={64} className="h-14 w-auto" />
                        <span className="text-gray-300">|</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/nsl-logo.svg" alt="NSL" className="h-12 w-auto" />
                    </div>
                    <div className="text-right text-sm text-gray-600">
                        <p className="font-medium">Revenue Uplift Proposal</p>
                        <p className="text-xs">February 2026</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">
                {/* Hero Section */}
                <section className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">NSL Car Parks Portfolio</h1>
                    <p className="text-white/80 mb-6">Revenue Enhancement Strategy for 12 West London Locations</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Total Sites" value="12" />
                        <StatCard label="Current Baseline" value={formatCurrency(summary.baseline)} />
                        <StatCard label="Revenue Streams" value="3+" />
                        <StatCard label="Areas" value={Object.keys(regionGroups).length.toString()} />
                    </div>
                </section>

                {/* Portfolio Map */}
                <section className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-4 border-b">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            Portfolio Overview
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">All 12 NSL car park locations across West London</p>
                    </div>
                    <div className="h-[400px]">
                        <NSLMap data={data} selectedId={selectedSiteId} onSelect={setSelectedSiteId} />
                    </div>
                </section>

                {/* Site List by Region */}
                <section className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-xl font-semibold mb-4">Site Locations by Area</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {regionOrder.filter(r => regionGroups[r]).map(region => (
                            <div key={region} className="border rounded-lg p-4">
                                <h3 className="font-medium text-gray-900 mb-2">{region}</h3>
                                <ul className="space-y-1 text-sm">
                                    {regionGroups[region].map(site => (
                                        <li key={site.id} className="flex justify-between text-gray-600">
                                            <span>{site.name}</span>
                                            <span className="text-gray-400 font-mono text-xs">{site.postcode}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-4">All sites approved subject to survey. Kingsley Road (TW3 1QD) rejected — excluded from this report.</p>
                </section>

                {/* ============ LOCAL OFFERS UPLIFT ============ */}
                <section className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-6 border-b bg-gradient-to-r from-green-50 to-white">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            Local Offers Uplift
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">Projected revenue increase from nearby business partnerships</p>
                    </div>
                    <div className="p-6">
                        {/* Portfolio Summary Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-slate-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-slate-900">{formatCurrency(demandSummary.totalBaselineRevenue)}</p>
                                <p className="text-sm text-gray-600">Portfolio Baseline</p>
                                <p className="text-xs text-gray-400">Current parking revenue</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                                <p className="text-2xl font-bold text-green-700">+{formatCurrency(demandSummary.totalLocalOffersUplift)}</p>
                                <p className="text-sm text-gray-600">Projected Uplift</p>
                                <p className="text-xs text-gray-400">From local offers</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-slate-900">+{demandSummary.avgUpliftPercent}%</p>
                                <p className="text-sm text-gray-600">Avg. Uplift</p>
                                <p className="text-xs text-gray-400">Per site</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-slate-900">{demandSummary.totalBusinesses}</p>
                                <p className="text-sm text-gray-600">Partner Businesses</p>
                                <p className="text-xs text-gray-400">Identified nearby</p>
                            </div>
                        </div>

                        {/* Per-Site Uplift Breakdown */}
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            Sites by Projected Uplift
                        </h3>
                        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto">
                            {[...placesData]
                                .sort((a, b) => b.localOffersUpliftValue - a.localOffersUpliftValue)
                                .map((site) => (
                                    <div key={site.postcode} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-sm">{site.siteName}</p>
                                            <p className="text-xs text-gray-500">{site.totalPlaces} businesses nearby</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600">+{formatCurrency(site.localOffersUpliftValue)}</p>
                                            <p className="text-xs text-gray-500">+{site.localOffersUpliftPercent}%</p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-4">*Uplift calculated using industry-standard formula: business count × sign-up rate × uplift rate × baseline revenue</p>
                    </div>
                </section>

                {/* ============ ADDITIONAL PORTFOLIO UPLIFT ============ */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">Additional Portfolio Uplift</h2>

                    {/* SMART LOCKERS */}
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="md:grid md:grid-cols-2">
                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Package className="w-6 h-6 text-indigo-600" />
                                    <h3 className="text-xl font-semibold">Smart Locker Solution</h3>
                                    <span className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Confirmed</span>
                                </div>
                                <p className="text-gray-600 mb-4">3-metre solar & battery powered lockers. Fully insured with a 1-year contract.</p>
                                <ul className="space-y-2 text-sm text-gray-700 mb-4">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Zero maintenance required</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Solar + battery powered</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Fully insured</li>
                                </ul>
                                <div className="bg-indigo-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Per locker/year</span>
                                        <span className="font-semibold text-indigo-700">{formatCurrency(REVENUE_RATES.locker)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-indigo-200">
                                        <span className="font-medium">Portfolio Total ({summary.locker.count} sites)</span>
                                        <span className="text-xl font-bold text-indigo-700">{formatCurrency(summary.locker.annual)}/yr</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">£{(summary.locker.annual * 1.2).toLocaleString()} inc. VAT</p>
                                </div>
                            </div>
                            <div className="relative h-64 md:h-auto bg-gray-100">
                                <Image src="/lockerphoto.webp" alt="Smart Lockers" fill className="object-cover" />
                            </div>
                        </div>
                    </div>

                    {/* SELF-SERVICE CAR WASH */}
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="md:grid md:grid-cols-2">
                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Car className="w-6 h-6 text-blue-600" />
                                    <h3 className="text-xl font-semibold">Self-Service Car Wash</h3>
                                    <span className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Portfolio-Wide</span>
                                </div>
                                <p className="text-gray-600 mb-4">Available across all 12 NSL locations. All hardware supplied, maintained, and insured including liquids.</p>

                                <h4 className="font-medium mb-2">Key Benefits</h4>
                                <ul className="space-y-2 text-sm text-gray-700 mb-4">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> <strong>ZERO CAPEX</strong> for NSL</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> All hardware supplied & maintained</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Fully insured including liquids</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Revenue share basis</li>
                                </ul>

                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Approx. per site/year</span>
                                        <span className="font-semibold text-blue-700">~{formatCurrency(REVENUE_RATES.carwash)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
                                        <span className="font-medium">Portfolio Total ({summary.carwash.count} sites)</span>
                                        <span className="text-xl font-bold text-blue-700">{formatCurrency(summary.carwash.annual)}/yr</span>
                                    </div>
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
                                    <li>• NSL provides land & power access</li>
                                    <li>• Typical split: 85/15 or 80/20</li>
                                    <li>• <strong>Zero upfront cost</strong></li>
                                </ul>
                            </div>
                            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                                <h4 className="font-semibold text-blue-800 mb-2">Estimated Revenue</h4>
                                <ul className="text-sm space-y-1 text-gray-700">
                                    <li>• Gross profit: ~£24,000/yr per site</li>
                                    <li>• NSL share (15%): ~£3,600/yr per site</li>
                                    <li>• Portfolio potential: ~£43,200/yr</li>
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
                                    <td className="py-3 px-4 text-right font-semibold">+{formatCurrency(summary.locker.annual)}</td>
                                    <td className="py-3 pl-4 text-right"><span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded">Confirmed</span></td>
                                </tr>
                                <tr className="border-b border-white/10">
                                    <td className="py-3 pr-4 flex items-center gap-2"><Car className="w-4 h-4 text-blue-400" /> Self-Service Car Wash</td>
                                    <td className="py-3 px-4 text-center">{summary.carwash.count}</td>
                                    <td className="py-3 px-4 text-right font-semibold">+{formatCurrency(summary.carwash.annual)}</td>
                                    <td className="py-3 pl-4 text-right"><span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded">Portfolio-Wide</span></td>
                                </tr>
                                {/* OPTIONAL */}
                                <tr className="border-b border-white/10 opacity-60">
                                    <td className="py-3 pr-4 flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-400" /> EV Charging (RevShare)</td>
                                    <td className="py-3 px-4 text-center">TBD</td>
                                    <td className="py-3 px-4 text-right font-semibold">~£43k/yr</td>
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
                                    <td className="py-4 px-4 text-right font-bold text-2xl text-green-400">{formatCurrency(demandSummary.totalBaselineRevenue + demandSummary.totalLocalOffersUplift + summary.locker.annual + summary.carwash.annual)}</td>
                                    <td className="py-4 pl-4"></td>
                                </tr>
                                <tr>
                                    <td className="py-2 pr-4 text-white/70">Uplift from baseline</td>
                                    <td className="py-2 px-4 text-center text-white/70"></td>
                                    <td className="py-2 px-4 text-right font-semibold text-white/70">+{formatCurrency(demandSummary.totalLocalOffersUplift + summary.locker.annual + summary.carwash.annual)}</td>
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
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mb-3">1</div>
                            <h3 className="font-medium mb-1">Site Surveys</h3>
                            <p className="text-sm text-gray-600">Arrange surveys for all 12 approved locations to confirm locker placement and car wash suitability.</p>
                        </div>
                        <div className="border rounded-lg p-4">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mb-3">2</div>
                            <h3 className="font-medium mb-1">Locker Deployment</h3>
                            <p className="text-sm text-gray-600">Finalize locker agreements at {formatCurrency(summary.locker.annual)} P.A. plus VAT for the 12-site portfolio.</p>
                        </div>
                        <div className="border rounded-lg p-4">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mb-3">3</div>
                            <h3 className="font-medium mb-1">Car Wash Rollout</h3>
                            <p className="text-sm text-gray-600">Confirm car wash installations across the portfolio for an estimated {formatCurrency(summary.carwash.annual)}/yr additional revenue.</p>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t pt-8 mt-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Image src="/logo.png" alt="ParkBunny" width={100} height={32} className="h-6 w-auto" />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/nsl-logo.svg" alt="NSL" className="h-6 w-auto" />
                        </div>
                        <div className="text-sm text-gray-600 text-center md:text-right">
                            <p>© {new Date().getFullYear()} ParkBunny | <a href="mailto:hello@parkbunny.app" className="underline">hello@parkbunny.app</a></p>
                            <p className="text-xs mt-1">Prepared for NSL — West London Portfolio</p>
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
