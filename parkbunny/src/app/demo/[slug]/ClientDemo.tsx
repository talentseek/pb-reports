'use client'

import React, { useState, useCallback } from 'react'
import Image from 'next/image'
import { Lock } from 'lucide-react'
import type { DemoConfig, EnrichedDeal } from '@/lib/demo-configs/types'
import LandingScreen from './components/LandingScreen'
import CarParkScreen from './components/CarParkScreen'
import PaymentScreen from './components/PaymentScreen'
import SuccessScreen from './components/SuccessScreen'
import DealsScreen from './components/DealsScreen'
import RedemptionScreen from './components/RedemptionScreen'
import PartnerScreen from './components/PartnerScreen'
import DemoNav from './components/DemoNav'
import PhoneFrame from './components/PhoneFrame'

const PASSWORD = 'ecpparkbuddy2026'

type Props = {
    config: DemoConfig
    enrichedDeals: EnrichedDeal[]
}

const STEP_COUNT = 7

export default function ClientDemo({ config, enrichedDeals }: Props) {
    const [authed, setAuthed] = useState(false)
    const [password, setPassword] = useState('')
    const [loginError, setLoginError] = useState('')
    const [currentStep, setCurrentStep] = useState(1)
    const [highestStep, setHighestStep] = useState(1)
    const [journeyComplete, setJourneyComplete] = useState(false)
    const [selectedDeal, setSelectedDeal] = useState<EnrichedDeal | null>(null)
    const [savedAmount, setSavedAmount] = useState(0)
    const [paymentData, setPaymentData] = useState({
        regPlate: '',
        duration: 2,
        totalPaid: 0,
    })
    const [showPartnerView, setShowPartnerView] = useState(false)

    const goToStep = useCallback((step: number) => {
        if (step < 1 || step > STEP_COUNT) return
        if (!journeyComplete && step > highestStep + 1) return

        setCurrentStep(step)
        if (step > highestStep) {
            setHighestStep(step)
            if (step === STEP_COUNT) setJourneyComplete(true)
        }
    }, [journeyComplete, highestStep])

    const nextStep = useCallback(() => goToStep(currentStep + 1), [currentStep, goToStep])

    const handlePaymentComplete = useCallback((regPlate: string, duration: number, total: number) => {
        setPaymentData({ regPlate, duration, totalPaid: total })
        nextStep()
    }, [nextStep])

    const handleDealSelect = useCallback((deal: EnrichedDeal) => {
        setSelectedDeal(deal)
        goToStep(6)
    }, [goToStep])

    const handleDealRedeem = useCallback((deal: EnrichedDeal) => {
        const value = parseFloat(deal.savingsValue.replace(/[£~]/g, '')) || 0
        setSavedAmount(prev => prev + value)
    }, [])

    const { colors, font } = config.operator

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        if (password === PASSWORD) {
            setAuthed(true)
            setLoginError('')
        } else {
            setLoginError('Incorrect access code')
        }
    }

    if (!authed) {
        return (
            <LoginScreen
                config={config}
                password={password}
                setPassword={setPassword}
                error={loginError}
                onSubmit={handleLogin}
            />
        )
    }

    const cssVars = {
        '--demo-primary': colors.primary,
        '--demo-secondary': colors.secondary,
        '--demo-accent': colors.accent,
        '--demo-bg': colors.background,
        '--demo-text': colors.text,
        '--demo-card': colors.cardBg,
        '--demo-font': font,
    } as React.CSSProperties

    return (
        <PhoneFrame config={config} onTogglePartner={() => setShowPartnerView(prev => !prev)}>
            <div
                className="relative overflow-hidden"
                style={{
                    ...cssVars,
                    fontFamily: font,
                    height: '100%',
                    backgroundColor: colors.background,
                    color: colors.text,
                    position: 'relative',
                }}
            >
                {/* Partner view overlay */}
                {showPartnerView && (
                    <div className="fixed inset-0 z-50">
                        <PartnerScreen
                            config={config}
                            onClose={() => setShowPartnerView(false)}
                        />
                    </div>
                )}

                {/* Main content — fills phone screen, scrollable */}
                <div className="relative z-10" style={{ height: '100%', overflow: 'auto' }}>
                    <div
                        className="transition-all duration-500 ease-in-out"
                        key={currentStep}
                        style={{ animation: 'fadeSlideIn 0.4s ease-out', height: '100%' }}
                    >
                        {currentStep === 1 && (
                            <LandingScreen config={config} onNext={nextStep} />
                        )}
                        {currentStep === 2 && (
                            <CarParkScreen config={config} onNext={nextStep} />
                        )}
                        {currentStep === 3 && (
                            <PaymentScreen config={config} onPaymentComplete={handlePaymentComplete} />
                        )}
                        {currentStep === 4 && (
                            <SuccessScreen
                                config={config}
                                paymentData={paymentData}
                                onNext={nextStep}
                            />
                        )}
                        {currentStep === 5 && (
                            <DealsScreen
                                config={config}
                                deals={enrichedDeals}
                                savedAmount={savedAmount}
                                onSelectDeal={handleDealSelect}
                            />
                        )}
                        {currentStep === 6 && selectedDeal && (
                            <RedemptionScreen
                                config={config}
                                deal={selectedDeal}
                                onRedeem={handleDealRedeem}
                                onBack={() => goToStep(5)}
                            />
                        )}
                        {currentStep === 7 && (
                            <PartnerScreen
                                config={config}
                                onClose={() => journeyComplete ? goToStep(5) : undefined}
                            />
                        )}
                    </div>
                </div>

                {/* Navigation — absolutely positioned at bottom of phone screen */}
                <DemoNav
                    currentStep={currentStep}
                    highestStep={highestStep}
                    journeyComplete={journeyComplete}
                    onStepChange={goToStep}
                    showPartnerView={showPartnerView}
                    primaryColor={colors.primary}
                    accentColor={colors.accent}
                />

                <style jsx global>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-soft {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .glass {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .glass-dark {
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
            </div>
        </PhoneFrame>
    )
}

// ============ LOGIN SCREEN ============
function LoginScreen({ config, password, setPassword, error, onSubmit }: {
    config: DemoConfig
    password: string
    setPassword: (v: string) => void
    error: string
    onSubmit: (e: React.FormEvent) => void
}) {
    const { colors, name, logo } = config.operator

    return (
        <div className="min-h-screen flex items-center justify-center p-4"
            style={{ background: `linear-gradient(145deg, ${colors.secondary || '#003399'}, #000d1f)` }}
        >
            <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-8 flex flex-col items-center">
                    {/* Co-branding */}
                    <div className="flex items-center gap-4 mb-6">
                        <Image
                            src={logo}
                            alt={name}
                            width={120}
                            height={40}
                            className="h-10 w-auto"
                            unoptimized
                            style={{ filter: 'brightness(0)' }}
                        />
                        <span className="text-gray-300 text-lg">×</span>
                        <Image
                            src="/logo.png"
                            alt="ParkBunny"
                            width={120}
                            height={40}
                            className="h-10 w-auto"
                        />
                    </div>

                    <h3 className="text-xl font-semibold text-center mb-1">Interactive Demo</h3>
                    <p className="text-gray-600 text-center text-sm mb-6">
                        Enter access code to view the demo.
                    </p>

                    <form onSubmit={onSubmit} className="w-full space-y-4">
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                placeholder="Access Code"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 outline-none"
                                style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                            />
                        </div>
                        {error && <p className="text-red-600 text-sm">{error}</p>}
                        <button
                            type="submit"
                            className="w-full py-3 text-white font-medium rounded-lg transition-all hover:opacity-90"
                            style={{ background: colors.primary }}
                        >
                            View Demo
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
