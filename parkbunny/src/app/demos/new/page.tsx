'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save, Palette, MapPin, Building2, Gift, BarChart3, Lock, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'

type DealForm = {
    id: string
    brand: string
    logo: string
    offer: string
    category: string
    savingsValue: string
    expiryMinutes: number
    placeQuery: string
    redeemInstructions: string
    termsAndConditions: string
    color: string
}

const EMPTY_DEAL: DealForm = {
    id: '', brand: '', logo: '', offer: '', category: 'food_and_drink',
    savingsValue: '', expiryMinutes: 120, placeQuery: '', redeemInstructions: '',
    termsAndConditions: '', color: '#003399',
}

export default function CreateDemoPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<'operator' | 'colours' | 'location' | 'deals' | 'partner'>('operator')

    // Operator
    const [operatorName, setOperatorName] = useState('')
    const [operatorTagline, setOperatorTagline] = useState('')
    const [operatorLogo, setOperatorLogo] = useState('')
    const [operatorFont, setOperatorFont] = useState('Arial, sans-serif')
    const [password, setPassword] = useState('')

    // Brand Strip
    const [hasBrandStrip, setHasBrandStrip] = useState(false)
    const [brandStripLogo, setBrandStripLogo] = useState('')
    const [brandStripAlt, setBrandStripAlt] = useState('')
    const [brandStripBg, setBrandStripBg] = useState('#003399')

    // Colours
    const [colorPrimary, setColorPrimary] = useState('#003399')
    const [colorSecondary, setColorSecondary] = useState('#001a4d')
    const [colorAccent, setColorAccent] = useState('#FFCC00')
    const [colorCta, setColorCta] = useState('#FFCC00')
    const [colorBackground, setColorBackground] = useState('#f0f4ff')
    const [colorText, setColorText] = useState('#0f172a')

    // Location
    const [locationName, setLocationName] = useState('')
    const [locationAddress, setLocationAddress] = useState('')
    const [locationPostcode, setLocationPostcode] = useState('')
    const [locationCity, setLocationCity] = useState('')
    const [totalSpaces, setTotalSpaces] = useState(100)
    const [hourlyRate, setHourlyRate] = useState(2.5)
    const [lat, setLat] = useState<number | ''>('')
    const [lng, setLng] = useState<number | ''>('')

    // Deals
    const [deals, setDeals] = useState<DealForm[]>([])

    // Partner View
    const [baselineRevenue, setBaselineRevenue] = useState(250000)
    const [projectedUplift, setProjectedUplift] = useState(30)
    const [avgDwellIncrease, setAvgDwellIncrease] = useState(40)
    const [partnerEngagement, setPartnerEngagement] = useState(65)
    const [driverRetention, setDriverRetention] = useState(75)
    const [dealsRedeemed, setDealsRedeemed] = useState(900)
    const [footfallConversion, setFootfallConversion] = useState(20)

    const addDeal = () => {
        const newId = `deal-${Date.now()}`
        setDeals([...deals, { ...EMPTY_DEAL, id: newId }])
    }

    const updateDeal = (index: number, field: keyof DealForm, value: string | number) => {
        const updated = [...deals]
            ; (updated[index] as any)[field] = value
        setDeals(updated)
    }

    const removeDeal = (index: number) => {
        setDeals(deals.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!operatorName.trim()) { alert('Operator name is required'); return }

        setSaving(true)
        try {
            const res = await fetch('/api/demos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operatorName, operatorTagline, operatorLogo, operatorFont,
                    password: password || null,
                    brandStripLogo: hasBrandStrip ? brandStripLogo : null,
                    brandStripAlt: hasBrandStrip ? brandStripAlt : null,
                    brandStripBackground: hasBrandStrip ? brandStripBg : null,
                    colorPrimary, colorSecondary, colorAccent, colorCta,
                    colorBackground, colorText,
                    colorCardBg: 'rgba(255,255,255,0.92)',
                    locationName, locationAddress, locationPostcode, locationCity,
                    totalSpaces, hourlyRate,
                    lat: lat || null, lng: lng || null,
                    deals: deals.map(d => ({ ...d, expiryMinutes: Number(d.expiryMinutes) })),
                    partnerView: {
                        baselineRevenue, projectedUplift, avgDwellIncrease,
                        partnerEngagement, driverRetention, dealsRedeemed, footfallConversion,
                    },
                }),
            })

            if (!res.ok) throw new Error('Failed to create demo')
            router.push('/demos')
        } catch (err) {
            alert('Failed to save demo')
        } finally {
            setSaving(false)
        }
    }

    const TABS = [
        { id: 'operator' as const, label: 'Operator', icon: Building2 },
        { id: 'colours' as const, label: 'Colours', icon: Palette },
        { id: 'location' as const, label: 'Location', icon: MapPin },
        { id: 'deals' as const, label: 'Deals', icon: Gift },
        { id: 'partner' as const, label: 'Partner Stats', icon: BarChart3 },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-3xl p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/demos" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
                    <h1 className="text-2xl font-bold text-gray-900">Create New Demo</h1>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-white rounded-lg border p-1">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit}>
                    {/* OPERATOR TAB */}
                    {activeTab === 'operator' && (
                        <div className="bg-white rounded-xl border p-6 space-y-4">
                            <h2 className="text-lg font-semibold">Operator Details</h2>
                            <Field label="Operator Name *" value={operatorName} onChange={setOperatorName} placeholder="e.g. Intelli-Park" />
                            <Field label="Tagline" value={operatorTagline} onChange={setOperatorTagline} placeholder="e.g. Your Partner In Parking Solutions" />
                            <Field label="Logo URL" value={operatorLogo} onChange={setOperatorLogo} placeholder="/demo/my-demo/logo.png" />
                            <Field label="Font" value={operatorFont} onChange={setOperatorFont} />
                            <Field label="Password (Access Code)" value={password} onChange={setPassword} placeholder="e.g. mydemo2026" icon={<Lock className="w-4 h-4" />} />

                            <div className="border-t pt-4 mt-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={hasBrandStrip} onChange={e => setHasBrandStrip(e.target.checked)} className="rounded" />
                                    <span className="text-sm font-medium">Show brand strip above navigation</span>
                                </label>
                                {hasBrandStrip && (
                                    <div className="mt-3 space-y-3 pl-6">
                                        <Field label="Strip Logo URL" value={brandStripLogo} onChange={setBrandStripLogo} placeholder="/ecp-logo.gif" />
                                        <Field label="Strip Logo Alt Text" value={brandStripAlt} onChange={setBrandStripAlt} placeholder="e.g. Euro Car Parks" />
                                        <ColorField label="Strip Background" value={brandStripBg} onChange={setBrandStripBg} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* COLOURS TAB */}
                    {activeTab === 'colours' && (
                        <div className="bg-white rounded-xl border p-6 space-y-4">
                            <h2 className="text-lg font-semibold">Brand Colours</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <ColorField label="Primary" value={colorPrimary} onChange={setColorPrimary} />
                                <ColorField label="Secondary" value={colorSecondary} onChange={setColorSecondary} />
                                <ColorField label="Accent" value={colorAccent} onChange={setColorAccent} />
                                <ColorField label="CTA Button" value={colorCta} onChange={setColorCta} />
                                <ColorField label="Background" value={colorBackground} onChange={setColorBackground} />
                                <ColorField label="Text" value={colorText} onChange={setColorText} />
                            </div>
                            {/* Preview */}
                            <div className="mt-4 rounded-lg p-4" style={{ background: colorBackground, color: colorText, border: `2px solid ${colorPrimary}` }}>
                                <p className="font-semibold" style={{ color: colorPrimary }}>Preview: {operatorName || 'Operator Name'}</p>
                                <p className="text-sm mt-1">{operatorTagline || 'Tagline goes here'}</p>
                                <button type="button" className="mt-2 px-4 py-1.5 rounded text-sm font-medium" style={{ background: colorCta, color: colorText }}>CTA Button</button>
                            </div>
                        </div>
                    )}

                    {/* LOCATION TAB */}
                    {activeTab === 'location' && (
                        <div className="bg-white rounded-xl border p-6 space-y-4">
                            <h2 className="text-lg font-semibold">Location</h2>
                            <Field label="Location Name" value={locationName} onChange={setLocationName} placeholder="e.g. SY1 1QH" />
                            <Field label="Address" value={locationAddress} onChange={setLocationAddress} placeholder="e.g. Barker Street, Shrewsbury" />
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Postcode" value={locationPostcode} onChange={setLocationPostcode} placeholder="SY1 1QH" />
                                <Field label="City" value={locationCity} onChange={setLocationCity} placeholder="Shrewsbury" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <NumberField label="Total Spaces" value={totalSpaces} onChange={setTotalSpaces} />
                                <NumberField label="Hourly Rate (£)" value={hourlyRate} onChange={setHourlyRate} step={0.5} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <NumberField label="Latitude" value={lat} onChange={(v) => setLat(v || '')} step={0.001} />
                                <NumberField label="Longitude" value={lng} onChange={(v) => setLng(v || '')} step={0.001} />
                            </div>
                        </div>
                    )}

                    {/* DEALS TAB */}
                    {activeTab === 'deals' && (
                        <div className="bg-white rounded-xl border p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Deals ({deals.length})</h2>
                                <button type="button" onClick={addDeal} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg">
                                    <Plus className="w-4 h-4" /> Add Deal
                                </button>
                            </div>
                            {deals.length === 0 && (
                                <p className="text-gray-500 text-sm text-center py-8">No deals yet. Click &quot;Add Deal&quot; to get started.</p>
                            )}
                            {deals.map((deal, i) => (
                                <div key={deal.id} className="border rounded-lg p-4 space-y-3 relative">
                                    <button type="button" onClick={() => removeDeal(i)} className="absolute top-3 right-3 p-1 text-red-500 hover:bg-red-50 rounded">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <p className="text-sm font-medium text-gray-500">Deal {i + 1}</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Brand" value={deal.brand} onChange={v => updateDeal(i, 'brand', v)} placeholder="Costa Coffee" />
                                        <Field label="Logo URL" value={deal.logo} onChange={v => updateDeal(i, 'logo', v)} placeholder="/demo/deals/costa.svg" />
                                    </div>
                                    <Field label="Offer" value={deal.offer} onChange={v => updateDeal(i, 'offer', v)} placeholder="Free hot drink with any £3+ food purchase" />
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Category</label>
                                            <select value={deal.category} onChange={e => updateDeal(i, 'category', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                                                <option value="food_and_drink">Food & Drink</option>
                                                <option value="entertainment">Entertainment</option>
                                                <option value="shopping">Shopping</option>
                                                <option value="services">Services</option>
                                            </select>
                                        </div>
                                        <Field label="Savings" value={deal.savingsValue} onChange={v => updateDeal(i, 'savingsValue', v)} placeholder="£3.50" />
                                        <ColorField label="Brand Colour" value={deal.color} onChange={v => updateDeal(i, 'color', v)} />
                                    </div>
                                    <Field label="Place Query (Google)" value={deal.placeQuery} onChange={v => updateDeal(i, 'placeQuery', v)} placeholder="Costa Coffee" />
                                    <Field label="Redeem Instructions" value={deal.redeemInstructions} onChange={v => updateDeal(i, 'redeemInstructions', v)} placeholder="Show QR code..." />
                                    <Field label="Terms & Conditions" value={deal.termsAndConditions} onChange={v => updateDeal(i, 'termsAndConditions', v)} placeholder="One per transaction..." />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* PARTNER STATS TAB */}
                    {activeTab === 'partner' && (
                        <div className="bg-white rounded-xl border p-6 space-y-4">
                            <h2 className="text-lg font-semibold">Partner View Stats</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <NumberField label="Baseline Revenue (£)" value={baselineRevenue} onChange={setBaselineRevenue} />
                                <NumberField label="Projected Uplift (%)" value={projectedUplift} onChange={setProjectedUplift} />
                                <NumberField label="Avg Dwell Increase (%)" value={avgDwellIncrease} onChange={setAvgDwellIncrease} />
                                <NumberField label="Partner Engagement (%)" value={partnerEngagement} onChange={setPartnerEngagement} />
                                <NumberField label="Driver Retention (%)" value={driverRetention} onChange={setDriverRetention} />
                                <NumberField label="Deals Redeemed" value={dealsRedeemed} onChange={setDealsRedeemed} />
                                <NumberField label="Footfall Conversion (%)" value={footfallConversion} onChange={setFootfallConversion} />
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <div className="mt-6 flex justify-end gap-3">
                        <Link href="/demos" className="px-4 py-2.5 text-sm border rounded-lg hover:bg-gray-50">Cancel</Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Create Demo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ---- Reusable Field Components ----
function Field({ label, value, onChange, placeholder, icon }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; icon?: React.ReactNode
}) {
    return (
        <div>
            <label className="block text-xs text-gray-600 mb-1">{label}</label>
            <div className="relative">
                {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${icon ? 'pl-9' : ''}`}
                />
            </div>
        </div>
    )
}

function NumberField({ label, value, onChange, step }: {
    label: string; value: number | ''; onChange: (v: number) => void; step?: number
}) {
    return (
        <div>
            <label className="block text-xs text-gray-600 mb-1">{label}</label>
            <input
                type="number"
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                step={step}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
        </div>
    )
}

function ColorField({ label, value, onChange }: {
    label: string; value: string; onChange: (v: string) => void
}) {
    return (
        <div>
            <label className="block text-xs text-gray-600 mb-1">{label}</label>
            <div className="flex gap-2">
                <input
                    type="color"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                />
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
            </div>
        </div>
    )
}
