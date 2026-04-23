'use client'

import { useState, useEffect } from 'react'
import { Mail, CheckCircle2, AlertCircle, Loader2, Trash2, ExternalLink } from 'lucide-react'

interface Integration {
  id: string
  provider: string
  unipileAccountId: string
  emailAddress: string | null
  connectedAt: string
}

export default function EmailConnectionCard() {
  const [integration, setIntegration] = useState<Integration | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
  }, [])

  async function fetchStatus() {
    try {
      const res = await fetch('/api/settings/email-integration')
      if (res.ok) {
        const data = await res.json()
        setIntegration(data.integration)
      }
    } catch (err) {
      console.error('Failed to fetch integration status')
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    setConnecting(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/email-integration', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Failed to generate connection link')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect the support email account? Auto-replies will stop immediately.')) return
    setDisconnecting(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/email-integration', { method: 'DELETE' })
      if (res.ok) {
        setIntegration(null)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Failed to disconnect')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6 flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Checking connection status…</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-2">
            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Microsoft Outlook</h3>
            <p className="text-xs text-muted-foreground">
              {integration
                ? integration.emailAddress ?? 'Connected'
                : 'Not connected'}
            </p>
          </div>
        </div>

        {integration ? (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">Connected</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Disconnected</span>
          </div>
        )}
      </div>

      {integration && (
        <div className="rounded-lg bg-muted/50 px-4 py-3 text-xs text-muted-foreground space-y-1">
          <p>✅ AI is monitoring this inbox and auto-replying to resolved queries.</p>
          <p>🔴 Unresolved emails are flagged in the support dashboard for manual review.</p>
          <p className="pt-1 text-[11px]">
            Connected {new Date(integration.connectedAt).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
      )}

      {!integration && (
        <p className="text-xs text-muted-foreground">
          Connect the Park Bunny support inbox to enable AI-powered email triage and auto-replies from{' '}
          <span className="font-medium">support@parkbunny.app</span>.
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex gap-2">
        {!integration ? (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {connecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ExternalLink className="h-3.5 w-3.5" />
            )}
            Connect Outlook Account
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-60 transition-colors"
          >
            {disconnecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Disconnect
          </button>
        )}
      </div>
    </div>
  )
}
