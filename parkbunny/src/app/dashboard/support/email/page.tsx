'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Mail, CheckCircle, AlertTriangle, Clock, TrendingUp,
  ArrowUpRight, Inbox, Send, Eye, X, Loader2, RefreshCw,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface EmailStats {
  overview: {
    totalEmails: number
    todayEmails: number
    resolvedEmails: number
    escalatedEmails: number
    needsReviewEmails: number
    resolutionRate: number
    escalationRate: number
  }
  categoryBreakdown: { category: string; count: number }[]
  sentimentBreakdown: { sentiment: string; count: number }[]
  recentEmails: EmailRecord[]
}

interface EmailRecord {
  id: string
  fromEmail: string
  fromName: string | null
  subject: string
  receivedAt: string
  status: string
  category: string | null
  resolved: boolean
  escalatedToHuman: boolean
  sentiment: string | null
  aiSummary: string | null
  suggestedReply: string | null
  replyText: string | null
  replySentAt: string | null
  createdAt: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function sentimentBadge(sentiment: string | null) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    positive: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '😊 Positive' },
    neutral: { bg: 'bg-slate-100', text: 'text-slate-600', label: '😐 Neutral' },
    negative: { bg: 'bg-red-100', text: 'text-red-700', label: '😠 Negative' },
  }
  const s = map[sentiment ?? ''] ?? { bg: 'bg-slate-50', text: 'text-slate-400', label: '—' }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

function statusBadge(status: string, resolved: boolean, escalated: boolean) {
  if (status === 'needs_review' || escalated)
    return <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">⚡ Needs Review</span>
  if (resolved || status === 'replied')
    return <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">✅ Auto-Replied</span>
  if (status === 'processing')
    return <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">🔄 Processing</span>
  return <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 text-xs font-medium">{status}</span>
}

function categoryColor(idx: number): string {
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500',
    'bg-cyan-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500', 'bg-indigo-500', 'bg-lime-500',
  ]
  return colors[idx % colors.length]
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────────

export default function EmailSupportDashboard() {
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null)

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch('/api/support/emails/stats')
      if (res.ok) setStats(await res.json())
    } catch (err) {
      console.error('Failed to fetch email stats', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(() => fetchStats(true), 30_000)
    return () => clearInterval(interval)
  }, [fetchStats])

  const handleEmailUpdate = useCallback((updatedEmail: EmailRecord) => {
    setStats((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        recentEmails: prev.recentEmails.map((e) => e.id === updatedEmail.id ? updatedEmail : e),
      }
    })
    setSelectedEmail(updatedEmail)
  }, [])

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading email support dashboard...
          </div>
        </div>
      </main>
    )
  }

  const overview = stats?.overview ?? {
    totalEmails: 0, todayEmails: 0, resolvedEmails: 0, escalatedEmails: 0,
    needsReviewEmails: 0, resolutionRate: 0, escalationRate: 0,
  }
  const maxCategoryCount = Math.max(1, ...(stats?.categoryBreakdown?.map(c => c.count) ?? [1]))

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">

      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8 text-primary" />
            Email Support
          </h1>
          <p className="text-muted-foreground mt-1">AI email triage and auto-reply analytics</p>
        </div>
        <div className="flex items-center gap-3">
          {overview.needsReviewEmails > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-700 px-3 py-1.5 text-sm font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              {overview.needsReviewEmails} need{overview.needsReviewEmails === 1 ? 's' : ''} review
            </span>
          )}
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Email agent active
          </div>
        </div>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Inbox className="h-5 w-5" />}
          label="Total Emails"
          value={overview.totalEmails}
          sub={`${overview.todayEmails} today`}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5" />}
          label="Resolution Rate"
          value={`${overview.resolutionRate}%`}
          sub={`${overview.resolvedEmails} auto-replied`}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Needs Review"
          value={overview.needsReviewEmails}
          sub={`${overview.escalationRate}% of total`}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Escalated"
          value={overview.escalatedEmails}
          sub="human intervention"
          color="text-rose-600"
          bgColor="bg-rose-50"
        />
      </div>

      {/* Category + Sentiment */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            FAQ Categories (Last 7 Days)
          </h2>
          {!stats?.categoryBreakdown?.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No email data yet — categories will appear once emails start coming in.
            </p>
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

        <div className="rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold mb-4">Sender Sentiment</h2>
          {!stats?.sentimentBreakdown?.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No sentiment data yet.</p>
          ) : (
            <div className="space-y-4 pt-2">
              {stats.sentimentBreakdown.map((s) => {
                const emoji = s.sentiment === 'positive' ? '😊' : s.sentiment === 'negative' ? '😠' : '😐'
                const color = s.sentiment === 'positive' ? 'text-emerald-600' : s.sentiment === 'negative' ? 'text-red-600' : 'text-slate-500'
                return (
                  <div key={s.sentiment} className="flex items-center justify-between">
                    <span className="text-2xl">{emoji}</span>
                    <span className="capitalize text-sm">{s.sentiment}</span>
                    <span className={`text-lg font-bold ${color}`}>{s.count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Email Log Table */}
      <div className="rounded-lg border bg-card">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Emails</h2>
          <span className="text-xs text-muted-foreground">Last 10 received</span>
        </div>
        {!stats?.recentEmails?.length ? (
          <div className="p-12 text-center text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No emails yet</p>
            <p className="text-sm mt-1">
              Connect the Outlook mailbox in{' '}
              <a href="/settings" className="text-primary underline">Settings</a>
              {' '}to start receiving and processing support emails.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-5 py-3 font-medium">From</th>
                  <th className="px-5 py-3 font-medium">Subject</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Sentiment</th>
                  <th className="px-5 py-3 font-medium">Received</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {stats.recentEmails.map((email) => (
                  <tr
                    key={email.id}
                    className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${email.status === 'needs_review' ? 'bg-amber-50/40' : ''}`}
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium">{email.fromName ?? email.fromEmail}</div>
                      {email.fromName && <div className="text-xs text-muted-foreground">{email.fromEmail}</div>}
                    </td>
                    <td className="px-5 py-3 max-w-[200px]">
                      <span className="truncate block text-muted-foreground" title={email.subject}>{email.subject}</span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{email.category ?? '—'}</td>
                    <td className="px-5 py-3">{statusBadge(email.status, email.resolved, email.escalatedToHuman)}</td>
                    <td className="px-5 py-3">{sentimentBadge(email.sentiment)}</td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(email.receivedAt).toLocaleString('en-GB', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setSelectedEmail(email)}
                        className="text-primary hover:underline text-xs flex items-center gap-1"
                      >
                        {email.status === 'needs_review' ? (
                          <><Eye className="h-3 w-3" /> Review</>
                        ) : (
                          <><ArrowUpRight className="h-3 w-3" /> Details</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Email Detail / Review Modal */}
      {selectedEmail && (
        <EmailDetailModal
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
          onUpdate={handleEmailUpdate}
          onRefresh={() => fetchStats(true)}
        />
      )}
    </main>
  )
}

// ─── Email Detail Modal ─────────────────────────────────────────────────────────

function EmailDetailModal({
  email,
  onClose,
  onUpdate,
  onRefresh,
}: {
  email: EmailRecord
  onClose: () => void
  onUpdate: (email: EmailRecord) => void
  onRefresh: () => void
}) {
  const [sending, setSending] = useState(false)
  const [replyText, setReplyText] = useState(email.suggestedReply ?? '')
  const [sendError, setSendError] = useState<string | null>(null)
  const [sent, setSent] = useState(email.status === 'replied')

  async function handleSendReply() {
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch(`/api/support/emails/${email.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyText }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSendError(data.error ?? 'Failed to send')
      } else {
        setSent(true)
        onUpdate({ ...email, status: 'replied', resolved: true, replyText })
        onRefresh()
      }
    } catch (err: any) {
      setSendError(err.message)
    } finally {
      setSending(false)
    }
  }

  const isNeedsReview = email.status === 'needs_review' && !sent

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-bold">Email Details</h3>
            <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-md" title={email.subject}>
              {email.subject}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground rounded-lg p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs mb-0.5">From</span>
              <span className="font-medium">{email.fromName ?? email.fromEmail}</span>
              {email.fromName && <div className="text-xs text-muted-foreground">{email.fromEmail}</div>}
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-0.5">Category</span>
              <span className="font-medium">{email.category ?? 'Uncategorised'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-0.5">Status</span>
              {statusBadge(sent ? 'replied' : email.status, sent || email.resolved, email.escalatedToHuman)}
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-0.5">Sentiment</span>
              {sentimentBadge(email.sentiment)}
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-0.5">Received</span>
              <span className="font-medium">
                {new Date(email.receivedAt).toLocaleString('en-GB', {
                  weekday: 'short', day: 'numeric', month: 'short',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
            {email.replySentAt && (
              <div>
                <span className="text-muted-foreground block text-xs mb-0.5">Replied At</span>
                <span className="font-medium">
                  {new Date(email.replySentAt).toLocaleString('en-GB', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>

          {/* AI Summary */}
          {email.aiSummary && (
            <div>
              <h4 className="text-sm font-semibold mb-1.5">AI Summary</h4>
              <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">{email.aiSummary}</p>
            </div>
          )}

          {/* Reply Sent (already handled) */}
          {(email.replyText || sent) && !isNeedsReview && (
            <div>
              <h4 className="text-sm font-semibold mb-1.5 flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5 text-emerald-500" />
                Reply Sent
              </h4>
              <pre className="text-xs text-muted-foreground bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 whitespace-pre-wrap">
                {email.replyText ?? replyText}
              </pre>
            </div>
          )}

          {/* Review & Reply Section */}
          {isNeedsReview && (
            <div className="space-y-3">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  ⚡ This email needs human review
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  The AI flagged this as requiring human attention. Review the draft reply below, edit if needed, then send.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-1.5">Draft Reply</h4>
                <textarea
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-mono min-h-[200px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Enter reply text..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be sent from support@parkbunny.app. Edit freely before sending.
                </p>
              </div>

              {sendError && (
                <p className="text-sm text-red-600">{sendError}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSendReply}
                  disabled={sending || !replyText.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {sending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Send Reply
                </button>
                <button
                  onClick={onClose}
                  className="inline-flex items-center rounded-lg border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {!isNeedsReview && !email.replyText && !sent && (
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              No reply sent yet for this email.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Stat Card ──────────────────────────────────────────────────────────────────

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
