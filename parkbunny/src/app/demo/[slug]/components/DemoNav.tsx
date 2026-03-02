'use client'

import React from 'react'
import { MapPin, Car, CreditCard, Gift, Eye } from 'lucide-react'

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

const TABS = [
    { step: 1, icon: MapPin, label: 'Find' },
    { step: 2, icon: Car, label: 'Park' },
    { step: 3, icon: CreditCard, label: 'Pay' },
    { step: 5, icon: Gift, label: 'Deals' },
]

export default function DemoNav({
    currentStep,
    highestStep,
    onStepChange,
    onTogglePartner,
    showPartnerView,
    primaryColor,
    accentColor,
}: Props) {
    if (showPartnerView) return null

    // Map current step to closest tab for highlighting
    const activeTab = currentStep <= 3 ? currentStep : currentStep >= 5 ? 5 : 3

    return (
        <>
            {/* Always-visible bottom tab bar */}
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

            {/* Partner view floating button — above tab bar */}
            <button
                onClick={onTogglePartner}
                className="demo-partner-btn"
                style={{
                    background: `linear-gradient(135deg, ${primaryColor}, #003399)`,
                }}
                title="Toggle Partner View"
            >
                <Eye className="w-4 h-4 text-white" />
            </button>

            <style jsx>{`
                .demo-tab-bar {
                    position: sticky;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    z-index: 40;
                    background: rgba(255, 255, 255, 0.92);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-top: 1px solid rgba(0, 0, 0, 0.06);
                    padding: 6px 8px;
                    padding-bottom: max(6px, env(safe-area-inset-bottom, 6px));
                }
                .demo-partner-btn {
                    position: fixed;
                    bottom: 70px;
                    right: 12px;
                    z-index: 50;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    border: none;
                    cursor: pointer;
                }
                .demo-partner-btn:hover {
                    transform: scale(1.1);
                }
                .demo-partner-btn:active {
                    transform: scale(0.95);
                }
            `}</style>
        </>
    )
}
