"use client"

import { useEffect, useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Enrichment = {
  status: string
  ownerName: string | null
  ownerRole: string | null
  ownerEmail: string | null
  ownerPhone: string | null
  ownerLinkedIn: string | null
  companyName: string | null
  chainClassification: string | null
  chainName: string | null
  emailVerified: boolean
  overallConfidence: string | null
  dataSources: any
  lastEnrichedAt: string | null
}

type Place = {
  id: string
  name: string
  address: string
  rating?: number | null
  priceLevel?: number | null
  website?: string | null
  phone?: string | null
  postcode: string
  parkingOptions?: any
  included?: boolean
  enrichment?: Enrichment | null
}

type EnrichProgress = {
  current: number
  total: number
  placeId: string
  name: string
  status: string
  ownerName?: string
  ownerEmail?: string
  ownerRole?: string
  confidence?: string
  emailVerified?: boolean
}

export default function CategoryPlacesDrawer({
  reportId,
  category,
  postcode,
  onClose,
}: {
  reportId: string
  category: string
  postcode?: string
  onClose: () => void
}) {
  const [places, setPlaces] = useState<Place[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Enrichment state
  const [enriching, setEnriching] = useState(false)
  const [enrichProgress, setEnrichProgress] = useState<{ current: number; total: number } | null>(null)
  const [enrichResults, setEnrichResults] = useState<Map<string, EnrichProgress>>(new Map())
  const [enrichComplete, setEnrichComplete] = useState<{ resolved: number; partial: number; failed: number } | null>(null)
  const [dryRunData, setDryRunData] = useState<{ toEnrich: number; alreadyEnriched: number } | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    const url = new URL(`/api/reports/${reportId}/placesByCategory`, window.location.origin)
    url.searchParams.set('category', category)
    if (postcode) url.searchParams.set('postcode', postcode)
    fetch(url.toString())
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text())
        return r.json()
      })
      .then((data) => setPlaces(data.places))
      .catch((e) => setError(e?.message || 'Failed to load'))
  }, [reportId, category, postcode])

  async function toggleIncluded(placeId: string, current: boolean) {
    setSaving(placeId)
    try {
      const res = await fetch(`/api/reports/${reportId}/placesByCategory`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId, included: !current }),
      })
      if (!res.ok) throw new Error(await res.text())
      setPlaces((prev) => (prev || []).map((p) => p.id === placeId ? { ...p, included: !current } as any : p))
      router.refresh()
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(null)
    }
  }

  // Dry run to check how many businesses need enrichment
  const handleEnrichClick = useCallback(async () => {
    try {
      const res = await fetch(`/api/reports/${reportId}/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, postcode, dryRun: true }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setDryRunData(data)
      setShowConfirm(true)
    } catch (e: any) {
      setError(e?.message || 'Failed to check enrichment')
    }
  }, [reportId, category, postcode])

  // Run the actual enrichment with SSE streaming
  const startEnrichment = useCallback(async () => {
    setShowConfirm(false)
    setEnriching(true)
    setEnrichComplete(null)
    setEnrichResults(new Map())

    try {
      const res = await fetch(`/api/reports/${reportId}/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, postcode }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'start') {
              setEnrichProgress({ current: 0, total: data.total })
            } else if (data.type === 'progress') {
              setEnrichProgress({ current: data.current, total: data.total })
              setEnrichResults(prev => {
                const next = new Map(prev)
                next.set(data.placeId, data)
                return next
              })
              // Live update the place's enrichment data
              if (data.status === 'resolved' || data.status === 'partial') {
                setPlaces(prev => (prev || []).map(p =>
                  p.id === data.placeId ? {
                    ...p,
                    enrichment: {
                      status: data.status,
                      ownerName: data.ownerName || null,
                      ownerRole: data.ownerRole || null,
                      ownerEmail: data.ownerEmail || null,
                      ownerPhone: null,
                      ownerLinkedIn: null,
                      companyName: null,
                      chainClassification: null,
                      chainName: null,
                      emailVerified: data.emailVerified || false,
                      overallConfidence: data.confidence || null,
                      dataSources: null,
                      lastEnrichedAt: new Date().toISOString(),
                    },
                  } : p
                ))
              }
            } else if (data.type === 'complete') {
              setEnrichComplete({ resolved: data.resolved, partial: data.partial, failed: data.failed })
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Enrichment failed')
    } finally {
      setEnriching(false)
      // Reload places to get full enrichment data from DB
      const url = new URL(`/api/reports/${reportId}/placesByCategory`, window.location.origin)
      url.searchParams.set('category', category)
      if (postcode) url.searchParams.set('postcode', postcode)
      fetch(url.toString())
        .then(r => r.json())
        .then(data => setPlaces(data.places))
        .catch(() => { })
    }
  }, [reportId, category, postcode])

  // Count included businesses that aren't enriched yet
  const includedCount = places?.filter(p => p.included).length || 0
  const unenrichedCount = places?.filter(p => p.included && !p.enrichment).length || 0
  const enrichedCount = places?.filter(p => p.enrichment).length || 0

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-lg bg-white h-full shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">{category} – results</h3>
            <button onClick={onClose} className="text-sm underline">Close</button>
          </div>

          {/* Enrichment controls */}
          {places && places.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              {enrichedCount > 0 && (
                <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  {enrichedCount} enriched
                </span>
              )}
              {!enriching && unenrichedCount > 0 && (
                <button
                  onClick={handleEnrichClick}
                  className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  🔍 Enrich {unenrichedCount} business{unenrichedCount !== 1 ? 'es' : ''}
                </button>
              )}
              {!enriching && unenrichedCount === 0 && includedCount > 0 && (
                <span className="text-xs text-gray-500">All included businesses enriched ✅</span>
              )}
            </div>
          )}

          {/* Confirmation dialog */}
          {showConfirm && dryRunData && (
            <div className="mt-2 p-3 rounded bg-blue-50 border border-blue-200 text-sm">
              <p className="font-medium">Enrich {dryRunData.toEnrich} business{dryRunData.toEnrich !== 1 ? 'es' : ''}?</p>
              {dryRunData.alreadyEnriched > 0 && (
                <p className="text-xs text-gray-600 mt-1">{dryRunData.alreadyEnriched} already enriched (will be skipped)</p>
              )}
              <p className="text-xs text-gray-500 mt-1">This will use API credits (Apollo, Firecrawl). Takes ~10s per business.</p>
              <div className="flex gap-2 mt-2">
                <button onClick={startEnrichment} className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">
                  Confirm
                </button>
                <button onClick={() => setShowConfirm(false)} className="text-xs px-3 py-1 rounded border hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {enriching && enrichProgress && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Enriching {enrichProgress.current}/{enrichProgress.total}...</span>
                <span>{Math.round((enrichProgress.current / enrichProgress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(enrichProgress.current / enrichProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Completion summary */}
          {enrichComplete && (
            <div className="mt-2 p-2 rounded bg-green-50 border border-green-200 text-xs">
              Enrichment complete: {enrichComplete.resolved} ✅ resolved, {enrichComplete.partial} 🟡 partial, {enrichComplete.failed} ❌ failed
            </div>
          )}
        </div>

        {/* Places list */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && <div className="text-sm text-red-600">{error}</div>}
          {!places && !error && <div className="text-sm text-gray-600">Loading…</div>}
          {places && places.length === 0 && <div className="text-sm text-gray-600">No places found.</div>}
          {places && places.length > 0 && (
            <ul className="space-y-3">
              {places.map((p: any) => {
                const enrichResult = enrichResults.get(p.id)
                const isCurrentlyEnriching = enriching && enrichResult === undefined && enrichProgress && enrichProgress.current < enrichProgress.total
                return (
                  <li key={p.id} className={`rounded border p-3 ${p.enrichment ? 'border-l-4 ' + getStatusBorderColor(p.enrichment.status) : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{p.name}</p>
                          {p.enrichment && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${getStatusBadge(p.enrichment.status)}`}>
                              {getStatusIcon(p.enrichment.status)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">{p.address}</p>
                        <p className="text-xs text-gray-600">Postcode: {p.postcode}</p>
                      </div>
                      <div className="text-right text-xs text-gray-600">
                        {p.rating ? <p>Rating: {p.rating}</p> : null}
                        {typeof p.priceLevel === 'number' ? <p>Price: {p.priceLevel}</p> : null}
                        <label className="inline-flex items-center gap-2 mt-1">
                          <input type="checkbox" checked={!!p.included} disabled={saving === p.id} onChange={() => toggleIncluded(p.id, !!p.included)} />
                          <span>Include</span>
                        </label>
                      </div>
                    </div>

                    {/* Existing details row */}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                      {p.website ? <a href={p.website} target="_blank" className="underline">Website</a> : null}
                      {p.phone ? <span>{p.phone}</span> : null}
                      {p.parkingOptions && (
                        <div className="flex flex-wrap items-center gap-1">
                          {Object.entries(p.parkingOptions as Record<string, boolean>).filter(([, v]) => !!v).map(([k]) => (
                            <span key={k} className="rounded-full border px-2 py-0.5">{formatParking(k)}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Enrichment data */}
                    {p.enrichment && (
                      <div className="mt-2 pt-2 border-t border-gray-100 text-xs space-y-1">
                        {p.enrichment.ownerName && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">👤</span>
                            <span className="font-medium">{p.enrichment.ownerName}</span>
                            {p.enrichment.ownerRole && <span className="text-gray-500">({p.enrichment.ownerRole})</span>}
                          </div>
                        )}
                        {p.enrichment.ownerEmail && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">📧</span>
                            <a href={`mailto:${p.enrichment.ownerEmail}`} className="underline text-blue-600">{p.enrichment.ownerEmail}</a>
                            {p.enrichment.emailVerified && <span className="text-green-600">✅</span>}
                          </div>
                        )}
                        {p.enrichment.ownerLinkedIn && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">🔗</span>
                            <a href={p.enrichment.ownerLinkedIn} target="_blank" className="underline text-blue-600">LinkedIn</a>
                          </div>
                        )}
                        {p.enrichment.companyName && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">🏢</span>
                            <span>{p.enrichment.companyName}</span>
                            {p.enrichment.chainName && <span className="text-gray-400">({p.enrichment.chainName})</span>}
                          </div>
                        )}
                        {p.enrichment.overallConfidence && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <span>Confidence: {p.enrichment.overallConfidence}</span>
                            {p.enrichment.dataSources && Array.isArray(p.enrichment.dataSources) && (
                              <span>• Sources: {(p.enrichment.dataSources as string[]).join(', ')}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Live enrichment progress for this card */}
                    {enriching && !p.enrichment && enrichResult && (
                      <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
                        <span className={enrichResult.status === 'resolved' ? 'text-green-600' : enrichResult.status === 'partial' ? 'text-yellow-600' : 'text-red-500'}>
                          {enrichResult.status === 'resolved' ? '✅' : enrichResult.status === 'partial' ? '🟡' : '❌'} {enrichResult.status}
                        </span>
                        {enrichResult.ownerName && <span className="ml-2">• {enrichResult.ownerName}</span>}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function formatParking(key: string) {
  switch (key) {
    case 'freeParkingLots': return 'Free lot'
    case 'paidParkingLots': return 'Paid lot'
    case 'freeStreetParking': return 'Free street'
    case 'valetParking': return 'Valet'
    case 'freeGarageParking': return 'Free garage'
    case 'paidGarageParking': return 'Paid garage'
    default: return key
  }
}

function getStatusBorderColor(status: string) {
  switch (status) {
    case 'resolved': return 'border-l-green-500'
    case 'partial': return 'border-l-yellow-400'
    case 'failed': return 'border-l-red-400'
    default: return 'border-l-gray-300'
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'resolved': return 'bg-green-100 text-green-700'
    case 'partial': return 'bg-yellow-100 text-yellow-700'
    case 'failed': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'resolved': return '✅'
    case 'partial': return '🟡'
    case 'failed': return '❌'
    default: return '⚪'
  }
}
