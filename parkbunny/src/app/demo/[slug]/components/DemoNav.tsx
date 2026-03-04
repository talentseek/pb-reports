'use client'

import React from 'react'
import Image from 'next/image'
import { MapPin, Car, CreditCard, Gift } from 'lucide-react'

type Props = {
    currentStep: number
    highestStep: number
    journeyComplete: boolean
    onStepChange: (step: number) => void
    showPartnerView: boolean
    primaryColor: string
    accentColor: string
}

const TABS = [
    { step: 1, icon: MapPin, label: 'Find' },
    { step: 2, icon: Car, label: 'Park' },
    { step: 3, icon: CreditCard, label: 'Pay' },
    { step: 5, icon: Gift, label: 'Deals' },
]

export default function DemoNav({
    currentStep,
    highestStep,
    showPartnerView,
    onStepChange,
    primaryColor,
    accentColor,
}: Props) {
    if (showPartnerView) return null

    // Map current step to closest tab for highlighting
    const activeTab = currentStep <= 3 ? currentStep : currentStep >= 5 ? 5 : 3

    return (
        <>
            {/* Euro Car Parks branding strip */}
            <div className="demo-brand-strip">
                <Image
                    src="/ecp-logo.gif"
                    alt="Euro Car Parks"
                    width={120}
                    height={30}
                    className="demo-brand-logo"
                    unoptimized
                />
            </div>

            {/* Bottom tab bar */}
            <div className="demo-tab-bar">
                <div className="flex items-center justify-around w-full max-w-xs mx-auto">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.step
                        const isReachable = tab.step <= highestStep || (tab.step === 5 && highestStep >= 4)
                        const isLocked = !isReachable

                        return (
                            <button
                                key={tab.step}
                                onClick={() => {
                                    if (!isLocked) onStepChange(tab.step)
                                }}
                                className="flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg transition-all"
                                style={{
                                    opacity: isLocked ? 0.3 : isActive ? 1 : 0.6,
                                    cursor: isLocked ? 'default' : 'pointer',
                                }}
                                disabled={isLocked}
                            >
                                <div className="relative">
                                    <tab.icon
                                        className="w-5 h-5"
                                        style={{ color: isActive ? accentColor : '#94a3b8' }}
                                    />
                                    {isActive && (
                                        <div
                                            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                                            style={{ background: accentColor }}
                                        />
                                    )}
                                </div>
                                <span
                                    className="text-[10px] font-medium"
                                    style={{ color: isActive ? accentColor : '#94a3b8' }}
                                >
                                    {tab.label}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            <style jsx>{`
                .demo-brand-strip {
                    position: absolute;
                    bottom: 52px;
                    left: 0;
                    right: 0;
                    z-index: 39;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 6px 0;
                    background: rgba(0, 51, 153, 0.9);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                }
                .demo-brand-logo {
                    height: 20px;
                    width: auto;
                    object-fit: contain;
                }
                .demo-tab-bar {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    z-index: 40;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-top: 1px solid rgba(0, 0, 0, 0.06);
                    padding: 6px 8px 10px;
                }
            `}</style>
        </>
    )
}
