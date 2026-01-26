'use client'

import React, { useState, useEffect } from 'react'
import type { LockerSite } from '@/lib/locker-logic'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Lock, MapPin, Navigation, Search } from 'lucide-react'

// Dynamically import map to avoid SSR issues with Leaflet
const LockerMap = dynamic(() => import('./LockerMap'), {
    loading: () => <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">Loading Map...</div>,
    ssr: false
})

export default function ClientProposal({ initialData }: { initialData: LockerSite[] }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [passwordInput, setPasswordInput] = useState('')
    const [error, setError] = useState('')
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    // Simple password check
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        if (passwordInput === 'nexuspb2026') {
            setIsAuthenticated(true)
            setError('')
        } else {
            setError('Incorrect password')
        }
    }

    const filteredData = initialData.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.postcode.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSiteClick = (id: string) => {
        setSelectedSiteId(id)
        // Scroll logic if needed or handled by visual highlight
    }

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[600px] md:h-[500px]">
                    {/* Image Side */}
                    <div className="w-full md:w-1/2 relative bg-slate-100">
                        <Image
                            src="/lockerphoto.webp"
                            alt="Nexus Lockers"
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8 text-white">
                            <h2 className="text-xl font-bold mb-1">Sustainable Logistics</h2>
                            <p className="text-sm opacity-90">Secure, solar-powered delivery hubs.</p>
                        </div>
                    </div>

                    {/* Form Side */}
                    <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                        <div className="text-center mb-8">
                            <div className="relative w-32 h-32 mx-auto mb-4">
                                <Image
                                    src="/logo.png"
                                    alt="ParkBunny"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-800">Group Nexus</h1>
                            <p className="text-slate-500 text-sm mt-2">Enter access code to view proposal.</p>
                        </div>
                        <form onSubmit={handleLogin} className="space-y-4 max-w-sm mx-auto w-full">
                            <div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <input
                                        type="password"
                                        value={passwordInput}
                                        onChange={(e) => setPasswordInput(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-mono"
                                        placeholder="Access Code"
                                    />
                                </div>
                                {error && <p className="text-red-500 text-sm mt-2 ml-1">{error}</p>}
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-violet-200"
                            >
                                View Proposal
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen text-slate-800 font-sans">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 relative">
                        <Image src="/logo.png" alt="ParkBunny" fill className="object-contain" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">Last Mile Logistics Lockers</h1>
                        <p className="text-xs text-slate-500 font-medium tracking-wide">ANNUAL REVENUE FORECAST</p>
                    </div>
                </div>
                <div className="flex gap-4 text-xs font-semibold text-slate-600 hidden md:flex">
                    <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 flex items-center gap-1">
                        <span>⚡ Solar Powered</span>
                    </div>
                    <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 flex items-center gap-1">
                        <span>🛡️ Zero Maintenance</span>
                    </div>
                    <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200 flex items-center gap-1">
                        <span>✅ Fully Insured</span>
                    </div>
                </div>
            </header>

            {/* Main Content: Split View */}
            <div className="flex-1 flex overflow-hidden">
                {/* List Panel */}
                <aside className="w-full md:w-[450px] bg-white border-r border-slate-200 flex flex-col z-10 shadow-xl">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search locations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-violet-400"
                            />
                        </div>
                        <div className="mt-3 flex justify-between text-xs text-slate-500 px-1">
                            <span>{filteredData.length} Locations</span>
                            <span>Pricing: £900 - £1600 /yr</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/50">
                        {filteredData.map(site => (
                            <div
                                key={site.id}
                                onClick={() => handleSiteClick(site.id)}
                                className={`
                                    p-4 rounded-xl border transition-all cursor-pointer group
                                    ${selectedSiteId === site.id
                                        ? 'bg-violet-600 border-violet-600 shadow-lg shadow-violet-200 transform scale-[1.02]'
                                        : 'bg-white border-slate-100 hover:border-violet-300 hover:shadow-md'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-bold text-sm leading-tight ${selectedSiteId === site.id ? 'text-white' : 'text-slate-800'}`}>
                                        {site.name}
                                    </h3>
                                    <span className={`
                                        text-xs font-mono font-bold px-2 py-1 rounded
                                        ${selectedSiteId === site.id ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}
                                    `}>
                                        £{site.price.toLocaleString()}
                                    </span>
                                </div>
                                <div className={`text-xs ${selectedSiteId === site.id ? 'text-violet-100' : 'text-slate-500'} mb-2`}>
                                    {site.address}, {site.city}
                                </div>

                                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-dashed border-slate-200/20">
                                    <div className={`flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold ${selectedSiteId === site.id ? 'text-violet-200' : 'text-slate-400'}`}>
                                        <Navigation className="h-3 w-3" />
                                        {site.distanceToCentre !== null ? `${site.distanceToCentre.toFixed(1)} miles to centre` : 'Dist N/A'}
                                    </div>
                                    <div className={`text-[10px] ml-auto opacity-70 ${selectedSiteId === site.id ? 'text-white' : 'text-slate-400'}`}>
                                        {site.spaces} Spaces
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Map Panel */}
                <main className="flex-1 relative bg-slate-100">
                    <LockerMap
                        data={filteredData}
                        selectedId={selectedSiteId}
                        onSelect={setSelectedSiteId}
                    />
                </main>
            </div>
        </div>
    )
}
