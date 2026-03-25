'use client'

import { useEffect, useState, useCallback } from 'react'
import { Phone, CheckCircle, AlertTriangle, Clock, TrendingUp, ArrowUpRight, Headphones } from 'lucide-react'

interface SupportStats {
  overview: {
    totalCalls: number
    todayCalls: number
    resolvedCalls: number
    escalatedCalls: number
    resolutionRate: number
    escalationRate: number
    avgDuration: number
  }
  categoryBreakdown: { category: string; count: number }[]
  sentimentBreakdown: { sentiment: string; count: number }[]
  recentCalls: SupportCallRecord[]
}

interface SupportCallRecord {
  id: string
  vapiCallId: string
  callerNumber: string | null
  callerName: string | null
  status: string
  category: string | null
  summary: string | null
  transcript: string | null
  recordingUrl: string | null
  duration: number | null
  resolved: boolean
  escalatedToHuman: boolean
  callerSentiment: string | null
  createdAt: string
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function formatPhone(phone: string | null): string {
  if (!phone) return 'Unknown'
  if (phone.startsWith('+44')) return `0${phone.slice(3)}`
  return phone
}

function sentimentBadge(sentiment: string | null) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    positive: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '😊 Positive' },
    neutral: { bg: 'bg-slate-100', text: 'text-slate-600', label: '😐 Neutral' },
    negative: { bg: 'bg-red-100', text: 'text-red-700', label: '😠 Negative' },
  }
  const s = map[sentiment ?? ''] ?? { bg: 'bg-slate-50', text: 'text-slate-400', label: '—' }
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>
}

function statusBadge(status: string, resolved: boolean, escalated: boolean) {
  if (escalated) return <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">⚡ Escalated</span>
  if (resolved) return <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">✅ Resolved</span>
  if (status === 'in_progress') return <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">🔵 In Progress</span>
  return <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 text-xs font-medium">{status}</span>
}

function categoryColor(idx: number): string {
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500',
    'bg-cyan-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500', 'bg-indigo-500', 'bg-lime-500',
  ]
  return colors[idx % colors.length]
}

export default function SupportDashboard() {
  const [stats, setStats] = useState<SupportStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCall, setSelectedCall] = useState<SupportCallRecord | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/support/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Failed to fetch support stats', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30_000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [fetchStats])

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading support dashboard...</div>
        </div>
      </main>
    )
  }

  const overview = stats?.overview ?? {
    totalCalls: 0, todayCalls: 0, resolvedCalls: 0, escalatedCalls: 0,
    resolutionRate: 0, escalationRate: 0, avgDuration: 0,
  }

  const maxCategoryCount = Math.max(1, ...(stats?.categoryBreakdown?.map(c => c.count) ?? [1]))

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Headphones className="h-8 w-8 text-primary" />
            Customer Support
          </h1>
          <p className="text-muted-foreground mt-1">AI voice agent call analytics</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Voice agent active
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Phone className="h-5 w-5" />}
          label="Total Calls"
          value={overview.totalCalls}
          sub={`${overview.todayCalls} today`}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5" />}
          label="Resolution Rate"
          value={`${overview.resolutionRate}%`}
          sub={`${overview.resolvedCalls} resolved`}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Escalation Rate"
          value={`${overview.escalationRate}%`}
          sub={`${overview.escalatedCalls} escalated`}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Avg Duration"
          value={formatDuration(overview.avgDuration)}
          sub="per call"
          color="text-violet-600"
          bgColor="bg-violet-50"
        />
      </div>

      {/* Two-column: Category breakdown + Sentiment */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="lg:col-span-2 rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            FAQ Categories (Last 7 Days)
          </h2>
          {!stats?.categoryBreakdown?.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No call data yet — categories will appear once calls start coming in.</p>
          ) : (
            <div className="space-y-3">
              {stats.categoryBreakdown.map((cat, idx) => (
                <div key={cat.category} className="flex items-center gap-3">
                  <span className="text-sm w-52 truncate text-muted-foreground">{cat.category}</span>
                  <div className="flex-1 h-6 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${categoryColor(idx)} transition-all duration-500`}
                      style={{ width: `${(cat.count / maxCategoryCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{cat.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sentiment Breakdown */}
        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold mb-4">Caller Sentiment</h2>
          {!stats?.sentimentBreakdown?.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No sentiment data yet.</p>
          ) : (
            <div className="space-y-4 pt-2">
              {stats.sentimentBreakdown.map((s) => {
                const emoji = s.sentiment === 'positive' ? '😊' : s.sentiment === 'negative' ? '😠' : '😐'
                const color = s.sentiment === 'positive' ? 'text-emerald-600' : s.sentiment === 'negative' ? 'text-red-600' : 'text-slate-500'
                return (
                  <div key={s.sentiment} className="flex items-center justify-between">
                    <span className={`text-2xl`}>{emoji}</span>
                    <span className="capitalize text-sm">{s.sentiment}</span>
                    <span className={`text-lg font-bold ${color}`}>{s.count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Calls Table */}
      <div className="rounded-lg border bg-card">
        <div className="p-5 border-b">
          <h2 className="text-lg font-semibold">Recent Calls</h2>
        </div>
        {!stats?.recentCalls?.length ? (
          <div className="p-12 text-center text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No calls yet</p>
            <p className="text-sm mt-1">Calls will appear here once the voice agent starts receiving inbound calls.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Caller</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Sentiment</th>
                  <th className="px-5 py-3 font-medium">Duration</th>
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {stats.recentCalls.map((call) => (
                  <tr key={call.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium">{call.callerName ?? formatPhone(call.callerNumber)}</div>
                      {call.callerName && <div className="text-xs text-muted-foreground">{formatPhone(call.callerNumber)}</div>}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{call.category ?? '—'}</td>
                    <td className="px-5 py-3">{statusBadge(call.status, call.resolved, call.escalatedToHuman)}</td>
                    <td className="px-5 py-3">{sentimentBadge(call.callerSentiment)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDuration(call.duration)}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(call.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setSelectedCall(call)}
                        className="text-primary hover:underline text-xs flex items-center gap-1"
                      >
                        Details <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Call Detail Modal */}
      {selectedCall && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedCall(null)}>
          <div className="bg-background rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Call Details</h3>
              <button onClick={() => setSelectedCall(null)} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <span className="text-muted-foreground block">Caller</span>
                <span className="font-medium">{selectedCall.callerName ?? formatPhone(selectedCall.callerNumber)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Category</span>
                <span className="font-medium">{selectedCall.category ?? 'Uncategorised'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Status</span>
                {statusBadge(selectedCall.status, selectedCall.resolved, selectedCall.escalatedToHuman)}
              </div>
              <div>
                <span className="text-muted-foreground block">Sentiment</span>
                {sentimentBadge(selectedCall.callerSentiment)}
              </div>
              <div>
                <span className="text-muted-foreground block">Duration</span>
                <span className="font-medium">{formatDuration(selectedCall.duration)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Time</span>
                <span className="font-medium">{new Date(selectedCall.createdAt).toLocaleString('en-GB')}</span>
              </div>
            </div>

            {selectedCall.summary && (
              <div className="mb-4">
                <h4 className="font-semibold mb-1 text-sm">Summary</h4>
                <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">{selectedCall.summary}</p>
              </div>
            )}

            {selectedCall.transcript && (
              <div>
                <h4 className="font-semibold mb-1 text-sm">Transcript</h4>
                <pre className="text-xs text-muted-foreground bg-muted rounded-lg p-3 whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedCall.transcript}
                </pre>
              </div>
            )}

            {selectedCall.recordingUrl && (
              <div className="mt-4">
                <h4 className="font-semibold mb-1 text-sm">Recording</h4>
                <audio controls src={selectedCall.recordingUrl} className="w-full" />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

function StatCard({ icon, label, value, sub, color, bgColor }: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub: string
  color: string
  bgColor: string
}) {
  return (
    <div className="rounded-lg border bg-card p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${bgColor} ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </div>
  )
}
