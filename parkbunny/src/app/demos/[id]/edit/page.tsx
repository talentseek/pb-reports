'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save, Palette, MapPin, Building2, Gift, BarChart3, Lock } from 'lucide-react'
import Link from 'next/link'

type DealForm = {
    id: string; brand: string; logo: string; offer: string; category: string
    savingsValue: string; expiryMinutes: number; placeQuery: string
    redeemInstructions: string; termsAndConditions: string; color: string
}

export default function EditDemoPage() {
    const router = useRouter()
    const params = useParams()
    const id = params?.id as string
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<'operator' | 'colours' | 'location' | 'deals' | 'partner'>('operator')

    const [slug, setSlug] = useState('')
    const [operatorName, setOperatorName] = useState('')
    const [operatorTagline, setOperatorTagline] = useState('')
    const [operatorLogo, setOperatorLogo] = useState('')
    const [operatorFont, setOperatorFont] = useState('Arial, sans-serif')
    const [password, setPassword] = useState('')
    const [hasBrandStrip, setHasBrandStrip] = useState(false)
    const [brandStripLogo, setBrandStripLogo] = useState('')
    const [brandStripAlt, setBrandStripAlt] = useState('')
    const [brandStripBg, setBrandStripBg] = useState('#003399')
    const [colorPrimary, setColorPrimary] = useState('#003399')
    const [colorSecondary, setColorSecondary] = useState('#001a4d')
    const [colorAccent, setColorAccent] = useState('#FFCC00')
    const [colorCta, setColorCta] = useState('#FFCC00')
    const [colorBackground, setColorBackground] = useState('#f0f4ff')
    const [colorText, setColorText] = useState('#0f172a')
    const [locationName, setLocationName] = useState('')
    const [locationAddress, setLocationAddress] = useState('')
    const [locationPostcode, setLocationPostcode] = useState('')
    const [locationCity, setLocationCity] = useState('')
    const [totalSpaces, setTotalSpaces] = useState(100)
    const [hourlyRate, setHourlyRate] = useState(2.5)
    const [lat, setLat] = useState<number | ''>('')
    const [lng, setLng] = useState<number | ''>('')
    const [deals, setDeals] = useState<DealForm[]>([])
    const [baselineRevenue, setBaselineRevenue] = useState(250000)
    const [projectedUplift, setProjectedUplift] = useState(30)
    const [avgDwellIncrease, setAvgDwellIncrease] = useState(40)
    const [partnerEngagement, setPartnerEngagement] = useState(65)
    const [driverRetention, setDriverRetention] = useState(75)
    const [dealsRedeemed, setDealsRedeemed] = useState(900)
    const [footfallConversion, setFootfallConversion] = useState(20)

    useEffect(() => {
        fetch(`/api/demos/${id}`)
            .then(r => r.json())
            .then(data => {
                setSlug(data.slug || '')
                setOperatorName(data.operatorName || '')
                setOperatorTagline(data.operatorTagline || '')
                setOperatorLogo(data.operatorLogo || '')
                setOperatorFont(data.operatorFont || 'Arial, sans-serif')
                setPassword(data.password || '')
                setHasBrandStrip(!!data.brandStripLogo)
                setBrandStripLogo(data.brandStripLogo || '')
                setBrandStripAlt(data.brandStripAlt || '')
                setBrandStripBg(data.brandStripBackground || '#003399')
                setColorPrimary(data.colorPrimary || '#003399')
                setColorSecondary(data.colorSecondary || '#001a4d')
                setColorAccent(data.colorAccent || '#FFCC00')
                setColorCta(data.colorCta || '#FFCC00')
                setColorBackground(data.colorBackground || '#f0f4ff')
                setColorText(data.colorText || '#0f172a')
                setLocationName(data.locationName || '')
                setLocationAddress(data.locationAddress || '')
                setLocationPostcode(data.locationPostcode || '')
                setLocationCity(data.locationCity || '')
                setTotalSpaces(data.totalSpaces || 100)
                setHourlyRate(data.hourlyRate || 2.5)
                setLat(data.lat || '')
                setLng(data.lng || '')
                setDeals(data.deals || [])
                const pv = data.partnerView || {}
                setBaselineRevenue(pv.baselineRevenue || 250000)
                setProjectedUplift(pv.projectedUplift || 30)
                setAvgDwellIncrease(pv.avgDwellIncrease || 40)
                setPartnerEngagement(pv.partnerEngagement || 65)
                setDriverRetention(pv.driverRetention || 75)
                setDealsRedeemed(pv.dealsRedeemed || 900)
                setFootfallConversion(pv.footfallConversion || 20)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [id])

    const addDeal = () => {
        setDeals([...deals, { id: `deal-${Date.now()}`, brand: '', logo: '', offer: '', category: 'food_and_drink', savingsValue: '', expiryMinutes: 120, placeQuery: '', redeemInstructions: '', termsAndConditions: '', color: '#003399' }])
    }
    const updateDeal = (index: number, field: keyof DealForm, value: string | number) => {
        const updated = [...deals]; (updated[index] as any)[field] = value; setDeals(updated)
    }
    const removeDeal = (index: number) => setDeals(deals.filter((_, i) => i !== index))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch(`/api/demos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug, operatorName, operatorTagline, operatorLogo, operatorFont,
                    password: password || null,
                    brandStripLogo: hasBrandStrip ? brandStripLogo : null,
                    brandStripAlt: hasBrandStrip ? brandStripAlt : null,
                    brandStripBackground: hasBrandStrip ? brandStripBg : null,
                    colorPrimary, colorSecondary, colorAccent, colorCta, colorBackground, colorText,
                    colorCardBg: 'rgba(255,255,255,0.92)',
                    locationName, locationAddress, locationPostcode, locationCity,
                    totalSpaces, hourlyRate, lat: lat || null, lng: lng || null,
                    deals: deals.map(d => ({ ...d, expiryMinutes: Number(d.expiryMinutes) })),
                    partnerView: { baselineRevenue, projectedUplift, avgDwellIncrease, partnerEngagement, driverRetention, dealsRedeemed, footfallConversion },
                }),
            })
            if (!res.ok) throw new Error('Failed')
            router.push('/demos')
        } catch { alert('Failed to save') } finally { setSaving(false) }
    }

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>

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
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/demos" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
                    <h1 className="text-2xl font-bold text-gray-900">Edit: {operatorName}</h1>
                </div>

                <div className="flex gap-1 mb-6 bg-white rounded-lg border p-1">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <tab.icon className="w-4 h-4" />{tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit}>
                    {activeTab === 'operator' && (
                        <div className="bg-white rounded-xl border p-6 space-y-4">
                            <h2 className="text-lg font-semibold">Operator Details</h2>
                            <Field label="Slug" value={slug} onChange={setSlug} placeholder="auto-generated" />
                            <Field label="Operator Name" value={operatorName} onChange={setOperatorName} />
                            <Field label="Tagline" value={operatorTagline} onChange={setOperatorTagline} />
                            <Field label="Logo URL" value={operatorLogo} onChange={setOperatorLogo} />
                            <Field label="Font" value={operatorFont} onChange={setOperatorFont} />
                            <Field label="Password" value={password} onChange={setPassword} icon={<Lock className="w-4 h-4" />} />
                            <div className="border-t pt-4 mt-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={hasBrandStrip} onChange={e => setHasBrandStrip(e.target.checked)} className="rounded" />
                                    <span className="text-sm font-medium">Show brand strip</span>
                                </label>
                                {hasBrandStrip && (
                                    <div className="mt-3 space-y-3 pl-6">
                                        <Field label="Strip Logo URL" value={brandStripLogo} onChange={setBrandStripLogo} />
                                        <Field label="Strip Alt Text" value={brandStripAlt} onChange={setBrandStripAlt} />
                                        <ColorField label="Strip Background" value={brandStripBg} onChange={setBrandStripBg} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'colours' && (
                        <div className="bg-white rounded-xl border p-6 space-y-4">
                            <h2 className="text-lg font-semibold">Brand Colours</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <ColorField label="Primary" value={colorPrimary} onChange={setColorPrimary} />
                                <ColorField label="Secondary" value={colorSecondary} onChange={setColorSecondary} />
                                <ColorField label="Accent" value={colorAccent} onChange={setColorAccent} />
                                <ColorField label="CTA" value={colorCta} onChange={setColorCta} />
                                <ColorField label="Background" value={colorBackground} onChange={setColorBackground} />
                                <ColorField label="Text" value={colorText} onChange={setColorText} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'location' && (
                        <div className="bg-white rounded-xl border p-6 space-y-4">
                            <h2 className="text-lg font-semibold">Location</h2>
                            <Field label="Name" value={locationName} onChange={setLocationName} />
                            <Field label="Address" value={locationAddress} onChange={setLocationAddress} />
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Postcode" value={locationPostcode} onChange={setLocationPostcode} />
                                <Field label="City" value={locationCity} onChange={setLocationCity} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <NumberField label="Total Spaces" value={totalSpaces} onChange={setTotalSpaces} />
                                <NumberField label="Hourly Rate (£)" value={hourlyRate} onChange={setHourlyRate} step={0.5} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <NumberField label="Latitude" value={lat} onChange={v => setLat(v || '')} step={0.001} />
                                <NumberField label="Longitude" value={lng} onChange={v => setLng(v || '')} step={0.001} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'deals' && (
                        <div className="bg-white rounded-xl border p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Deals ({deals.length})</h2>
                                <button type="button" onClick={addDeal} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg"><Plus className="w-4 h-4" /> Add</button>
                            </div>
                            {deals.map((deal, i) => (
                                <div key={deal.id || i} className="border rounded-lg p-4 space-y-3 relative">
                                    <button type="button" onClick={() => removeDeal(i)} className="absolute top-3 right-3 p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                    <p className="text-sm font-medium text-gray-500">Deal {i + 1}</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Brand" value={deal.brand} onChange={v => updateDeal(i, 'brand', v)} />
                                        <Field label="Logo URL" value={deal.logo} onChange={v => updateDeal(i, 'logo', v)} />
                                    </div>
                                    <Field label="Offer" value={deal.offer} onChange={v => updateDeal(i, 'offer', v)} />
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
                                        <Field label="Savings" value={deal.savingsValue} onChange={v => updateDeal(i, 'savingsValue', v)} />
                                        <ColorField label="Colour" value={deal.color} onChange={v => updateDeal(i, 'color', v)} />
                                    </div>
                                    <Field label="Place Query" value={deal.placeQuery} onChange={v => updateDeal(i, 'placeQuery', v)} />
                                    <Field label="Redeem Instructions" value={deal.redeemInstructions} onChange={v => updateDeal(i, 'redeemInstructions', v)} />
                                    <Field label="T&Cs" value={deal.termsAndConditions} onChange={v => updateDeal(i, 'termsAndConditions', v)} />
                                </div>
                            ))}
                        </div>
                    )}

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

                    <div className="mt-6 flex justify-end gap-3">
                        <Link href="/demos" className="px-4 py-2.5 text-sm border rounded-lg hover:bg-gray-50">Cancel</Link>
                        <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50">
                            <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function Field({ label, value, onChange, placeholder, icon }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; icon?: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs text-gray-600 mb-1">{label}</label>
            <div className="relative">
                {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
                <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${icon ? 'pl-9' : ''}`} />
            </div>
        </div>
    )
}

function NumberField({ label, value, onChange, step }: { label: string; value: number | ''; onChange: (v: number) => void; step?: number }) {
    return (
        <div>
            <label className="block text-xs text-gray-600 mb-1">{label}</label>
            <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} step={step} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
        </div>
    )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="block text-xs text-gray-600 mb-1">{label}</label>
            <div className="flex gap-2">
                <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                <input type="text" value={value} onChange={e => onChange(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
        </div>
    )
}
