'use client'

import React from 'react'
import Image from 'next/image'
import type { DemoConfig } from '@/lib/demo-configs/types'
import { X, TrendingUp, Clock, Users, BarChart3, ShoppingBag, Target, Building2, Car as CarIcon, Sparkles } from 'lucide-react'

type Props = {
    config: DemoConfig
    onClose?: () => void
}

function StatCard({ label, value, sublabel, icon: Icon, color }: {
    label: string; value: string; sublabel: string; icon: React.ElementType; color: string
}) {
    return (
        <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${color}15` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                </div>
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm font-medium text-gray-700 mt-1">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>
        </div>
    )
}

export default function PartnerScreen({ config, onClose }: Props) {
    const { operator, location, partnerView: pv } = config
    const { colors } = operator

    const baseline = pv.baselineRevenue
    const upliftAmount = Math.round(baseline * pv.projectedUplift / 100)
    const totalProjected = baseline + upliftAmount

    return (
        <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc' }}>
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-full text-xs font-bold text-white"
                        style={{ background: colors.secondary }}>
                        PARTNER VIEW
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{operator.name} × ParkBunny</span>
                </div>
                {onClose && (
                    <button onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </header>

            <div className="flex-1 px-6 py-6 space-y-6 max-w-2xl mx-auto w-full pb-28">
                {/* Dual branding */}
                <div className="flex items-center justify-center gap-4 py-3">
                    <Image src={operator.logo} alt={operator.name} width={140} height={40}
                        className="h-8 w-auto object-contain" unoptimized style={{ filter: 'brightness(0)' }} />
                    <span className="text-gray-300 text-xl">×</span>
                    <Image src="/logo.png" alt="ParkBunny" width={120} height={32}
                        className="h-7 w-auto object-contain" />
                </div>

                {/* Revenue headline */}
                <div className="rounded-2xl p-6 text-white text-center shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${colors.secondary}, ${colors.primary})` }}>
                    <p className="text-sm font-medium text-white/70 mb-1">Total Projected Annual Revenue</p>
                    <p className="text-4xl font-bold mb-2">
                        £{totalProjected.toLocaleString('en-GB')}
                    </p>
                    <p className="text-sm text-white/80">
                        {location.name} — {location.totalSpaces} spaces — {location.city}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-300" />
                        <span className="text-emerald-300 font-semibold">+{pv.projectedUplift}% uplift</span>
                        <span className="text-white/50">|</span>
                        <span className="text-white/80">+£{upliftAmount.toLocaleString('en-GB')}/yr</span>
                    </div>
                </div>

                {/* KPI grid */}
                <div className="grid grid-cols-2 gap-3">
                    <StatCard
                        icon={TrendingUp}
                        label="Revenue Uplift"
                        value={`+${pv.projectedUplift}%`}
                        sublabel={`+£${upliftAmount.toLocaleString('en-GB')} annually`}
                        color="#10b981"
                    />
                    <StatCard
                        icon={Clock}
                        label="Avg. Dwell Increase"
                        value={`+${pv.avgDwellIncrease} min`}
                        sublabel="Additional time per visit"
                        color={colors.primary}
                    />
                    <StatCard
                        icon={Users}
                        label="Driver Retention"
                        value={`${pv.driverRetention}%`}
                        sublabel="Return within 30 days"
                        color="#8b5cf6"
                    />
                    <StatCard
                        icon={ShoppingBag}
                        label="Deals Redeemed"
                        value={pv.dealsRedeemed.toLocaleString()}
                        sublabel="This month (projected)"
                        color="#f59e0b"
                    />
                    <StatCard
                        icon={Target}
                        label="Partner Engagement"
                        value={`${pv.partnerEngagement}%`}
                        sublabel="Active local partners"
                        color="#ef4444"
                    />
                    <StatCard
                        icon={BarChart3}
                        label="Footfall Conversion"
                        value={`${pv.footfallConversion}%`}
                        sublabel="Deals → in-store visits"
                        color="#06b6d4"
                    />
                </div>

                {/* Value props */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Platform Value</h3>
                    {[
                        { icon: Building2, title: 'For Operators', desc: 'Underused space becomes a revenue engine. New monetisation layer driving demand stimulation.' },
                        { icon: CarIcon, title: 'For Drivers', desc: 'Parking feels rewarding — real savings creating habit formation and loyalty.' },
                        { icon: Sparkles, title: 'For Partners', desc: 'Footfall conversion through targeted local marketing with measurable ROI.' },
                    ].map(vp => (
                        <div key={vp.title} className="rounded-xl bg-white border border-gray-100 p-4 flex items-start gap-3 shadow-sm">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                style={{ background: `${colors.primary}15` }}>
                                <vp.icon className="w-4.5 h-4.5" style={{ color: colors.primary }} />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">{vp.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{vp.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
