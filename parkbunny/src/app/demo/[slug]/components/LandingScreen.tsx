'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import type { DemoConfig } from '@/lib/demo-configs/types'
import { MapPin, Search, ChevronRight, Sparkles } from 'lucide-react'

const DemoMap = dynamic(() => import('./DemoMap'), { ssr: false })

type Props = {
    config: DemoConfig
    onNext: () => void
}

export default function LandingScreen({ config, onNext }: Props) {
    const { operator, location } = config
    const { colors } = operator

    return (
        <div className="relative min-h-screen flex flex-col">
            {/* Header */}
            <header className="relative z-20 flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                    <Image
                        src={operator.logo}
                        alt={operator.name}
                        width={200}
                        height={50}
                        className="h-10 w-auto object-contain"
                        unoptimized
                        style={{ filter: 'brightness(0) invert(1)' }}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-white/50">powered by</span>
                    <Image
                        src="/logo.png"
                        alt="ParkBunny"
                        width={80}
                        height={20}
                        className="h-4 w-auto object-contain brightness-0 invert opacity-60"
                    />
                </div>
            </header>

            {/* Map background */}
            <div className="absolute inset-0 z-0">
                {location.lat && location.lng && (
                    <DemoMap
                        lat={location.lat}
                        lng={location.lng}
                        markerColor={colors.primary}
                        locationName={location.name}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-900/90 z-10" />
            </div>

            {/* Content */}
            <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 pb-32">
                {/* Hero badge */}
                <div
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
                    style={{
                        background: `${colors.accent}25`,
                        color: colors.accent,
                        border: `1px solid ${colors.accent}50`,
                    }}
                >
                    <Sparkles className="w-4 h-4" />
                    ECP ParkBuddy Rewards
                </div>

                {/* Main heading */}
                <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-3 tracking-tight">
                    Park. Pay.<br />
                    <span style={{ color: colors.accent }}>Get rewarded.</span>
                </h1>
                <p className="text-white/70 text-lg md:text-xl text-center max-w-md mb-10">
                    {operator.tagline}
                </p>

                {/* Search bar */}
                <div className="w-full max-w-lg">
                    <div className="glass rounded-2xl p-2 flex items-center gap-2 shadow-2xl">
                        <div className="flex items-center gap-2 flex-1 px-4 py-3">
                            <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                            <span className="text-gray-500 text-base">
                                {location.name}, {location.city} — {location.postcode}
                            </span>
                        </div>
                        <button
                            onClick={onNext}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                            style={{ background: colors.cta, color: '#1a1a2e' }}
                        >
                            <Search className="w-4 h-4" />
                            Find Parking
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="relative z-20 pb-8 flex justify-center">
                <button
                    onClick={onNext}
                    className="group flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
                >
                    Explore this location
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    )
}
