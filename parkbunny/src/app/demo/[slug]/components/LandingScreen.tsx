'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import type { DemoConfig } from '@/lib/demo-configs/types'
import { MapPin, Search } from 'lucide-react'

const DemoMap = dynamic(() => import('./DemoMap'), { ssr: false })

type Props = {
    config: DemoConfig
    onNext: () => void
}

export default function LandingScreen({ config, onNext }: Props) {
    const { operator, location } = config
    const { colors } = operator

    return (
        <div className="relative flex flex-col" style={{ height: '100%' }}>
            {/* Header — just ECP logo, centred */}
            <header className="relative z-20 flex items-center justify-center px-4 pt-12 pb-2">
                <Image
                    src={operator.logo}
                    alt={operator.name}
                    width={180}
                    height={45}
                    className="h-9 w-auto object-contain"
                    unoptimized
                    style={{ filter: 'brightness(0) invert(1)' }}
                />
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

            {/* Content — heading at top, search bar at bottom */}
            <div className="relative z-20 flex-1 flex flex-col items-center justify-between pt-4 px-4 pb-24">
                {/* Main heading */}
                <h1 className="text-3xl font-bold text-white text-center mb-2 tracking-tight leading-tight">
                    Park. Pay.<br />
                    <span style={{ color: colors.accent }}>Get rewarded.</span>
                </h1>
                <p className="text-white/60 text-sm text-center max-w-xs mb-6">
                    {operator.tagline}
                </p>

                {/* Co-branding */}
                <div className="flex items-center gap-2 mb-4">
                    <Image
                        src={operator.logo}
                        alt={operator.name}
                        width={80}
                        height={20}
                        className="h-4 w-auto object-contain"
                        unoptimized
                        style={{ filter: 'brightness(0) invert(1)', opacity: 0.85 }}
                    />
                    <span className="text-white/50 text-xs">×</span>
                    <Image
                        src="/logo.png"
                        alt="ParkBunny"
                        width={80}
                        height={20}
                        className="h-4 w-auto object-contain"
                        style={{ filter: 'brightness(0) invert(1)', opacity: 0.85 }}
                    />
                </div>

                {/* Search bar — stacked layout */}
                <div className="w-full max-w-xs">
                    <div className="glass rounded-2xl p-3 shadow-2xl">
                        <div className="flex items-center gap-2 px-2 py-2 mb-2">
                            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-600 text-sm font-medium">
                                {location.name} · {location.postcode}
                            </span>
                        </div>
                        <button
                            onClick={onNext}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
                            style={{ background: colors.cta, color: '#1a1a2e' }}
                        >
                            <Search className="w-4 h-4" />
                            Find Parking
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
