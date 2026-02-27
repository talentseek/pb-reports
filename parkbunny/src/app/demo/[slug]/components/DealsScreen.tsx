'use client'

import React, { useState } from 'react'
import type { DemoConfig, EnrichedDeal } from '@/lib/demo-configs/types'
import { MapPin, Clock, Tag, Sparkles, Gift } from 'lucide-react'

type Props = {
    config: DemoConfig
    deals: EnrichedDeal[]
    savedAmount: number
    onSelectDeal: (deal: EnrichedDeal) => void
}

const CATEGORIES = [
    { key: 'all', label: 'All Deals' },
    { key: 'food_and_drink', label: 'Food & Drink' },
    { key: 'entertainment', label: 'Entertainment' },
    { key: 'shopping', label: 'Shopping' },
]

export default function DealsScreen({ config, deals, savedAmount, onSelectDeal }: Props) {
    const { operator } = config
    const { colors } = operator
    const [activeCategory, setActiveCategory] = useState('all')

    const filtered = activeCategory === 'all'
        ? deals
        : deals.filter(d => d.category === activeCategory)

    return (
        <div className="min-h-screen flex flex-col" style={{ background: colors.background }}>
            {/* Header */}
            <header className="px-6 pt-5 pb-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Your Rewards</h1>
                        <p className="text-sm text-gray-500">Exclusive deals near your car park</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
                        style={{ background: `${colors.primary}15`, color: colors.primary }}>
                        <Gift className="w-4 h-4" />
                        £{savedAmount.toFixed(2)} saved
                    </div>
                </div>

                {/* Category filters */}
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.key}
                            onClick={() => setActiveCategory(cat.key)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat.key
                                    ? 'text-white shadow-md'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                                }`}
                            style={activeCategory === cat.key ? { background: colors.primary } : undefined}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* Deals grid */}
            <div className="flex-1 px-6 pb-28 space-y-3">
                {filtered.map((deal, i) => (
                    <button
                        key={deal.id}
                        onClick={() => onSelectDeal(deal)}
                        className="w-full text-left rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.005] active:scale-[0.995] overflow-hidden"
                        style={{ animationDelay: `${i * 0.08}s`, animation: 'fadeSlideIn 0.4s ease-out backwards' }}
                    >
                        <div className="flex items-stretch">
                            {/* Brand colour strip */}
                            <div className="w-2 shrink-0" style={{ background: deal.color }} />

                            <div className="flex-1 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                                style={{ background: deal.color }}>
                                                {deal.brand.charAt(0)}
                                            </span>
                                            <div>
                                                <p className="font-bold text-sm">{deal.brand}</p>
                                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {deal.distance} · {deal.nearestAddress.split(',')[0]}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 mt-2">{deal.offer}</p>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-bold">
                                            <Tag className="w-3.5 h-3.5" />
                                            {deal.savingsValue}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1.5 flex items-center justify-end gap-1">
                                            <Clock className="w-3 h-3" /> {deal.expiryMinutes}min
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </button>
                ))}

                {filtered.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <Sparkles className="w-8 h-8 mx-auto mb-3" />
                        <p>No deals in this category yet</p>
                    </div>
                )}
            </div>
        </div>
    )
}
