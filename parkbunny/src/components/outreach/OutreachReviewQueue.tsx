"use client"

import { useState, useEffect } from 'react'

type ReviewLead = {
    id: string
    email: string
    firstName: string | null
    businessName: string
    confidence: string
    reviewStatus: string
    enrichment: {
        ownerName: string | null
        ownerRole: string | null
        ownerEmail: string | null
        ownerLinkedIn: string | null
        chainClassification: string | null
        dataSources: string[] | null
        place: { name: string; website: string | null }
    }
    campaign: { sector: string; discountLevel: string | null }
}

export default function OutreachReviewQueue({
    reportId,
    sector,
    onApproved,
    onClose,
}: {
    reportId: string
    sector: string
    onApproved?: () => void
    onClose: () => void
}) {
    const [leads, setLeads] = useState<ReviewLead[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [decisions, setDecisions] = useState<Record<string, 'approved' | 'rejected'>>({})
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState<{ updated: number; approved: number } | null>(null)

    useEffect(() => {
        fetch(`/api/reports/${reportId}/outreach/review?sector=${encodeURIComponent(sector)}`)
            .then(r => r.json())
            .then(data => setLeads(data.leads || []))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [reportId, sector])

    const toggleDecision = (leadId: string, action: 'approved' | 'rejected') => {
        setDecisions(prev => ({ ...prev, [leadId]: action }))
    }

    const approveAll = () => {
        const all: Record<string, 'approved' | 'rejected'> = {}
        leads.forEach(l => { all[l.id] = 'approved' })
        setDecisions(all)
    }

    const rejectAll = () => {
        const all: Record<string, 'approved' | 'rejected'> = {}
        leads.forEach(l => { all[l.id] = 'rejected' })
        setDecisions(all)
    }

    const submit = async (pushToInstantly: boolean) => {
        setSubmitting(true)
        try {
            const res = await fetch(`/api/reports/${reportId}/outreach/review`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    decisions: Object.entries(decisions).map(([leadId, action]) => ({ leadId, action })),
                    pushToInstantly,
                }),
            })
            if (!res.ok) throw new Error(await res.text())
            const data = await res.json()
            setResult(data)
            onApproved?.()
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to submit')
        } finally {
            setSubmitting(false)
        }
    }

    const decidedCount = Object.keys(decisions).length
    const approvedCount = Object.values(decisions).filter(d => d === 'approved').length

    if (result) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={onClose}>
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-semibold mb-3">✅ Review Complete</h3>
                    <p className="text-sm text-gray-700">
                        {result.approved} leads approved, {result.updated - result.approved} rejected.
                    </p>
                    <button onClick={onClose} className="mt-4 w-full py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">
                        Done
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">🔍 Review Queue — {sector}</h3>
                        <button onClick={onClose} className="text-sm underline text-gray-500">Close</button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        These leads have partial data. Review and approve/reject before sending.
                    </p>
                </div>

                {loading && <div className="p-8 text-center text-gray-500">Loading...</div>}
                {error && <div className="p-4 text-red-600 text-sm">{error}</div>}

                {!loading && leads.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No leads pending review.</div>
                )}

                {!loading && leads.length > 0 && (
                    <>
                        {/* Bulk actions */}
                        <div className="px-4 py-2 border-b bg-gray-50 flex items-center gap-2">
                            <button onClick={approveAll} className="text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700">
                                ✅ Approve All ({leads.length})
                            </button>
                            <button onClick={rejectAll} className="text-xs px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">
                                ❌ Reject All
                            </button>
                            <span className="text-xs text-gray-500 ml-auto">
                                {decidedCount}/{leads.length} decided • {approvedCount} approved
                            </span>
                        </div>

                        {/* Leads table */}
                        <div className="flex-1 overflow-y-auto">
                            {leads.map(lead => {
                                const decision = decisions[lead.id]
                                const bgColor = decision === 'approved'
                                    ? 'bg-green-50 border-l-4 border-l-green-500'
                                    : decision === 'rejected'
                                        ? 'bg-red-50 border-l-4 border-l-red-300'
                                        : 'border-l-4 border-l-transparent'
                                return (
                                    <div key={lead.id} className={`px-4 py-3 border-b ${bgColor} transition-colors`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{lead.businessName}</p>
                                                <p className="text-xs text-gray-600 truncate">{lead.email}</p>
                                                {lead.enrichment.ownerName && (
                                                    <p className="text-xs text-gray-500">
                                                        👤 {lead.enrichment.ownerName}
                                                        {lead.enrichment.ownerRole && ` (${lead.enrichment.ownerRole})`}
                                                    </p>
                                                )}
                                                {!lead.enrichment.ownerName && (
                                                    <p className="text-xs text-amber-600">⚠️ No named contact — generic email</p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    Confidence: {lead.confidence}
                                                    {lead.enrichment.dataSources && ` • Sources: ${(lead.enrichment.dataSources as string[]).join(', ')}`}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                <button
                                                    onClick={() => toggleDecision(lead.id, 'approved')}
                                                    className={`text-xs px-2 py-1 rounded ${decision === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-green-100'}`}
                                                >
                                                    ✅
                                                </button>
                                                <button
                                                    onClick={() => toggleDecision(lead.id, 'rejected')}
                                                    className={`text-xs px-2 py-1 rounded ${decision === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-red-100'}`}
                                                >
                                                    ❌
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Footer actions */}
                        <div className="p-4 border-t bg-gray-50 flex items-center gap-2">
                            <button
                                onClick={() => submit(true)}
                                disabled={submitting || decidedCount === 0}
                                className="flex-1 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : `Submit & Push to Instantly (${approvedCount} leads)`}
                            </button>
                            <button
                                onClick={() => submit(false)}
                                disabled={submitting || decidedCount === 0}
                                className="py-2 px-4 rounded border text-sm hover:bg-gray-100 disabled:opacity-50"
                            >
                                Save Only
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
