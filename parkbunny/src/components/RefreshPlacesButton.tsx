'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function RefreshPlacesButton({ reportId }: { reportId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleClick() {
    setError(null)
    try {
      const res = await fetch(`/api/reports/${reportId}/places`, { method: 'POST' })
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
      <button
        type="button"
        className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? 'Refreshing…' : 'Refresh Places'}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  )
}


