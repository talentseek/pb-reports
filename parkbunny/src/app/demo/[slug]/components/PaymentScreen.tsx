'use client'

import React, { useState, useCallback } from 'react'
import Image from 'next/image'
import type { DemoConfig } from '@/lib/demo-configs/types'
import { CreditCard, Smartphone, Clock, Minus, Plus, Loader2, Check, Shield } from 'lucide-react'

type Props = {
    config: DemoConfig
    onPaymentComplete: (regPlate: string, duration: number, total: number) => void
}

export default function PaymentScreen({ config, onPaymentComplete }: Props) {
    const { operator, location } = config
    const { colors } = operator
    const [regPlate, setRegPlate] = useState('')
    const [duration, setDuration] = useState(2)
    const [paymentMethod, setPaymentMethod] = useState<'apple' | 'google' | 'card'>('apple')
    const [processing, setProcessing] = useState(false)
    const [complete, setComplete] = useState(false)

    const total = duration * location.hourlyRate

    const handlePay = useCallback(() => {
        setProcessing(true)
        setTimeout(() => {
            setProcessing(false)
            setComplete(true)
            setTimeout(() => {
                onPaymentComplete(regPlate || 'AB12 CDE', duration, total)
            }, 800)
        }, 1800)
    }, [regPlate, duration, total, onPaymentComplete])

    // Processing overlay
    if (processing || complete) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: colors.background }}>
                <div className="text-center space-y-6">
                    {processing ? (
                        <>
                            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                                style={{ background: `${colors.primary}15` }}>
                                <Loader2 className="w-10 h-10 animate-spin" style={{ color: colors.primary }} />
                            </div>
                            <div>
                                <p className="text-lg font-semibold">Processing payment...</p>
                                <p className="text-sm text-gray-500 mt-1">Securely connecting to {operator.name}</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-emerald-100">
                                <Check className="w-10 h-10 text-emerald-600" strokeWidth={3} />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-emerald-700">Payment confirmed!</p>
                                <p className="text-sm text-gray-500 mt-1">£{total.toFixed(2)} — {duration}hr parking</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ background: colors.background }}>
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h1 className="text-lg font-bold">Payment</h1>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Shield className="w-3.5 h-3.5" />
                    Secure checkout
                </div>
            </header>

            <div className="flex-1 px-6 py-6 space-y-6 max-w-lg mx-auto w-full">
                {/* Location summary */}
                <div className="rounded-xl bg-white border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: `${colors.primary}15` }}>
                        <span className="text-2xl">🅿️</span>
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold">{location.name}</p>
                        <p className="text-xs text-gray-500">{location.address}, {location.postcode}</p>
                    </div>
                </div>

                {/* Vehicle registration */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Vehicle Registration</label>
                    <div className="flex items-center rounded-xl border-2 border-gray-200 focus-within:border-blue-400 overflow-hidden bg-white">
                        <div className="w-12 bg-blue-700 h-14 flex items-center justify-center">
                            <span className="text-white font-bold text-xs">GB</span>
                        </div>
                        <input
                            type="text"
                            value={regPlate}
                            onChange={e => setRegPlate(e.target.value.toUpperCase())}
                            placeholder="AB12 CDE"
                            className="flex-1 px-4 py-3.5 text-lg font-mono font-bold tracking-widest outline-none uppercase"
                            maxLength={8}
                        />
                    </div>
                </div>

                {/* Duration selector */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Parking Duration</label>
                    <div className="flex items-center justify-between rounded-xl bg-white border border-gray-200 p-3">
                        <button
                            onClick={() => setDuration(Math.max(1, duration - 1))}
                            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <div className="text-center">
                            <p className="text-3xl font-bold">{duration}</p>
                            <p className="text-xs text-gray-500">{duration === 1 ? 'hour' : 'hours'}</p>
                        </div>
                        <button
                            onClick={() => setDuration(Math.min(12, duration + 1))}
                            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 px-1">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> £{location.hourlyRate.toFixed(2)}/hr</span>
                        <span className="font-semibold text-gray-900 text-base">Total: £{total.toFixed(2)}</span>
                    </div>
                </div>

                {/* Payment method */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { key: 'apple' as const, label: 'Apple Pay', icon: <Smartphone className="w-5 h-5" /> },
                            { key: 'google' as const, label: 'Google Pay', icon: <Smartphone className="w-5 h-5" /> },
                            { key: 'card' as const, label: 'Card', icon: <CreditCard className="w-5 h-5" /> },
                        ].map(m => (
                            <button
                                key={m.key}
                                onClick={() => setPaymentMethod(m.key)}
                                className={`p-3 rounded-xl border-2 text-center transition-all ${paymentMethod === m.key
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex justify-center mb-1">{m.icon}</div>
                                <p className="text-xs font-medium">{m.label}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Pay button */}
                <button
                    onClick={handlePay}
                    className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg"
                    style={{
                        background: paymentMethod === 'apple'
                            ? 'linear-gradient(135deg, #1a1a2e, #16213e)'
                            : `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    }}
                >
                    {paymentMethod === 'apple' ? '' : ''} Pay £{total.toFixed(2)}
                </button>

                <p className="text-xs text-center text-gray-400">
                    Simulated demo — no real charges apply
                </p>
            </div>
        </div>
    )
}
