'use client'

import { useEffect, useState } from 'react'

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
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-lg bg-white h-full shadow-xl p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{category} – results</h3>
          <button onClick={onClose} className="text-sm underline">Close</button>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {!places && !error && <div className="text-sm text-gray-600">Loading…</div>}
        {places && places.length === 0 && <div className="text-sm text-gray-600">No places found.</div>}
        {places && places.length > 0 && (
          <ul className="space-y-3">
            {places.map((p: any) => (
              <li key={p.id} className="rounded border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-gray-600">{p.address}</p>
                    <p className="text-xs text-gray-600">Postcode: {p.postcode}</p>
                  </div>
                  <div className="text-right text-xs text-gray-600">
                    {p.rating ? <p>Rating: {p.rating}</p> : null}
                    {typeof p.priceLevel === 'number' ? <p>Price: {p.priceLevel}</p> : null}
                    <label className="inline-flex items-center gap-2 mt-1">
                      <input type="checkbox" checked={!!p.included} disabled={saving===p.id} onChange={() => toggleIncluded(p.id, !!p.included)} />
                      <span>Include</span>
                    </label>
                  </div>
                </div>
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
              </li>
            ))}
          </ul>
        )}
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


