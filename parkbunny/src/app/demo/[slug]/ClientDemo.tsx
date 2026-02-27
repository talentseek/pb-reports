'use client'

import React, { useState, useCallback } from 'react'
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

type Props = {
    config: DemoConfig
    enrichedDeals: EnrichedDeal[]
}

const STEP_COUNT = 7

export default function ClientDemo({ config, enrichedDeals }: Props) {
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
        <PhoneFrame config={config}>
            <div
                className="relative overflow-hidden"
                style={{
                    ...cssVars,
                    fontFamily: font,
                    minHeight: '100%',
                    backgroundColor: colors.background,
                    color: colors.text,
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

                {/* Main content with transition */}
                <div className="relative z-10">
                    <div
                        className="transition-all duration-500 ease-in-out"
                        key={currentStep}
                        style={{ animation: 'fadeSlideIn 0.4s ease-out' }}
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

                {/* Navigation */}
                <DemoNav
                    currentStep={currentStep}
                    highestStep={highestStep}
                    journeyComplete={journeyComplete}
                    onStepChange={goToStep}
                    onTogglePartner={() => setShowPartnerView(prev => !prev)}
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
