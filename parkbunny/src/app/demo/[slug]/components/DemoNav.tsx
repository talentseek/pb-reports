'use client'

import React from 'react'
import { MapPin, Car, CreditCard, Check, Gift, QrCode, BarChart3, Eye } from 'lucide-react'

type Props = {
    currentStep: number
    highestStep: number
    journeyComplete: boolean
    onStepChange: (step: number) => void
    onTogglePartner: () => void
    showPartnerView: boolean
    primaryColor: string
    accentColor: string
}

const STEPS = [
    { step: 1, icon: MapPin, label: 'Find' },
    { step: 2, icon: Car, label: 'Park' },
    { step: 3, icon: CreditCard, label: 'Pay' },
    { step: 4, icon: Check, label: 'Done' },
    { step: 5, icon: Gift, label: 'Deals' },
    { step: 6, icon: QrCode, label: 'Redeem' },
    { step: 7, icon: BarChart3, label: 'Insights' },
]

export default function DemoNav({
    currentStep,
    highestStep,
    journeyComplete,
    onStepChange,
    onTogglePartner,
    showPartnerView,
    primaryColor,
    accentColor,
}: Props) {
    if (showPartnerView) return null

    return (
        <>
            {/* Step indicator (linear mode) */}
            {!journeyComplete && (
                <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
                    <div className="h-1 bg-gray-200/50">
                        <div
                            className="h-full transition-all duration-500 ease-out"
                            style={{
                                width: `${(currentStep / 7) * 100}%`,
                                background: accentColor,
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Bottom tab bar (free mode) */}
            {journeyComplete && (
                <div className="fixed bottom-0 left-0 right-0 z-40 glass-dark safe-area-bottom">
                    <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
                        {STEPS.filter(s => [1, 2, 5, 7].includes(s.step)).map(s => {
                            const isActive = currentStep === s.step
                            return (
                                <button
                                    key={s.step}
                                    onClick={() => onStepChange(s.step)}
                                    className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive ? 'scale-105' : 'opacity-60 hover:opacity-80'
                                        }`}
                                >
                                    <s.icon className="w-5 h-5" style={{ color: isActive ? primaryColor : '#94a3b8' }} />
                                    <span className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                        {s.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Partner view floating button */}
            <button
                onClick={onTogglePartner}
                className="fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{
                    background: `linear-gradient(135deg, ${primaryColor}, #003399)`,
                }}
                title="Toggle Partner View"
            >
                <Eye className="w-5 h-5 text-white" />
            </button>

            <style jsx>{`
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 8px);
        }
      `}</style>
        </>
    )
}
