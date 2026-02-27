'use client'

import React from 'react'
import Image from 'next/image'
import type { DemoConfig } from '@/lib/demo-configs/types'
import { MapPin, Clock, Car, Sparkles, ChevronRight, Navigation } from 'lucide-react'

type Props = {
    config: DemoConfig
    onNext: () => void
}

export default function CarParkScreen({ config, onNext }: Props) {
    const { operator, location } = config
    const { colors } = operator
    const availableSpaces = Math.floor(location.totalSpaces * 0.81)

    return (
        <div className="min-h-screen flex flex-col" style={{ background: colors.background }}>
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <Image src={operator.logo} alt={operator.name} width={160} height={40}
                        className="h-9 w-auto object-contain" unoptimized
                        style={{ filter: 'brightness(0)' }}
                    />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <span>powered by</span>
                    <Image src="/logo.png" alt="ParkBunny" width={60} height={16} className="h-3.5 w-auto" />
                </div>
            </header>

            <div className="flex-1 px-6 py-6 space-y-6 max-w-lg mx-auto w-full">
                {/* Location card */}
                <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                    {/* Mini map strip */}
                    <div className="h-32 bg-gradient-to-br from-slate-800 to-slate-900 relative flex items-center justify-center">
                        <MapPin className="w-12 h-12" style={{ color: colors.primary }} />
                        <div className="absolute bottom-3 left-4">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                                style={{ background: colors.primary }}>
                                {location.city}
                            </span>
                        </div>
                    </div>

                    <div className="p-5 space-y-4 bg-white">
                        <div>
                            <h2 className="text-2xl font-bold">{location.name}</h2>
                            <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {location.address}, {location.postcode}
                            </p>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-xl bg-gray-50 p-3 text-center">
                                <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                                    £{location.hourlyRate.toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">per hour</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-3 text-center">
                                <p className="text-2xl font-bold text-emerald-600">{availableSpaces}</p>
                                <p className="text-xs text-gray-500 mt-0.5">available</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-3 text-center">
                                <p className="text-2xl font-bold text-gray-700">{location.totalSpaces}</p>
                                <p className="text-xs text-gray-500 mt-0.5">total</p>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                <Clock className="w-3 h-3" /> 24/7 Access
                            </span>
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                <Car className="w-3 h-3" /> ANPR Entry
                            </span>
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                <Navigation className="w-3 h-3" /> 2 min walk
                            </span>
                        </div>
                    </div>
                </div>

                {/* Rewards badge */}
                <div
                    className="rounded-2xl p-4 flex items-center gap-4 shadow-sm"
                    style={{
                        background: `linear-gradient(135deg, ${colors.primary}10, ${colors.primary}05)`,
                        border: `1px solid ${colors.primary}20`,
                    }}
                >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: `${colors.primary}20` }}>
                        <Sparkles className="w-6 h-6" style={{ color: colors.primary }} />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-sm">ECP ParkBuddy Rewards Available ✨</p>
                        <p className="text-xs text-gray-500">Unlock exclusive local deals when you park here</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>

                {/* CTA */}
                <button
                    onClick={onNext}
                    className="w-full py-4 rounded-2xl font-bold text-lg transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg"
                    style={{
                        background: colors.cta,
                        color: '#1a1a2e',
                    }}
                >
                    Start Parking
                </button>
            </div>
        </div>
    )
}
