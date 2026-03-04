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
            {/* Map background — fills entire screen */}
            <div className="absolute inset-0 z-0">
                {location.lat && location.lng && (
                    <DemoMap
                        lat={location.lat}
                        lng={location.lng}
                        markerColor={colors.primary}
                        locationName={location.name}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/30 to-slate-900/80 z-10" />
            </div>

            {/* TOP SECTION — logo, heading, tagline, co-branding */}
            <div className="relative z-20 flex flex-col items-center pt-12 px-4">
                {/* Header logo */}
                <Image
                    src={operator.logo}
                    alt={operator.name}
                    width={180}
                    height={45}
                    className="h-9 w-auto object-contain mb-6"
                    unoptimized
                    style={{ filter: 'brightness(0) invert(1)' }}
                />

                {/* Heading */}
                <h1 className="text-3xl font-bold text-white text-center mb-1 tracking-tight leading-tight">
                    Park. Pay.<br />
                    <span style={{ color: colors.accent }}>Get rewarded.</span>
                </h1>
                <p className="text-white/60 text-sm text-center max-w-xs mb-3">
                    {operator.tagline}
                </p>

                {/* Co-branding */}
                <div className="flex items-center gap-3">
                    <Image
                        src={operator.logo}
                        alt={operator.name}
                        width={100}
                        height={28}
                        className="h-5 w-auto object-contain"
                        unoptimized
                        style={{ filter: 'brightness(0) invert(1)', opacity: 0.85 }}
                    />
                    <span className="text-white/50 text-sm">×</span>
                    <Image
                        src="/logo.png"
                        alt="ParkBunny"
                        width={100}
                        height={28}
                        className="h-5 w-auto object-contain"
                        unoptimized
                        style={{ opacity: 1 }}
                    />
                </div>
            </div>

            {/* MIDDLE — empty space for map pin to be visible */}
            <div className="flex-1" />

            {/* BOTTOM SECTION — search bar, above ECP strip + nav */}
            <div className="relative z-20 px-4 pb-28">
                <div className="w-full max-w-xs mx-auto">
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
