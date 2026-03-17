"use client"

import { useState, useEffect } from 'react'

type PreviewEmail = {
    step: number
    subject: string
    body: string
}

type LeadPreview = {
    leadId: string
    email: string
    businessName: string
    firstName: string | null
    confidence: string
    emails: PreviewEmail[]
}

export default function OutreachEmailPreview({
    reportId,
    sector,
    discountLevel,
    onConfirm,
    onBack,
}: {
    reportId: string
    sector: string
    discountLevel: string
    onConfirm: () => void
    onBack: () => void
}) {
    const [previews, setPreviews] = useState<LeadPreview[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedLead, setSelectedLead] = useState(0)
    const [selectedEmail, setSelectedEmail] = useState(0)

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(
                    `/api/reports/${reportId}/outreach/preview?sector=${encodeURIComponent(sector)}&discountLevel=${encodeURIComponent(discountLevel)}`
                )
                if (!res.ok) throw new Error(await res.text())
                const data = await res.json()
                setPreviews(data.previews)
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'Failed to load previews')
            } finally {
                setLoading(false)
            }
        })()
    }, [reportId, sector, discountLevel])

    if (loading) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 text-center">
                    <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-3" />
                    <p className="text-sm text-gray-600">Loading email previews…</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                    <div className="text-sm text-red-600 mb-3 p-2 bg-red-50 rounded">{error}</div>
                    <button onClick={onBack} className="w-full py-2 rounded border text-sm hover:bg-gray-50">Back</button>
                </div>
            </div>
        )
    }

    const lead = previews[selectedLead]
    const email = lead?.emails[selectedEmail]

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={onBack}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">👁️ Email Preview</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {sector} — {previews.length} leads • Review each email before launching
                            </p>
                        </div>
                        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                    </div>
                </div>

                {/* Lead Selector */}
                <div className="px-4 pt-3 shrink-0">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Recipient</label>
                    <select
                        value={selectedLead}
                        onChange={e => { setSelectedLead(Number(e.target.value)); setSelectedEmail(0) }}
                        className="w-full text-sm border rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {previews.map((p, i) => (
                            <option key={p.leadId} value={i}>
                                {p.businessName} — {p.firstName ? `${p.firstName} (${p.email})` : p.email}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Email Step Tabs */}
                <div className="px-4 pt-3 shrink-0">
                    <div className="flex gap-1">
                        {['Email 1: Intro', 'Email 2: Follow-up', 'Email 3: Break-up'].map((label, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedEmail(i)}
                                className={`flex-1 py-1.5 text-xs rounded-t border border-b-0 transition-colors ${
                                    selectedEmail === i
                                        ? 'bg-white text-blue-700 font-medium border-gray-300'
                                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Email Content */}
                {email && (
                    <div className="flex-1 overflow-y-auto px-4 pb-4">
                        <div className="border border-t-0 rounded-b p-4 bg-gray-50">
                            {/* Subject */}
                            <div className="mb-3">
                                <span className="text-xs font-medium text-gray-500">Subject:</span>
                                <p className="text-sm font-medium text-gray-900 mt-0.5">{email.subject}</p>
                            </div>
                            <div className="border-t pt-3" />
                            {/* Body */}
                            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                                {email.body}
                            </pre>
                        </div>

                        {/* Lead meta */}
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                            <span className={`px-1.5 py-0.5 rounded ${
                                lead.confidence === 'high' ? 'bg-green-100 text-green-700' :
                                lead.confidence === 'medium' ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-100 text-gray-600'
                            }`}>
                                {lead.confidence} confidence
                            </span>
                            <span>•</span>
                            <span>{lead.email}</span>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="p-4 border-t shrink-0 space-y-2">
                    {/* Lead navigation */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <button
                            onClick={() => { setSelectedLead(prev => Math.max(0, prev - 1)); setSelectedEmail(0) }}
                            disabled={selectedLead === 0}
                            className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            ← Previous lead
                        </button>
                        <span>{selectedLead + 1} of {previews.length}</span>
                        <button
                            onClick={() => { setSelectedLead(prev => Math.min(previews.length - 1, prev + 1)); setSelectedEmail(0) }}
                            disabled={selectedLead === previews.length - 1}
                            className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Next lead →
                        </button>
                    </div>

                    {/* Confirm + Back */}
                    <div className="flex gap-2">
                        <button
                            onClick={onBack}
                            className="flex-1 py-2 rounded border text-sm text-gray-500 hover:bg-gray-50"
                        >
                            ← Back
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700 font-medium"
                        >
                            ✅ Approve & Proceed to Launch
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
