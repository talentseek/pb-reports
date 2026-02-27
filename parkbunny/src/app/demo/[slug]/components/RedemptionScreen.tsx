'use client'

import React, { useState, useEffect, useCallback } from 'react'
import type { DemoConfig, EnrichedDeal } from '@/lib/demo-configs/types'
import { ArrowLeft, Clock, Wallet, Check, QrCode } from 'lucide-react'

type Props = {
    config: DemoConfig
    deal: EnrichedDeal
    onRedeem: (deal: EnrichedDeal) => void
    onBack: () => void
}

export default function RedemptionScreen({ config, deal, onRedeem, onBack }: Props) {
    const { colors } = config.operator
    const [redeemed, setRedeemed] = useState(false)
    const [timeLeft, setTimeLeft] = useState(deal.expiryMinutes * 60) // seconds

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1))
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60)
        const sec = s % 60
        return `${m}:${sec.toString().padStart(2, '0')}`
    }

    const handleRedeem = useCallback(() => {
        setRedeemed(true)
        onRedeem(deal)
    }, [deal, onRedeem])

    // Generate a simple QR-like grid
    const QRGrid = () => (
        <div className="w-48 h-48 mx-auto bg-white rounded-2xl p-3 shadow-inner border border-gray-100">
            <div className="w-full h-full grid grid-cols-9 grid-rows-9 gap-0.5">
                {Array.from({ length: 81 }).map((_, i) => {
                    const isCorner = (i < 18 && i % 9 < 3) || (i < 18 && i % 9 > 5) ||
                        (i > 62 && i % 9 < 3)
                    const isFilled = isCorner || Math.random() > 0.5
                    return (
                        <div
                            key={i}
                            className="rounded-[1px]"
                            style={{ background: isFilled ? '#1a1a2e' : 'transparent' }}
                        />
                    )
                })}
            </div>
        </div>
    )

    return (
        <div className="min-h-screen flex flex-col" style={{ background: colors.background }}>
            {/* Header */}
            <header className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <button onClick={onBack} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-bold">Redeem Deal</h1>
            </header>

            <div className="flex-1 px-6 py-6 space-y-6 max-w-lg mx-auto w-full">
                {/* Brand card */}
                <div className="rounded-2xl overflow-hidden shadow-lg">
                    <div className="p-5 text-white" style={{ background: deal.color }}>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold">
                                {deal.brand.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-lg">{deal.brand}</p>
                                <p className="text-white/80 text-sm">{deal.nearestAddress.split(',')[0]}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-5">
                        <p className="text-lg font-semibold mb-1">{deal.offer}</p>
                        <p className="text-sm text-gray-500">{deal.redeemInstructions}</p>
                    </div>
                </div>

                {/* QR Code */}
                <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <QrCode className="w-4 h-4" />
                        <span>Show this code to redeem</span>
                    </div>
                    <QRGrid />
                    <div className="flex items-center justify-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className={`font-mono font-semibold ${timeLeft < 300 ? 'text-red-500' : 'text-gray-700'}`}>
                            Expires in {formatTime(timeLeft)}
                        </span>
                    </div>
                </div>

                {/* Action buttons */}
                {!redeemed ? (
                    <button
                        onClick={handleRedeem}
                        className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg flex items-center justify-center gap-2"
                        style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
                    >
                        <Wallet className="w-5 h-5" />
                        Save to Wallet
                    </button>
                ) : (
                    <div className="w-full py-4 rounded-2xl font-bold text-lg text-emerald-700 bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center gap-2">
                        <Check className="w-5 h-5" />
                        Saved to Wallet!
                    </div>
                )}

                {/* Terms */}
                <p className="text-xs text-gray-400 text-center">
                    {deal.termsAndConditions}
                </p>
            </div>
        </div>
    )
}
