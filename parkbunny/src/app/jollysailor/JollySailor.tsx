'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
    Lock, MapPin, Megaphone, Wrench, Gift, Star,
    Zap, Droplets, ShoppingBag, Coffee, Snowflake, UtensilsCrossed,
    ChevronRight, Check, Calendar, Clock, Heart, MessageCircle,
    Share2, X, Wifi, Plug, Waves, Shirt, Fuel, Sparkles,
    TrendingUp, Users, BarChart3, Play, SlidersHorizontal
} from 'lucide-react'
import {
    DECK_PASSWORD, TABS, BERTHS, PRICING_DEFAULTS, SEASONAL_MULTIPLIERS,
    SOCIAL_POSTS, SOCIAL_STATS, SERVICES, REWARDS, LOYALTY,
    type TabId, type Berth
} from '@/lib/jollysailor-data'

/* ═══════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════ */
export default function JollySailor() {
    const [authed, setAuthed] = useState(false)
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        if (password === DECK_PASSWORD) { setAuthed(true); setError('') }
        else setError('Incorrect access code')
    }

    if (!authed) return <LoginScreen password={password} setPassword={setPassword} error={error} onSubmit={handleLogin} />
    return <MarinaDashboard />
}

/* ═══════════════════════════════════════════
   LOGIN SCREEN
   ═══════════════════════════════════════════ */
function LoginScreen({ password, setPassword, error, onSubmit }: {
    password: string; setPassword: (v: string) => void; error: string; onSubmit: (e: React.FormEvent) => void
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated wave background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-40 opacity-10">
                    <svg viewBox="0 0 1440 320" className="w-full animate-pulse"><path fill="#0ea5e9" d="M0,160L48,170.7C96,181,192,203,288,192C384,181,480,139,576,138.7C672,139,768,181,864,186.7C960,192,1056,160,1152,149.3C1248,139,1344,149,1392,154.7L1440,160L1440,320L0,320Z" /></svg>
                </div>
            </div>
            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-sky-200/50 p-10 border border-sky-100">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-sky-300/30">
                            <Waves className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent" style={{ fontFamily: 'Fredoka, sans-serif' }}>JollySailor</h1>
                        <p className="text-slate-500 mt-1 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>Marina Platform Demo</p>
                        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><Image src="/logo.png" alt="ParkBunny" width={16} height={16} className="rounded" /> ParkBunny</span>
                            <span className="text-slate-300">|</span>
                            <span>Agena Group</span>
                        </div>
                    </div>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter access code" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all text-sm" autoFocus />
                        </div>
                        {error && <p className="text-red-500 text-xs text-center animate-shake">{error}</p>}
                        <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-sky-300/30 cursor-pointer text-sm">Enter Platform</button>
                    </form>
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════
   MARINA DASHBOARD (Main App Shell)
   ═══════════════════════════════════════════ */
function MarinaDashboard() {
    const [activeTab, setActiveTab] = useState<TabId>('mooring')
    const [fadeKey, setFadeKey] = useState(0)

    const switchTab = useCallback((tab: TabId) => {
        setFadeKey(k => k + 1)
        setActiveTab(tab)
    }, [])

    const tabIcons: Record<TabId, React.ReactNode> = {
        mooring: <MapPin className="w-5 h-5" />,
        social: <Megaphone className="w-5 h-5" />,
        services: <Wrench className="w-5 h-5" />,
        rewards: <Gift className="w-5 h-5" />,
        loyalty: <Star className="w-5 h-5" />,
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50" style={{ fontFamily: 'Nunito, sans-serif' }}>
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-sky-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-md shadow-sky-200/50">
                            <Waves className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent" style={{ fontFamily: 'Fredoka, sans-serif' }}>JollySailor</h1>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5"><Image src="/logo.png" alt="ParkBunny" width={20} height={20} className="rounded" /> <span className="hidden sm:inline">ParkBunny</span></span>
                        <span className="text-slate-200">|</span>
                        <span className="font-medium text-slate-500">Agena Group</span>
                    </div>
                </div>
                {/* Tab Navigation */}
                <div className="max-w-7xl mx-auto px-4">
                    <nav className="flex gap-1 -mb-px">
                        {TABS.map(tab => (
                            <button key={tab.id} onClick={() => switchTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-xl transition-all cursor-pointer ${activeTab === tab.id
                                        ? 'bg-gradient-to-b from-sky-50 to-white text-sky-600 border border-sky-200 border-b-white -mb-px shadow-sm'
                                        : 'text-slate-500 hover:text-sky-500 hover:bg-sky-50/50'
                                    }`} style={{ fontFamily: 'Fredoka, sans-serif' }}>
                                {tabIcons[tab.id]}
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            {/* Tab Content */}
            <main className="max-w-7xl mx-auto px-4 py-8" key={fadeKey}>
                <div className="animate-fadeIn">
                    {activeTab === 'mooring' && <MooringTab />}
                    {activeTab === 'social' && <SocialBeeTab />}
                    {activeTab === 'services' && <ServicesTab />}
                    {activeTab === 'rewards' && <RewardsTab />}
                    {activeTab === 'loyalty' && <LoyaltyTab />}
                </div>
            </main>

            {/* CSS Animations */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@300;400;500;600;700&display=swap');
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                @keyframes bobbing { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
                .animate-bob { animation: bobbing 3s ease-in-out infinite; }
                @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
                .animate-shake { animation: shake 0.3s ease-in-out; }
                @keyframes pop { 0% { transform: scale(0); } 80% { transform: scale(1.15); } 100% { transform: scale(1); } }
                .animate-pop { animation: pop 0.4s ease-out; }
                @keyframes unlockReveal { 0% { transform: rotateY(90deg); opacity: 0; } 100% { transform: rotateY(0); opacity: 1; } }
                .animate-unlock { animation: unlockReveal 0.5s ease-out; }
                @keyframes countUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-countUp { animation: countUp 0.6s ease-out; }
                @keyframes waterShimmer { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
            `}</style>
        </div>
    )
}

/* ═══════════════════════════════════════════
   TAB 1: MOORING & BOOKING
   ═══════════════════════════════════════════ */
function MooringTab() {
    const [selectedBerth, setSelectedBerth] = useState<Berth | null>(null)
    const [showPricing, setShowPricing] = useState(false)
    const [pricing, setPricing] = useState(PRICING_DEFAULTS)

    const calcPrice = (base: number) => {
        const season = SEASONAL_MULTIPLIERS[pricing.seasonalRate]
        const demand = 1 + (pricing.highDemandSurcharge / 100)
        return Math.round(base * pricing.baseMultiplier * season * demand * pricing.weatherMultiplier)
    }

    const statusColor = (s: string) => s === 'available' ? '#10B981' : s === 'occupied' ? '#EF4444' : '#F59E0B'
    const statusGlow = (s: string) => s === 'available' ? 'drop-shadow(0 0 6px rgba(16,185,129,0.5))' : 'none'

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-sky-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>Mooring & Berth Booking</h2>
                    <p className="text-slate-500 text-sm mt-1">Click a berth to view details. Green = available, Red = occupied, Yellow = maintenance.</p>
                </div>
                <button onClick={() => setShowPricing(!showPricing)} className="flex items-center gap-2 px-4 py-2 bg-white border border-sky-200 rounded-xl text-sky-600 text-sm font-medium hover:bg-sky-50 transition-colors cursor-pointer shadow-sm">
                    <SlidersHorizontal className="w-4 h-4" /> Pricing Engine
                </button>
            </div>

            {/* Date picker mock */}
            <div className="flex gap-4 items-center bg-white rounded-2xl p-4 border border-sky-100 shadow-sm">
                <div className="flex items-center gap-2 text-slate-600 text-sm"><Calendar className="w-4 h-4 text-sky-500" /><span className="font-medium">Arrival:</span><span className="px-3 py-1.5 bg-sky-50 rounded-lg text-sky-700 font-medium">15 Mar 2026</span></div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
                <div className="flex items-center gap-2 text-slate-600 text-sm"><Calendar className="w-4 h-4 text-sky-500" /><span className="font-medium">Departure:</span><span className="px-3 py-1.5 bg-sky-50 rounded-lg text-sky-700 font-medium">18 Mar 2026</span></div>
                <span className="ml-auto text-xs text-slate-400">3 nights</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Marina Map */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-sky-100 p-6 shadow-sm overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-sky-50/50 to-cyan-50/30 pointer-events-none" />
                    <svg viewBox="0 0 730 380" className="w-full relative z-10">
                        {/* Water background */}
                        <defs>
                            <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e0f2fe" /><stop offset="100%" stopColor="#bae6fd" /></linearGradient>
                            <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                        </defs>
                        <rect x="0" y="0" width="730" height="380" rx="16" fill="url(#water)" />
                        {/* Docks */}
                        {['A', 'B', 'C'].map((dock, di) => (
                            <React.Fragment key={dock}>
                                <rect x="40" y={35 + di * 120} width="660" height="8" rx="4" fill="#94a3b8" opacity="0.4" />
                                <text x="20" y={70 + di * 120} fill="#64748b" fontSize="11" fontWeight="600" fontFamily="Fredoka">{dock}</text>
                            </React.Fragment>
                        ))}
                        {/* Berths */}
                        {BERTHS.map(berth => (
                            <g key={berth.id} onClick={() => setSelectedBerth(berth)} className="cursor-pointer animate-bob" style={{ animationDelay: `${Math.random() * 2}s` }}>
                                <rect x={berth.x} y={berth.y} width={berth.size === 'L' ? 55 : berth.size === 'M' ? 45 : 35} height={24} rx="6" fill={statusColor(berth.status)} opacity={berth.status === 'maintenance' ? 0.5 : 0.85} filter={statusGlow(berth.status)} className="transition-all hover:opacity-100" />
                                <text x={berth.x + (berth.size === 'L' ? 27.5 : berth.size === 'M' ? 22.5 : 17.5)} y={berth.y + 15} textAnchor="middle" fill="white" fontSize="9" fontWeight="600" fontFamily="Nunito">{berth.id}</text>
                            </g>
                        ))}
                        {/* Legend */}
                        <g transform="translate(540, 350)">
                            {[{ c: '#10B981', l: 'Available' }, { c: '#EF4444', l: 'Occupied' }, { c: '#F59E0B', l: 'Maintenance' }].map((item, i) => (
                                <g key={i} transform={`translate(${i * 65}, 0)`}><circle cx="5" cy="5" r="4" fill={item.c} /><text x="13" y="9" fill="#64748b" fontSize="8" fontFamily="Nunito">{item.l}</text></g>
                            ))}
                        </g>
                    </svg>
                </div>

                {/* Detail Panel */}
                <div className="space-y-4">
                    {selectedBerth ? (
                        <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm animate-fadeIn">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-sky-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>Dock {selectedBerth.id}</h3>
                                <button onClick={() => setSelectedBerth(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-slate-500">Size</span><span className="font-medium text-slate-700">{selectedBerth.maxLength} ({selectedBerth.size === 'S' ? 'Small' : selectedBerth.size === 'M' ? 'Medium' : 'Large'})</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Status</span><span className={`font-medium ${selectedBerth.status === 'available' ? 'text-emerald-600' : selectedBerth.status === 'occupied' ? 'text-red-500' : 'text-amber-500'}`}>{selectedBerth.status.charAt(0).toUpperCase() + selectedBerth.status.slice(1)}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Price / night</span><span className="font-bold text-sky-600 text-lg">£{calcPrice(selectedBerth.basePrice)}</span></div>
                                <div className="border-t border-slate-100 pt-3">
                                    <p className="text-slate-500 text-xs font-medium mb-2">AMENITIES</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedBerth.amenities.map(a => (
                                            <span key={a} className="flex items-center gap-1 text-xs bg-sky-50 text-sky-600 px-2 py-1 rounded-lg">
                                                {a === 'Power' && <Plug className="w-3 h-3" />}{a === 'Water' && <Droplets className="w-3 h-3" />}{a === 'WiFi' && <Wifi className="w-3 h-3" />}{a === 'Pump-out' && <Waves className="w-3 h-3" />}{a}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {selectedBerth.status === 'available' && (
                                    <button className="w-full mt-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold rounded-xl shadow-lg shadow-orange-200/50 transition-all cursor-pointer text-sm">Book Now — £{calcPrice(selectedBerth.basePrice) * 3} for 3 nights</button>
                                )}
                                {pricing.highDemandSurcharge > 0 && <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-center">⚡ Dynamic pricing in effect — {pricing.occupancyPercent}% occupancy</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/60 rounded-2xl border border-dashed border-sky-200 p-8 text-center">
                            <MapPin className="w-10 h-10 text-sky-300 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm">Click a berth on the map to view details and pricing</p>
                        </div>
                    )}

                    {/* Pricing Engine Panel */}
                    {showPricing && (
                        <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm animate-fadeIn">
                            <h3 className="text-sm font-bold text-sky-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'Fredoka, sans-serif' }}><SlidersHorizontal className="w-4 h-4 text-sky-500" /> Dynamic Pricing Engine</h3>
                            <div className="space-y-4">
                                <SliderControl label="Demand Surcharge" value={pricing.highDemandSurcharge} min={0} max={50} suffix="%" onChange={v => setPricing(p => ({ ...p, highDemandSurcharge: v }))} />
                                <SliderControl label="Weather Multiplier" value={Math.round(pricing.weatherMultiplier * 100)} min={100} max={200} suffix="%" onChange={v => setPricing(p => ({ ...p, weatherMultiplier: v / 100 }))} />
                                <div>
                                    <p className="text-xs text-slate-500 mb-1.5 font-medium">Seasonal Rate</p>
                                    <div className="flex gap-2">{(['low', 'mid', 'high'] as const).map(s => (
                                        <button key={s} onClick={() => setPricing(p => ({ ...p, seasonalRate: s }))} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${pricing.seasonalRate === s ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                                    ))}</div>
                                </div>
                                <div className="bg-sky-50 rounded-xl p-3 text-center">
                                    <p className="text-xs text-sky-600">Occupancy</p>
                                    <p className="text-2xl font-bold text-sky-700" style={{ fontFamily: 'Fredoka, sans-serif' }}>{pricing.occupancyPercent}%</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function SliderControl({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix: string; onChange: (v: number) => void }) {
    return (
        <div>
            <div className="flex justify-between text-xs mb-1.5"><span className="text-slate-500 font-medium">{label}</span><span className="text-sky-600 font-bold">{value}{suffix}</span></div>
            <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full h-2 bg-sky-100 rounded-lg appearance-none cursor-pointer accent-sky-500" />
        </div>
    )
}

/* ═══════════════════════════════════════════
   TAB 2: SOCIAL BEE
   ═══════════════════════════════════════════ */
function SocialBeeTab() {
    const [showCompose, setShowCompose] = useState(false)
    const platformIcon = (p: string) => p === 'facebook' ? '📘' : p === 'instagram' ? '📸' : '𝕏'
    const platformColor = (p: string) => p === 'facebook' ? 'bg-blue-50 border-blue-200 text-blue-600' : p === 'instagram' ? 'bg-pink-50 border-pink-200 text-pink-600' : 'bg-slate-50 border-slate-200 text-slate-600'

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-sky-900 flex items-center gap-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                        <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600"><Megaphone className="w-4 h-4" /></span> Social Bee
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Manage all your social channels from one dashboard.</p>
                </div>
                <button onClick={() => setShowCompose(!showCompose)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-medium rounded-xl shadow-md shadow-sky-200/50 cursor-pointer text-sm hover:from-sky-400 hover:to-cyan-400 transition-all">+ New Post</button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Posts This Week', value: SOCIAL_STATS.postsThisWeek, icon: <BarChart3 className="w-4 h-4" />, color: 'sky' },
                    { label: 'New Followers', value: `+${SOCIAL_STATS.newFollowers}`, icon: <Users className="w-4 h-4" />, color: 'emerald' },
                    { label: 'Avg Engagement', value: `${SOCIAL_STATS.avgEngagement}%`, icon: <TrendingUp className="w-4 h-4" />, color: 'amber' },
                    { label: 'Top Platform', value: SOCIAL_STATS.topPlatform, icon: <Heart className="w-4 h-4" />, color: 'pink' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-sky-100 p-4 shadow-sm animate-countUp" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className={`w-8 h-8 rounded-lg bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-500 mb-2`}>{stat.icon}</div>
                        <p className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Fredoka, sans-serif' }}>{stat.value}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Connected Accounts */}
            <div className="flex gap-3">
                {['Facebook', 'Instagram', 'Twitter/X'].map(acc => (
                    <span key={acc} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-sky-100 rounded-full text-xs text-slate-600 shadow-sm">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full" /> {acc} <Check className="w-3 h-3 text-emerald-500" />
                    </span>
                ))}
            </div>

            {/* Content Calendar */}
            <div className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-sky-50 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-500" />
                    <h3 className="text-sm font-bold text-sky-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>This Week&apos;s Schedule</h3>
                </div>
                <div className="grid grid-cols-7 divide-x divide-sky-50">
                    {days.map(day => {
                        const posts = SOCIAL_POSTS.filter(p => p.scheduledDate === day)
                        return (
                            <div key={day} className="p-3 min-h-[180px]">
                                <p className="text-xs font-bold text-slate-400 mb-3 uppercase">{day}</p>
                                <div className="space-y-2">
                                    {posts.map(post => (
                                        <div key={post.id} className={`p-2.5 rounded-xl border text-xs cursor-pointer hover:shadow-md transition-all ${platformColor(post.platform)}`}>
                                            <div className="flex items-center gap-1 mb-1.5"><span>{platformIcon(post.platform)}</span><span className="text-[10px] font-medium">{post.scheduledTime}</span></div>
                                            <p className="line-clamp-2 leading-relaxed">{post.content}</p>
                                            <div className="flex items-center gap-2 mt-2 text-[10px] opacity-60">
                                                <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" />{post.engagement.likes}</span>
                                                <span className="flex items-center gap-0.5"><MessageCircle className="w-2.5 h-2.5" />{post.engagement.comments}</span>
                                                <span className="flex items-center gap-0.5"><Share2 className="w-2.5 h-2.5" />{post.engagement.shares}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Compose Modal */}
            {showCompose && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowCompose(false)}>
                    <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-fadeIn" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-sky-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>Create Post</h3>
                            <button onClick={() => setShowCompose(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
                        </div>
                        <textarea className="w-full h-28 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-400" placeholder="What's happening at the marina?" />
                        <div className="flex items-center gap-2 mt-3">
                            <span className="text-xs text-slate-400 mr-2">Post to:</span>
                            {['Facebook', 'Instagram', 'Twitter/X'].map(p => (
                                <button key={p} className="px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg text-xs font-medium cursor-pointer hover:bg-sky-100 transition-colors">{p}</button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500"><Calendar className="w-3.5 h-3.5" /> Today</div>
                            <div className="flex items-center gap-2 text-xs text-slate-500"><Clock className="w-3.5 h-3.5" /> 12:00</div>
                            <button className="ml-auto px-6 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-medium rounded-xl text-sm cursor-pointer hover:from-sky-400 hover:to-cyan-400 transition-all shadow-md">Schedule</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ═══════════════════════════════════════════
   TAB 3: SERVICES
   ═══════════════════════════════════════════ */
function ServicesTab() {
    const [booked, setBooked] = useState<Record<string, boolean>>({})
    const [expanded, setExpanded] = useState<string | null>(null)

    const svcIcons: Record<string, React.ReactNode> = {
        sparkles: <Sparkles className="w-6 h-6" />, fuel: <Fuel className="w-6 h-6" />, droplets: <Droplets className="w-6 h-6" />,
        wrench: <Wrench className="w-6 h-6" />, shirt: <Shirt className="w-6 h-6" />, shoppingBag: <ShoppingBag className="w-6 h-6" />,
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-sky-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>Marina Services</h2>
                <p className="text-slate-500 text-sm mt-1">Book additional services for your stay. Request online, we handle the rest.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SERVICES.map((svc, i) => (
                    <div key={svc.id} className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm hover:shadow-md hover:border-sky-200 transition-all cursor-pointer animate-fadeIn" style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center text-sky-500 mb-4">{svcIcons[svc.icon]}</div>
                        <h3 className="font-bold text-slate-800 mb-1" style={{ fontFamily: 'Fredoka, sans-serif' }}>{svc.name}</h3>
                        <p className="text-sm text-slate-500 mb-3">{svc.description}</p>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                            <span className="font-semibold text-sky-600">{svc.price}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {svc.availability}</span>
                        </div>
                        {booked[svc.id] ? (
                            <div className="flex items-center gap-2 py-2.5 px-4 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-medium animate-pop">
                                <Check className="w-4 h-4" /> Booked — Tomorrow 10:00
                            </div>
                        ) : expanded === svc.id ? (
                            <div className="space-y-3 animate-fadeIn">
                                <div className="flex gap-2">
                                    <span className="px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg text-xs font-medium">Tomorrow</span>
                                    <span className="px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg text-xs font-medium">10:00 AM</span>
                                </div>
                                <button onClick={() => { setBooked(b => ({ ...b, [svc.id]: true })); setExpanded(null) }} className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl text-sm cursor-pointer hover:from-orange-400 hover:to-amber-400 transition-all shadow-md">Confirm Booking</button>
                            </div>
                        ) : (
                            <button onClick={() => setExpanded(svc.id)} className="w-full py-2.5 bg-sky-50 text-sky-600 font-medium rounded-xl text-sm cursor-pointer hover:bg-sky-100 transition-colors">Book Service</button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════
   TAB 4: REWARDS
   ═══════════════════════════════════════════ */
function RewardsTab() {
    const [unlocked, setUnlocked] = useState(false)
    const [redeemed, setRedeemed] = useState<Record<string, boolean>>({})

    const rewardIcons: Record<string, React.ReactNode> = {
        fuel: <Fuel className="w-6 h-6" />, coffee: <Coffee className="w-6 h-6" />, shoppingBag: <ShoppingBag className="w-6 h-6" />,
        snowflake: <Snowflake className="w-6 h-6" />, shirt: <Shirt className="w-6 h-6" />, utensils: <UtensilsCrossed className="w-6 h-6" />,
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-sky-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>Rewards</h2>
                    <p className="text-slate-500 text-sm mt-1">{unlocked ? 'Your exclusive rewards for this stay. Tap to redeem!' : 'Book a berth to unlock exclusive marina rewards.'}</p>
                </div>
                {!unlocked && (
                    <button onClick={() => setUnlocked(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl shadow-md cursor-pointer text-sm hover:from-orange-400 hover:to-amber-400 transition-all">
                        <Play className="w-4 h-4" /> Simulate Booking
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {REWARDS.map((reward, i) => (
                    <div key={reward.id} className={`rounded-2xl border p-6 transition-all ${unlocked ? 'bg-white border-sky-100 shadow-sm hover:shadow-md animate-unlock' : 'bg-slate-50/50 border-slate-200/50'}`} style={unlocked ? { animationDelay: `${i * 120}ms` } : undefined}>
                        {!unlocked && <div className="absolute inset-0 rounded-2xl backdrop-blur-[2px] bg-white/40 flex items-center justify-center z-10"><Lock className="w-6 h-6 text-slate-300 animate-shake" style={{ animationIterationCount: 'infinite', animationDuration: '2s' }} /></div>}
                        <div className="relative">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${unlocked ? 'bg-gradient-to-br from-orange-100 to-amber-100 text-orange-500' : 'bg-slate-100 text-slate-300'}`}>
                                {rewardIcons[reward.icon]}
                            </div>
                            <div className={`absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${unlocked ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-400'}`}>{reward.discount}</div>
                            <h3 className={`font-bold mb-1 ${unlocked ? 'text-slate-800' : 'text-slate-400'}`} style={{ fontFamily: 'Fredoka, sans-serif' }}>{reward.title}</h3>
                            <p className={`text-sm mb-2 ${unlocked ? 'text-slate-500' : 'text-slate-300'}`}>{reward.description}</p>
                            <p className={`text-xs ${unlocked ? 'text-slate-400' : 'text-slate-200'}`}>{reward.terms}</p>
                            {unlocked && !redeemed[reward.id] && (
                                <button onClick={() => setRedeemed(r => ({ ...r, [reward.id]: true }))} className="mt-4 w-full py-2 bg-sky-50 text-sky-600 font-medium rounded-xl text-sm cursor-pointer hover:bg-sky-100 transition-colors">Redeem</button>
                            )}
                            {redeemed[reward.id] && (
                                <div className="mt-4 py-3 px-4 bg-emerald-50 text-emerald-600 rounded-xl text-center text-sm font-medium animate-pop">
                                    <Check className="w-4 h-4 inline mr-1" /> Redeemed ✓
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════
   TAB 5: LOYALTY
   ═══════════════════════════════════════════ */
function LoyaltyTab() {
    const [stamps, setStamps] = useState(LOYALTY.currentStamps)
    const [justEarned, setJustEarned] = useState<number | null>(null)
    const total = LOYALTY.totalRequired
    const remaining = total - stamps

    const simulateStay = () => {
        if (stamps < total) {
            const next = stamps + 1
            setJustEarned(next)
            setStamps(next)
            setTimeout(() => setJustEarned(null), 1500)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-sky-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>Loyalty Card</h2>
                <p className="text-slate-500 text-sm mt-1">Collect {total} stamps for a free overnight stay</p>
            </div>

            {/* Stamp Card */}
            <div className="bg-white rounded-3xl border border-sky-100 p-8 shadow-md relative overflow-hidden">
                {stamps >= total && <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-400/10 to-orange-400/10" />}
                <div className="grid grid-cols-5 gap-4">
                    {Array.from({ length: total }).map((_, i) => {
                        const filled = i < stamps
                        const isNew = justEarned === i + 1
                        return (
                            <div key={i} className={`aspect-square rounded-2xl border-2 flex items-center justify-center transition-all ${filled ? 'bg-gradient-to-br from-amber-100 to-orange-100 border-amber-300 shadow-md' : 'border-dashed border-slate-200 bg-slate-50'
                                } ${isNew ? 'animate-pop' : ''}`}>
                                {filled ? (
                                    <Star className={`w-8 h-8 text-amber-500 ${isNew ? 'animate-pop' : ''}`} fill="currentColor" />
                                ) : (
                                    <span className="text-slate-300 text-sm font-medium">{i + 1}</span>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Progress */}
                <div className="mt-6">
                    <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">{stamps} / {total} stays</span>
                        <span className="text-sky-600 font-medium">{remaining > 0 ? `${remaining} more to go!` : '🎉 Earned!'}</span>
                    </div>
                    <div className="w-full h-3 bg-sky-50 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700" style={{ width: `${(stamps / total) * 100}%` }} />
                    </div>
                </div>

                {stamps >= total ? (
                    <button className="w-full mt-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl text-lg shadow-lg shadow-orange-200/50 cursor-pointer hover:from-amber-400 hover:to-orange-400 transition-all animate-pop" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                        🎉 Redeem Free Night!
                    </button>
                ) : (
                    <button onClick={simulateStay} className="w-full mt-6 py-3 bg-sky-50 text-sky-600 font-medium rounded-xl text-sm cursor-pointer hover:bg-sky-100 transition-colors">
                        <Play className="w-4 h-4 inline mr-1" /> Simulate Overnight Stay
                    </button>
                )}
            </div>

            {/* History */}
            <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-sky-900 mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>Stay History</h3>
                <div className="space-y-3">
                    {LOYALTY.history.map((stay, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm animate-fadeIn" style={{ animationDelay: `${i * 60}ms` }}>
                            <Star className="w-4 h-4 text-amber-500 shrink-0" fill="currentColor" />
                            <span className="text-slate-700 font-medium">{stay.date}</span>
                            <span className="text-slate-400 text-xs">{stay.marina}</span>
                            <span className="ml-auto text-xs text-sky-600 font-medium">{stay.nights} night{stay.nights > 1 ? 's' : ''}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
