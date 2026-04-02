'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Phone, Target, CalendarDays, Clock, TrendingUp, ArrowUpRight, PhoneCall, ChevronLeft, ChevronRight, Filter } from 'lucide-react'

interface VoiceOutreachStats {
  overview: {
    totalCalls: number
    todaysCalls: number
    leadsCaptured: number
    callbacksBooked: number
    conversionRate: number
    contactRate: number
    rejectionRate: number
    avgDuration: number
    avgSuccessDuration: number
  }
  outcomeBreakdown: { outcome: string; count: number; color: string }[]
  weeklyTrend: { date: string; count: number }[]
  campaigns: {
    id: string
    name: string
    status: string
    carparkName: string
    postcode: string
    businessCount: number
    createdAt: string
  }[]
  recentCalls: RecentCall[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

interface RecentCall {
  id: string
  businessName: string
  phone: string | null
  campaignName: string
  carparkName: string
  callStatus: string
  callAttempts: number
  callDuration: number | null
  callSummary: string | null
  transcript: string | null
  recordingUrl: string | null
  extractedName: string | null
  extractedEmail: string | null
  extractedPhone: string | null
  callbackTime: string | null
  lastCallAt: string | null
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function outcomeIcon(status: string): string {
  const map: Record<string, string> = {
    LEAD_CAPTURED: '✅',
    CALLBACK_BOOKED: '📅',
    NOT_INTERESTED: '❌',
    VOICEMAIL: '📞',
    GATEKEEPER_BLOCKED: '🚫',
    NO_ANSWER: '📵',
    IN_PROGRESS: '🔵',
    FAILED: '⚠️',
    CTPS_BLOCKED: '🛑',
    INVALID_NUMBER: '❓',
  }
  return map[status] ?? '•'
}

function outcomeBadge(status: string) {
  const styles: Record<string, string> = {
    LEAD_CAPTURED: 'bg-emerald-100 text-emerald-700',
    CALLBACK_BOOKED: 'bg-blue-100 text-blue-700',
    NOT_INTERESTED: 'bg-red-100 text-red-700',
    VOICEMAIL: 'bg-amber-100 text-amber-700',
    GATEKEEPER_BLOCKED: 'bg-rose-100 text-rose-700',
    NO_ANSWER: 'bg-slate-100 text-slate-600',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    FAILED: 'bg-red-100 text-red-700',
    CTPS_BLOCKED: 'bg-red-200 text-red-800',
    INVALID_NUMBER: 'bg-slate-100 text-slate-500',
  }
  const label = status.toLowerCase().replace(/_/g, ' ')
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {outcomeIcon(status)} {label}
    </span>
  )
}

function outcomeColor(color: string): string {
  const map: Record<string, string> = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    slate: 'bg-slate-400',
    gray: 'bg-gray-300',
  }
  return map[color] ?? 'bg-slate-300'
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Outcomes' },
  { value: 'LEAD_CAPTURED', label: '✅ Lead Captured' },
  { value: 'CALLBACK_BOOKED', label: '📅 Callback Booked' },
  { value: 'NOT_INTERESTED', label: '❌ Not Interested' },
  { value: 'VOICEMAIL', label: '📞 Voicemail' },
  { value: 'GATEKEEPER_BLOCKED', label: '🚫 Gatekeeper Blocked' },
  { value: 'NO_ANSWER', label: '📵 No Answer' },
  { value: 'FAILED', label: '⚠️ Failed' },
  { value: 'IN_PROGRESS', label: '🔵 In Progress' },
]

export default function VoiceOutreachDashboard() {
  const [stats, setStats] = useState<VoiceOutreachStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCall, setSelectedCall] = useState<RecentCall | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', currentPage.toString())
      params.set('pageSize', pageSize.toString())

      const res = await fetch(`/api/outreach/voice/stats?${params}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Failed to fetch voice stats', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, currentPage])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30_000)
    return () => clearInterval(interval)
  }, [fetchStats])

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter])

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading voice outreach analytics...</div>
        </div>
      </main>
    )
  }

  const overview = stats?.overview ?? {
    totalCalls: 0, todaysCalls: 0, leadsCaptured: 0, callbacksBooked: 0,
    conversionRate: 0, contactRate: 0, rejectionRate: 0, avgDuration: 0, avgSuccessDuration: 0,
  }

  const pagination = stats?.pagination ?? { page: 1, pageSize: 50, totalItems: 0, totalPages: 1 }
  const maxOutcome = Math.max(1, ...(stats?.outcomeBreakdown?.map(o => o.count) ?? [1]))
  const maxTrend = Math.max(1, ...(stats?.weeklyTrend?.map(d => d.count) ?? [1]))

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <PhoneCall className="h-8 w-8 text-primary" />
            Voice Outreach Analytics
          </h1>
          <p className="text-muted-foreground mt-1">AI voice agent call performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/outreach"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Campaign Monitor
          </Link>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Phone className="h-5 w-5" />}
          label="Total Calls"
          value={overview.totalCalls}
          sub={`${overview.todaysCalls} today`}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          label="Conversion Rate"
          value={`${overview.conversionRate}%`}
          sub={`${overview.leadsCaptured} leads captured`}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Callbacks Booked"
          value={overview.callbacksBooked}
          sub={`${overview.contactRate}% contact rate`}
          color="text-blue-600"
          bgColor="bg-blue-50"
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

      {/* Two-column: Outcome Breakdown + Weekly Trend */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Outcome Breakdown */}
        <div className="lg:col-span-2 rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            Call Outcomes
          </h2>
          {!stats?.outcomeBreakdown?.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No call data yet — outcomes will appear once campaigns start running.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.outcomeBreakdown.map((o) => (
                <button
                  key={o.outcome}
                  className="flex items-center gap-3 w-full hover:bg-muted/50 rounded-lg px-2 py-1 transition-colors"
                  onClick={() => {
                    const statusKey = o.outcome.toUpperCase().replace(/ /g, '_')
                    setStatusFilter(prev => prev === statusKey ? '' : statusKey)
                  }}
                >
                  <span className="text-sm w-44 truncate text-muted-foreground text-left">{o.outcome}</span>
                  <div className="flex-1 h-6 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${outcomeColor(o.color)} transition-all duration-500`}
                      style={{ width: `${(o.count / maxOutcome) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{o.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Trend */}
        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold mb-4">Weekly Activity</h2>
          {!stats?.weeklyTrend?.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No trend data yet.</p>
          ) : (
            <div className="flex items-end gap-1.5 h-32 mt-4">
              {stats.weeklyTrend.map((d) => {
                const height = maxTrend > 0 ? (d.count / maxTrend) * 100 : 0
                const dayLabel = new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short' })
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-muted-foreground">{d.count || ''}</span>
                    <div className="w-full bg-muted rounded-t relative" style={{ height: `${Math.max(height, 4)}%` }}>
                      <div
                        className="absolute inset-0 bg-primary rounded-t transition-all duration-300"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{dayLabel}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Calls Table with Filter + Pagination */}
      <div className="rounded-lg border bg-card">
        <div className="p-5 border-b flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold">All Calls</h2>
          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border rounded-md px-2 py-1.5 bg-background text-foreground"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <span className="text-xs text-muted-foreground">
              {pagination.totalItems} total {statusFilter && `(filtered)`}
            </span>
          </div>
        </div>
        {!stats?.recentCalls?.length ? (
          <div className="p-12 text-center text-muted-foreground">
            <PhoneCall className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No calls {statusFilter ? 'matching this filter' : 'yet'}</p>
            <p className="text-sm mt-1">
              {statusFilter ? 'Try a different filter.' : 'Calls will appear here once voice campaigns start running.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Business</th>
                    <th className="px-5 py-3 font-medium">Campaign</th>
                    <th className="px-5 py-3 font-medium">Outcome</th>
                    <th className="px-5 py-3 font-medium">Contact Found</th>
                    <th className="px-5 py-3 font-medium">Duration</th>
                    <th className="px-5 py-3 font-medium">Time</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentCalls.map((call) => (
                    <tr key={call.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium">{call.businessName}</div>
                        <div className="text-xs text-muted-foreground">{call.phone ?? '—'}</div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">
                        {call.campaignName}
                      </td>
                      <td className="px-5 py-3">{outcomeBadge(call.callStatus)}</td>
                      <td className="px-5 py-3">
                        {call.extractedName ? (
                          <div>
                            <div className="text-xs font-medium">{call.extractedName}</div>
                            {call.extractedEmail && (
                              <div className="text-xs text-blue-600">{call.extractedEmail}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{formatDuration(call.callDuration)}</td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">
                        {call.lastCallAt
                          ? new Date(call.lastCallAt).toLocaleString('en-GB', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                            })
                          : '—'}
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

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} calls)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-md border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        p === currentPage
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={currentPage >= pagination.totalPages}
                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                    className="p-1.5 rounded-md border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Call Detail Modal */}
      {selectedCall && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCall(null)}
        >
          <div
            className="bg-background rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Call Details</h3>
              <button
                onClick={() => setSelectedCall(null)}
                className="text-muted-foreground hover:text-foreground text-xl"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <span className="text-muted-foreground block">Business</span>
                <span className="font-medium">{selectedCall.businessName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Phone</span>
                <span className="font-medium">{selectedCall.phone ?? '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Outcome</span>
                {outcomeBadge(selectedCall.callStatus)}
              </div>
              <div>
                <span className="text-muted-foreground block">Attempts</span>
                <span className="font-medium">{selectedCall.callAttempts}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Duration</span>
                <span className="font-medium">{formatDuration(selectedCall.callDuration)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Campaign</span>
                <span className="font-medium">{selectedCall.campaignName}</span>
              </div>
            </div>

            {/* Extracted Contact Info */}
            {(selectedCall.extractedName || selectedCall.extractedEmail || selectedCall.extractedPhone) && (
              <div className="mb-4 bg-emerald-50 rounded-lg p-4 space-y-1">
                <h4 className="font-semibold text-sm text-emerald-700 mb-2">📇 Extracted Contact</h4>
                {selectedCall.extractedName && (
                  <p className="text-sm"><strong>Name:</strong> {selectedCall.extractedName}</p>
                )}
                {selectedCall.extractedEmail && (
                  <p className="text-sm"><strong>Email:</strong> <span className="text-blue-600">{selectedCall.extractedEmail}</span></p>
                )}
                {selectedCall.extractedPhone && (
                  <p className="text-sm"><strong>Direct Phone:</strong> {selectedCall.extractedPhone}</p>
                )}
                {selectedCall.callbackTime && (
                  <p className="text-sm"><strong>Callback:</strong> {selectedCall.callbackTime}</p>
                )}
              </div>
            )}

            {selectedCall.callSummary && (
              <div className="mb-4">
                <h4 className="font-semibold mb-1 text-sm">Summary</h4>
                <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
                  {selectedCall.callSummary}
                </p>
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
