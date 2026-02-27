'use client'

import React, { useEffect, useState } from 'react'
import type { DemoConfig } from '@/lib/demo-configs/types'
import { Check, Gift, MapPin, Clock, Car } from 'lucide-react'

type Props = {
    config: DemoConfig
    paymentData: { regPlate: string; duration: number; totalPaid: number }
    onNext: () => void
}

export default function SuccessScreen({ config, paymentData, onNext }: Props) {
    const { operator, location } = config
    const { colors } = operator
    const [showDeals, setShowDeals] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setShowDeals(true), 1200)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6"
            style={{ background: `linear-gradient(180deg, ${colors.background}, white)` }}>

            {/* Success indicator */}
            <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6"
                style={{ animation: 'pulse-soft 2s ease-in-out infinite' }}>
                <Check className="w-12 h-12 text-emerald-600" strokeWidth={3} />
            </div>

            <h1 className="text-3xl font-bold mb-2">You&apos;re parked ✔</h1>
            <p className="text-gray-500 text-center mb-8">Your session is active</p>

            {/* Parking summary */}
            <div className="w-full max-w-sm rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-3 mb-8">
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" /> Location
                    </span>
                    <span className="text-sm font-semibold">{location.name}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" /> Duration
                    </span>
                    <span className="text-sm font-semibold">{paymentData.duration} {paymentData.duration === 1 ? 'hour' : 'hours'}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-gray-500">
                        <Car className="w-4 h-4" /> Vehicle
                    </span>
                    <span className="text-sm font-mono font-semibold">{paymentData.regPlate}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Amount paid</span>
                    <span className="text-lg font-bold" style={{ color: colors.primary }}>
                        £{paymentData.totalPaid.toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Deals unlock transition */}
            <div className={`transition-all duration-700 ${showDeals ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3"
                        style={{ background: `${colors.primary}15`, color: colors.primary }}>
                        <Gift className="w-5 h-5" />
                        <span className="font-semibold text-sm">Rewards Unlocked!</span>
                    </div>
                    <p className="text-gray-600">You&apos;ve unlocked exclusive local deals 🎉</p>
                </div>

                <button
                    onClick={onNext}
                    className="w-full max-w-sm py-4 rounded-2xl font-bold text-lg text-white transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg"
                    style={{
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                        animation: 'pulse-soft 2s ease-in-out infinite',
                    }}
                >
                    <span className="flex items-center justify-center gap-2">
                        <Gift className="w-5 h-5" /> View Rewards
                    </span>
                </button>
            </div>
        </div>
    )
}
