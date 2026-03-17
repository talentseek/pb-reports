"use client"

import { useState } from 'react'
import OutreachReviewQueue from './OutreachReviewQueue'
import OutreachEmailPreview from './OutreachEmailPreview'

type OutreachBreakdown = {
    total: number
    autoApproved: number
    needsReview: number
    skipped: number
}

export default function OutreachConfigModal({
    reportId,
    category,
    enrichedCount,
    onClose,
}: {
    reportId: string
    category: string
    enrichedCount: number
    onClose: () => void
}) {
    const [discountLevel, setDiscountLevel] = useState('15%')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [breakdown, setBreakdown] = useState<OutreachBreakdown | null>(null)
    const [launched, setLaunched] = useState(false)
    const [showReviewQueue, setShowReviewQueue] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [previewApproved, setPreviewApproved] = useState(false)
    const [instantlyResult, setInstantlyResult] = useState<{
        campaignId: string; pushed: number; failed: number;
        failedEmails?: Array<{ email: string; error: string }>
    } | null>(null)

    // Step 1: Create campaign (review mode) to see breakdown
    const createCampaign = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/reports/${reportId}/outreach`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sector: category, discountLevel, launch: false }),
            })
            if (!res.ok) throw new Error(await res.text())
            const data = await res.json()
            setBreakdown(data.breakdown)
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to create campaign')
        } finally {
            setLoading(false)
        }
    }

    // Step 3: Launch — push approved leads to Instantly
    const launchCampaign = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/reports/${reportId}/outreach`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sector: category, discountLevel, launch: true }),
            })
            if (!res.ok) throw new Error(await res.text())
            const data = await res.json()
            setInstantlyResult(data.instantly)
            setLaunched(true)
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to launch campaign')
        } finally {
            setLoading(false)
        }
    }

    // Re-fetch breakdown after review queue changes (use GET to preserve review decisions)
    const refreshBreakdown = async () => {
        setShowReviewQueue(false)
        setLoading(true)
        try {
            const res = await fetch(`/api/reports/${reportId}/outreach`)
            if (!res.ok) throw new Error(await res.text())
            const data = await res.json()
            const campaign = data.campaigns?.find((c: { sector: string }) => c.sector === category)
            if (campaign) {
                const leads = campaign.leads || []
                setBreakdown({
                    total: leads.length,
                    autoApproved: leads.filter((l: { reviewStatus: string }) =>
                        l.reviewStatus === 'auto_approved' || l.reviewStatus === 'approved'
                    ).length,
                    needsReview: leads.filter((l: { reviewStatus: string }) =>
                        l.reviewStatus === 'pending_review'
                    ).length,
                    skipped: leads.filter((l: { reviewStatus: string }) =>
                        l.reviewStatus === 'skipped' || l.reviewStatus === 'rejected'
                    ).length,
                })
            }
        } catch {
            // Silently fail
        } finally {
            setLoading(false)
        }
    }

    // Show review queue
    if (showReviewQueue) {
        return (
            <OutreachReviewQueue
                reportId={reportId}
                sector={category}
                onApproved={refreshBreakdown}
                onClose={() => setShowReviewQueue(false)}
            />
        )
    }

    // Show email preview
    if (showPreview) {
        return (
            <OutreachEmailPreview
                reportId={reportId}
                sector={category}
                discountLevel={discountLevel}
                onConfirm={() => {
                    setShowPreview(false)
                    setPreviewApproved(true)
                }}
                onBack={() => setShowPreview(false)}
            />
        )
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-1">📧 Launch Email Outreach</h3>
                <p className="text-xs text-gray-500 mb-4">{category} — {enrichedCount} enriched businesses</p>

                {error && <div className="text-sm text-red-600 mb-3 p-2 bg-red-50 rounded">{error}</div>}

                {/* Launched confirmation */}
                {launched && instantlyResult && (
                    <div className="space-y-3">
                        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                            <p className="font-medium text-green-800">🚀 Campaign launched!</p>
                            <p className="text-green-700 mt-1">
                                {instantlyResult.pushed} leads pushed to Instantly.
                                {instantlyResult.failed > 0 && ` ${instantlyResult.failed} failed.`}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                                3-email sequence will send over the next 2 weeks.
                            </p>
                        </div>
                        {instantlyResult.failedEmails && instantlyResult.failedEmails.length > 0 && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm space-y-1">
                                <p className="font-medium text-red-700">Failed leads:</p>
                                {instantlyResult.failedEmails.map((f, i) => (
                                    <div key={i} className="text-xs text-red-600">
                                        <strong>{f.email}</strong>: {f.error}
                                    </div>
                                ))}
                            </div>
                        )}
                        <button onClick={onClose} className="w-full py-2 rounded bg-gray-100 text-sm hover:bg-gray-200">
                            Done
                        </button>
                    </div>
                )}

                {/* Pre-launch config */}
                {!launched && (
                    <div className="space-y-4">
                        {/* Discount level */}
                        <div>
                            <label className="text-xs font-medium text-gray-700 block mb-1">Discount Level</label>
                            <div className="flex gap-2">
                                {['10%', '15%', '20%', '25%'].map(level => (
                                    <button
                                        key={level}
                                        onClick={() => { setDiscountLevel(level); setPreviewApproved(false) }}
                                        className={`flex-1 py-2 rounded text-sm border transition-colors ${discountLevel === level
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Preview Campaign / Breakdown */}
                        {!breakdown && (
                            <button
                                onClick={createCampaign}
                                disabled={loading}
                                className="w-full py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Analyzing leads...' : 'Preview Campaign'}
                            </button>
                        )}

                        {breakdown && (
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-50 rounded border text-sm space-y-1">
                                    <div className="flex justify-between">
                                        <span>Total with emails</span>
                                        <span className="font-medium">{breakdown.total}</span>
                                    </div>
                                    <div className="flex justify-between text-green-700">
                                        <span>✅ Auto-approved (high confidence)</span>
                                        <span className="font-medium">{breakdown.autoApproved}</span>
                                    </div>
                                    <div className="flex justify-between text-amber-700">
                                        <span>🟡 Needs review (partial)</span>
                                        <span className="font-medium">{breakdown.needsReview}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-500">
                                        <span>❌ Skipped (failed/low)</span>
                                        <span className="font-medium">{breakdown.skipped}</span>
                                    </div>
                                </div>

                                <div className="text-xs text-gray-500 p-2 bg-blue-50 rounded">
                                    📧 3 plain-text emails • 3 working days apart • Stop on reply
                                    <br />💰 Discount: {discountLevel} off parking for staff &amp; {category.includes('Hotel') ? 'guests' : category.includes('Food') ? 'diners' : 'customers'}
                                </div>

                                {/* Preview emails button */}
                                <button
                                    onClick={() => setShowPreview(true)}
                                    className={`w-full py-2 rounded text-sm border transition-colors ${
                                        previewApproved
                                            ? 'bg-green-50 text-green-700 border-green-300'
                                            : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                                    }`}
                                >
                                    {previewApproved ? '✅ Emails previewed & approved' : '👁️ Preview Emails (required)'}
                                </button>

                                <div className="flex gap-2">
                                    <button
                                        onClick={launchCampaign}
                                        disabled={loading || breakdown.autoApproved === 0 || !previewApproved}
                                        className="flex-1 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
                                        title={!previewApproved ? 'Preview emails first' : undefined}
                                    >
                                        {loading ? 'Launching...' : `🚀 Launch (${breakdown.autoApproved} leads)`}
                                    </button>
                                    {breakdown.needsReview > 0 && (
                                        <button
                                            onClick={() => setShowReviewQueue(true)}
                                            className="py-2 px-3 rounded border text-sm hover:bg-amber-50 text-amber-700"
                                        >
                                            Review {breakdown.needsReview}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <button onClick={onClose} className="w-full py-2 rounded border text-sm text-gray-500 hover:bg-gray-50">
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
