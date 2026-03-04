'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, ExternalLink, Pencil, Trash2, Lock, MapPin, Car } from 'lucide-react'

type DemoSummary = {
    id: string
    slug: string
    operatorName: string
    operatorLogo: string
    locationCity: string
    locationPostcode: string
    totalSpaces: number
    password: string | null
    createdAt: string
}

export default function DemosPage() {
    const [demos, setDemos] = useState<DemoSummary[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/demos')
            .then(r => r.json())
            .then(data => { setDemos(data); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
        await fetch(`/api/demos/${id}`, { method: 'DELETE' })
        setDemos(demos.filter(d => d.id !== id))
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading demos...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-5xl p-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">App Demos</h1>
                        <p className="text-gray-600 mt-1">Interactive ParkBuddy app demos for clients</p>
                    </div>
                    <Link
                        href="/demos/new"
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        Create New Demo
                    </Link>
                </div>

                {demos.length === 0 ? (
                    <div className="bg-white rounded-xl border p-12 text-center">
                        <p className="text-gray-500">No demos yet. Create your first one!</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {demos.map(demo => (
                            <div key={demo.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                <div className="p-5">
                                    {/* Header */}
                                    <div className="flex items-start gap-3 mb-3">
                                        {demo.operatorLogo ? (
                                            <Image
                                                src={demo.operatorLogo}
                                                alt={demo.operatorName}
                                                width={40}
                                                height={40}
                                                className="h-10 w-auto rounded object-contain"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
                                                {demo.operatorName.charAt(0)}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate">{demo.operatorName}</h3>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <MapPin className="w-3 h-3" />
                                                {demo.locationCity} · {demo.locationPostcode}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                        <div className="flex items-center gap-1">
                                            <Car className="w-3 h-3" />
                                            {demo.totalSpaces} spaces
                                        </div>
                                    </div>

                                    {/* Password */}
                                    {demo.password && (
                                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                            <div className="flex items-center gap-2">
                                                <Lock className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-xs text-gray-500">Access Code</span>
                                            </div>
                                            <code className="block mt-1 text-sm font-mono text-gray-800 select-all">
                                                {demo.password}
                                            </code>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/demo/${demo.slug}`}
                                            target="_blank"
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                                        >
                                            View Demo
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </Link>
                                        <Link
                                            href={`/demos/${demo.id}/edit`}
                                            className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(demo.id, demo.operatorName)}
                                            className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
