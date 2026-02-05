'use client'

import React, { useState } from 'react'
import type { BuzzBingoSite } from '@/lib/buzzbingo-logic'
import { calculatePortfolioSummary, groupByRegion, formatCurrency, REVENUE_RATES } from '@/lib/buzzbingo-logic'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Lock, MapPin, Package, Car, Zap, ShoppingBag, Monitor, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const BuzzBingoMap = dynamic(() => import('./BuzzBingoMap'), {
    loading: () => <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">Loading Map...</div>,
    ssr: false
})

const PASSWORD = 'nexusbuzz2026'

interface Props {
    data: BuzzBingoSite[]
}

export default function ClientProposal({ data }: Props) {
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

    return <ProposalReport data={data} selectedSiteId={selectedSiteId} setSelectedSiteId={setSelectedSiteId} />
}

// ============ LOGIN SCREEN ============
function LoginScreen({ password, setPassword, error, onSubmit }: {
    password: string
    setPassword: (v: string) => void
    error: string
    onSubmit: (e: React.FormEvent) => void
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white/95 backdrop-blur rounded-2xl shadow-2xl overflow-hidden grid md:grid-cols-2">
                {/* Left: Branding Image */}
                <div className="relative hidden md:block bg-gradient-to-br from-red-500 to-red-600 p-8">
                    <div className="absolute inset-0 opacity-20">
                        <Image src="/buzzbingo.png" alt="Buzz Bingo" fill className="object-contain p-12" />
                    </div>
                    <div className="relative z-10 h-full flex flex-col justify-end text-white">
                        <h2 className="text-3xl font-bold mb-2">Buzz Bingo Portfolio</h2>
                        <p className="text-white/80">Multi-Stream Revenue Proposal</p>
                        <p className="text-white/60 text-sm mt-2">23 Sites | Group Nexus Partnership</p>
                    </div>
                </div>

                {/* Right: Login Form */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                    {/* Triple Branding */}
                    <div className="flex items-center gap-3 mb-8 justify-center">
                        <Image src="/logo.png" alt="ParkBunny" width={100} height={32} className="h-8 w-auto" />
                        <span className="text-gray-300">|</span>
                        <Image src="/groupnexus.jpeg" alt="Group Nexus" width={80} height={32} className="h-8 w-auto rounded" />
                        <span className="text-gray-300">|</span>
                        <Image src="/buzzbingo.png" alt="Buzz Bingo" width={40} height={40} className="h-10 w-auto" />
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
                                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                            />
                        </div>
                        {error && <p className="text-red-600 text-sm">{error}</p>}
                        <button
                            type="submit"
                            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
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
function ProposalReport({ data, selectedSiteId, setSelectedSiteId }: {
    data: BuzzBingoSite[]
    selectedSiteId: string | null
    setSelectedSiteId: (id: string | null) => void
}) {
    const summary = calculatePortfolioSummary(data)
    const regionGroups = groupByRegion(data)
    const regionOrder = ['London', 'South East', 'South West', 'South Coast', 'East of England', 'Midlands', 'North West', 'Yorkshire', 'North East', 'Scotland']

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Image src="/logo.png" alt="ParkBunny" width={120} height={40} className="h-8 w-auto" />
                        <span className="text-gray-300">|</span>
                        <Image src="/groupnexus.jpeg" alt="Group Nexus" width={60} height={24} className="h-6 w-auto rounded" />
                        <span className="text-gray-300">|</span>
                        <Image src="/buzzbingo.png" alt="Buzz Bingo" width={32} height={32} className="h-8 w-auto" />
                    </div>
                    <div className="text-right text-sm text-gray-600">
                        <p className="font-medium">Revenue Uplift Proposal</p>
                        <p className="text-xs">February 2026</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">
                {/* Hero Section */}
                <section className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-8 text-white">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">Buzz Bingo Portfolio</h1>
                    <p className="text-white/80 mb-6">Comprehensive Revenue Uplift Strategy for 23 Locations</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Total Sites" value="23" />
                        <StatCard label="Current Baseline" value={formatCurrency(summary.baseline)} />
                        <StatCard label="Revenue Streams" value="4+" />
                        <StatCard label="Regions" value={Object.keys(regionGroups).length.toString()} />
                    </div>
                </section>

                {/* Portfolio Map */}
                <section className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-4 border-b">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-red-500" />
                            Portfolio Overview
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">All 23 Buzz Bingo locations across the UK</p>
                    </div>
                    <div className="h-[400px]">
                        <BuzzBingoMap data={data} selectedId={selectedSiteId} onSelect={setSelectedSiteId} />
                    </div>
                </section>

                {/* Site List by Region */}
                <section className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-xl font-semibold mb-4">Site Locations by Region</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                </section>

                {/* ============ REVENUE STREAMS ============ */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">Additional Revenue Streams</h2>

                    {/* LOCKERS */}
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
                                </div>
                            </div>
                            <div className="relative h-64 md:h-auto bg-gray-100">
                                <Image src="/lockerphoto.webp" alt="Smart Lockers" fill className="object-cover" />
                            </div>
                        </div>
                    </div>

                    {/* SELF-SERVICE CAR WASH */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Car className="w-6 h-6 text-blue-600" />
                            <h3 className="text-xl font-semibold">Self-Service Car Wash</h3>
                            <span className="ml-auto bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">Subject to Survey</span>
                        </div>
                        <p className="text-gray-600 mb-4">Interest confirmed for 6 sites. All hardware supplied, maintained, and insured including liquids.</p>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium mb-2">Key Benefits</h4>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> <strong>ZERO CAPEX</strong> for Buzz Bingo</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> All hardware supplied & maintained</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Fully insured including liquids</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Revenue share basis</li>
                                </ul>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Approx. per site/year</span>
                                    <span className="font-semibold text-blue-700">~{formatCurrency(REVENUE_RATES.carwash)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
                                    <span className="font-medium">Potential ({summary.carwash.count} sites)</span>
                                    <span className="text-xl font-bold text-blue-700">{formatCurrency(summary.carwash.annual)}/yr</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Final revenue dependent on space and survey results</p>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600"><strong>Target Sites:</strong> Birmingham Great Park, Bristol Fishponds, Coventry Savoy, Fenton, Lordshill, Peterborough</p>
                        </div>
                    </div>

                    {/* EV CHARGING */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-6 h-6 text-emerald-600" />
                            <h3 className="text-xl font-semibold">EV Charging Infrastructure</h3>
                            <span className="ml-auto bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">Phased Rollout</span>
                        </div>
                        <p className="text-gray-600 mb-4">
                            In partnership with Emerge Renewable Solutions. Proposal for 4 × 22kW AC chargers (8 bays) per site, aligned with typical 2-3 hour bingo session times.
                        </p>

                        {/* Two Options */}
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                            <div className="border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50">
                                <h4 className="font-semibold text-emerald-800 mb-2">Option A: CAPEX (Buzz Funded)</h4>
                                <ul className="text-sm space-y-1 text-gray-700">
                                    <li>• Buzz Bingo funds installation</li>
                                    <li>• Retains charging revenue (minus O&M)</li>
                                    <li>• Install cost: {formatCurrency(REVENUE_RATES.ev.capexPerSite.min)}-{formatCurrency(REVENUE_RATES.ev.capexPerSite.max)}/site</li>
                                    <li>• Gross profit: ~{formatCurrency(REVENUE_RATES.ev.grossProfitPerYear)}/yr/site</li>
                                    <li>• <strong>Payback: 1.4-1.8 years</strong></li>
                                </ul>
                            </div>
                            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                                <h4 className="font-semibold text-blue-800 mb-2">Option B: Revenue Share (Emerge Funded)</h4>
                                <ul className="text-sm space-y-1 text-gray-700">
                                    <li>• Emerge funds, owns & operates chargers</li>
                                    <li>• Buzz provides land & power access</li>
                                    <li>• Split: 85% Emerge / 15% Buzz Bingo</li>
                                    <li>• Minimum utilisation thresholds apply</li>
                                    <li>• <strong>Zero upfront cost for Buzz</strong></li>
                                </ul>
                            </div>
                        </div>

                        {/* Phased Approach */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium mb-3">Recommended Phased Rollout</h4>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                                <div className="bg-white rounded p-3 border">
                                    <p className="font-medium">Phase 1</p>
                                    <p className="text-gray-600">6 sites</p>
                                    <p className="text-emerald-600 font-medium">{formatCurrency(210000)}-{formatCurrency(270000)}</p>
                                </div>
                                <div className="bg-white rounded p-3 border">
                                    <p className="font-medium">Phase 2</p>
                                    <p className="text-gray-600">8 sites</p>
                                    <p className="text-emerald-600 font-medium">{formatCurrency(280000)}-{formatCurrency(360000)}</p>
                                </div>
                                <div className="bg-white rounded p-3 border">
                                    <p className="font-medium">Phase 3</p>
                                    <p className="text-gray-600">9 sites</p>
                                    <p className="text-emerald-600 font-medium">{formatCurrency(315000)}-{formatCurrency(405000)}</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-3">* Costs subject to site surveys, DNO analysis, and grid capacity assessment</p>
                        </div>

                        <div className="mt-4 p-3 bg-emerald-50 rounded-lg text-sm">
                            <p className="text-emerald-800"><strong>Priority Sites (High EV adoption):</strong> Bristol Fishponds, Brighton, Derby City, Nottingham Top Valley</p>
                            <p className="text-emerald-700 mt-1">Contact: Emerge Renewable Solutions — charlotte@emerge-renewables.com</p>
                        </div>
                    </div>

                    {/* FARMERS MARKETS */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <ShoppingBag className="w-6 h-6 text-orange-600" />
                            <h3 className="text-xl font-semibold">Farmers Markets</h3>
                            <span className="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Subject to Survey</span>
                        </div>
                        <p className="text-gray-600">
                            Potential for regular farmers markets at suitable sites. Revenue estimated at <strong>£1,000-£2,500 per day</strong> depending on footfall and site configuration.
                        </p>
                        <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Site surveys required to confirm viability
                        </p>
                    </div>

                    {/* OTHER MENTIONS */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Monitor className="w-6 h-6 text-purple-600" />
                                <h3 className="font-semibold">Digital Signage</h3>
                            </div>
                            <p className="text-gray-600 text-sm">Buzz Bingo already engaged with B2Bee digital signage agency since pre-Christmas. Discussions ongoing.</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Car className="w-6 h-6 text-gray-600" />
                                <h3 className="font-semibold">WeBuyAnyCar</h3>
                                <span className="ml-auto text-xs text-gray-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Pending</span>
                            </div>
                            <p className="text-gray-600 text-sm">Awaiting report for potential portfolio integration.</p>
                        </div>
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
                                <tr className="border-b border-white/10">
                                    <td className="py-3 pr-4 flex items-center gap-2"><Package className="w-4 h-4 text-indigo-400" /> Smart Lockers</td>
                                    <td className="py-3 px-4 text-center">{summary.locker.count}</td>
                                    <td className="py-3 px-4 text-right font-semibold">{formatCurrency(summary.locker.annual)}</td>
                                    <td className="py-3 pl-4 text-right"><span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded">Confirmed</span></td>
                                </tr>
                                <tr className="border-b border-white/10">
                                    <td className="py-3 pr-4 flex items-center gap-2"><Car className="w-4 h-4 text-blue-400" /> Self-Service Car Wash</td>
                                    <td className="py-3 px-4 text-center">{summary.carwash.count}</td>
                                    <td className="py-3 px-4 text-right font-semibold">{formatCurrency(summary.carwash.annual)}</td>
                                    <td className="py-3 pl-4 text-right"><span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded">Survey</span></td>
                                </tr>
                                <tr className="border-b border-white/10">
                                    <td className="py-3 pr-4 flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-400" /> EV Charging (RevShare)</td>
                                    <td className="py-3 px-4 text-center">{summary.ev.count} initial</td>
                                    <td className="py-3 px-4 text-right font-semibold">Variable</td>
                                    <td className="py-3 pl-4 text-right"><span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded">Phased</span></td>
                                </tr>
                                <tr>
                                    <td className="py-3 pr-4 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-orange-400" /> Farmers Markets</td>
                                    <td className="py-3 px-4 text-center">TBD</td>
                                    <td className="py-3 px-4 text-right font-semibold">£1k-2.5k/day</td>
                                    <td className="py-3 pl-4 text-right"><span className="bg-gray-500/20 text-gray-300 text-xs px-2 py-1 rounded">Survey</span></td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-white/30">
                                    <td className="py-4 pr-4 font-bold text-lg">Confirmed Annual Uplift</td>
                                    <td className="py-4 px-4 text-center font-bold">{summary.locker.count}</td>
                                    <td className="py-4 px-4 text-right font-bold text-2xl text-green-400">{formatCurrency(summary.locker.annual)}</td>
                                    <td className="py-4 pl-4"></td>
                                </tr>
                                <tr>
                                    <td className="py-2 pr-4 text-white/70">Potential (with surveys)</td>
                                    <td className="py-2 px-4 text-center text-white/70">{summary.locker.count + summary.carwash.count}+</td>
                                    <td className="py-2 px-4 text-right font-semibold text-white/70">{formatCurrency(summary.locker.annual + summary.carwash.annual)}+</td>
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
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold mb-3">1</div>
                            <h3 className="font-medium mb-1">Site Surveys</h3>
                            <p className="text-sm text-gray-600">Arrange surveys for Car Wash and Farmers Market suitability at priority sites.</p>
                        </div>
                        <div className="border rounded-lg p-4">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold mb-3">2</div>
                            <h3 className="font-medium mb-1">EV Priority Selection</h3>
                            <p className="text-sm text-gray-600">Confirm 6 Phase 1 EV sites with Emerge for detailed feasibility studies.</p>
                        </div>
                        <div className="border rounded-lg p-4">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold mb-3">3</div>
                            <h3 className="font-medium mb-1">Contract Finalization</h3>
                            <p className="text-sm text-gray-600">Execute locker agreements and finalize commercial terms for all confirmed streams.</p>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t pt-8 mt-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Image src="/logo.png" alt="ParkBunny" width={100} height={32} className="h-6 w-auto" />
                            <Image src="/groupnexus.jpeg" alt="Group Nexus" width={60} height={24} className="h-5 w-auto rounded" />
                            <Image src="/buzzbingo.png" alt="Buzz Bingo" width={32} height={32} className="h-6 w-auto" />
                        </div>
                        <div className="text-sm text-gray-600 text-center md:text-right">
                            <p>© {new Date().getFullYear()} ParkBunny | <a href="mailto:hello@parkbunny.app" className="underline">hello@parkbunny.app</a></p>
                            <p className="text-xs mt-1">Prepared for Group Nexus — Buzz Bingo Portfolio</p>
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
