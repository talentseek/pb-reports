'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function RefreshPlacesButton({ reportId, postcodesCount, categoriesCount, maxPerType }: { reportId: string; postcodesCount?: number; categoriesCount?: number; maxPerType?: number }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [force, setForce] = useState(false)
  const router = useRouter()

  function estimateCost(): string {
    const pcs = Math.max(1, postcodesCount || 1)
    const cats = Math.max(1, categoriesCount || 8)
    const mpt = Math.max(1, maxPerType || 10)
    const pageSize = 20
    const searchesPerCategory = Math.ceil(mpt / pageSize)
    const searches = pcs * cats * searchesPerCategory
    // Pricing assumptions (USD per call) – conservative
    const NEARBY_PER_CALL_USD = 0.032 // ~$32 / 1k requests
    // FX + buffer (overestimate):
    const USD_TO_GBP = 0.78
    const BUFFER = 1.25
    const costUSD = searches * NEARBY_PER_CALL_USD
    const costGBP = costUSD * USD_TO_GBP * BUFFER
    return `≈ £${costGBP.toFixed(2)} per refresh (est.)`
  }

  async function handleClick() {
    setError(null)
    try {
      if (force) {
        const ok = window.confirm(`Force refresh will call Google APIs and may incur cost. ${estimateCost()}\n\nProceed?`)
        if (!ok) return
      }
      const res = await fetch(`/api/reports/${reportId}/places`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ force }) })
      if (!res.ok && res.status !== 204) {
        const text = await res.text()
        throw new Error(text || `HTTP ${res.status}`)
      }
      startTransition(() => {
        router.refresh()
      })
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select className="rounded border px-2 py-2 text-sm" value={force ? 'force' : 'cached'} onChange={(e) => setForce(e.target.value === 'force')}>
        <option value="cached">Normal</option>
        <option value="force">Force</option>
      </select>
      <button
        type="button"
        className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? 'Refreshing…' : 'Refresh Places'}
      </button>
      {force ? <span className="text-xs text-gray-600">{estimateCost()}</span> : null}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  )
}


