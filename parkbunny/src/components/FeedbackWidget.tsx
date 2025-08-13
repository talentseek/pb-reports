'use client'

import { useEffect, useMemo, useState } from 'react'

type Feedback = {
  id: string
  type: 'BUG' | 'FEATURE'
  title: string
  details?: string | null
  status: 'OPEN' | 'DONE'
  createdAt: string
  createdByEmail?: string | null
}

export default function FeedbackWidget() {
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<'BUG' | 'FEATURE'>('BUG')
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [contact, setContact] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const openCount = useMemo(() => items.filter(i => i.status === 'OPEN').length, [items])

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch('/api/feedback', { cache: 'no-store' })
      const data = await res.json()
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title: title.trim(), details: details.trim() || undefined, contact: contact.trim() || undefined }),
      })
      if (res.ok) {
        setTitle('')
        setDetails('')
        await refresh()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function toggle(id: string) {
    const prev = [...items]
    setItems(items.map(i => i.id === id ? { ...i, status: i.status === 'DONE' ? 'OPEN' : 'DONE' } : i))
    const res = await fetch(`/api/feedback/${id}`, { method: 'PATCH' })
    if (!res.ok) setItems(prev)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Feedback: Bugs & Ideas</h2>
        <p className="text-sm text-gray-600">Report a bug or suggest a feature. We keep a simple list here and tick them off when done.</p>
      </div>

      <form onSubmit={submit} className="rounded border p-4 space-y-3">
        <div className="flex gap-3 items-center">
          <label className="text-sm">Type</label>
          <select value={type} onChange={e => setType(e.target.value as any)} className="border rounded px-2 py-1 text-sm">
            <option value="BUG">Bug</option>
            <option value="FEATURE">Feature</option>
          </select>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Short title" className="flex-1 border rounded px-2 py-1 text-sm" />
          <button disabled={submitting || !title.trim()} className="text-xs rounded border px-3 py-1 hover:bg-gray-50 disabled:opacity-50">Submit</button>
        </div>
        <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Optional details" className="w-full border rounded px-2 py-1 text-sm h-20" />
        <input value={contact} onChange={e => setContact(e.target.value)} placeholder="Optional contact (email)" className="w-full border rounded px-2 py-1 text-sm" />
      </form>

      <div className="rounded border">
        <div className="flex items-center justify-between p-3 border-b">
          <p className="text-sm">Items ({items.length}) • Open {openCount}</p>
          <button onClick={refresh} className="text-xs underline" disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
        </div>
        <ul className="divide-y">
          {items.map(i => (
            <li key={i.id} className="p-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase rounded px-1.5 py-0.5 border ${i.type === 'BUG' ? 'border-red-300 text-red-700' : 'border-blue-300 text-blue-700'}`}>{i.type}</span>
                  <span className={`text-xs rounded px-1 py-0.5 border ${i.status === 'DONE' ? 'border-green-300 text-green-700' : 'border-amber-300 text-amber-700'}`}>{i.status}</span>
                </div>
                <p className="text-sm font-medium truncate mt-1">{i.title}</p>
                {i.details ? <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{i.details}</p> : null}
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <button onClick={() => toggle(i.id)} className="text-xs rounded border px-2 py-1 hover:bg-gray-50">{i.status === 'DONE' ? 'Reopen' : 'Mark done'}</button>
              </div>
            </li>
          ))}
          {items.length === 0 && (
            <li className="p-3 text-sm text-gray-600">No feedback yet. Be the first to report a bug or suggest an idea.</li>
          )}
        </ul>
      </div>
    </div>
  )
}


