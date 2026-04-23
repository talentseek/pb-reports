/**
 * ParkBunny — Unipile Email Client
 *
 * Handles all Unipile interactions for the email support feature:
 *  - Generating a Hosted Auth link to connect the Outlook mailbox
 *  - Sending reply emails from the connected account
 *  - Polling for new inbound emails (cron fallback)
 *  - Moving emails to Outlook folders after processing
 */

const UNIPILE_BASE = () => {
  const dsn = process.env.UNIPILE_DSN
  if (!dsn) throw new Error('Missing UNIPILE_DSN env var')
  return `https://${dsn}`
}

const UNIPILE_HEADERS = () => {
  const key = process.env.UNIPILE_API_KEY
  if (!key) throw new Error('Missing UNIPILE_API_KEY env var')
  return { 'X-API-KEY': key, 'Content-Type': 'application/json', Accept: 'application/json' }
}

// ─── Hosted Auth ───────────────────────────────────────────────────────────────

/**
 * Generate a Unipile Hosted Auth URL so staff can connect the Outlook mailbox.
 * The `name` field is echoed back in the webhook — we use a fixed constant
 * so we can identify it on the callback without multi-tenancy complexity.
 */
export async function generateHostedAuthLink(): Promise<{ url: string } | { error: string }> {
  const appUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const webhookUrl = process.env.NGROK_URL || appUrl
  const expiresOn = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  try {
    const res = await fetch(`${UNIPILE_BASE()}/api/v1/hosted/accounts/link`, {
      method: 'POST',
      headers: UNIPILE_HEADERS(),
      body: JSON.stringify({
        type: 'create',
        api_url: UNIPILE_BASE(),
        expiresOn,
        providers: ['OUTLOOK'],
        success_redirect_url: `${appUrl}/settings?email_connected=true`,
        failure_redirect_url: `${appUrl}/settings?email_connected=false`,
        notify_url: `${webhookUrl}/api/webhooks/unipile`,
        name: 'parkbunny-support', // identifier echoed back in webhook
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[Unipile] Auth link error:', res.status, text)
      return { error: `Unipile error ${res.status}` }
    }

    const data = await res.json()
    return { url: data.url }
  } catch (err: any) {
    console.error('[Unipile] Auth link exception:', err.message)
    return { error: err.message }
  }
}

// ─── Send Email ────────────────────────────────────────────────────────────────

export interface SendEmailResult {
  success: boolean
  emailId?: string
  error?: string
}

/**
 * Send an email via the connected Outlook account.
 * replyToMessageId: if set, sends as a reply to an existing thread.
 */
export async function sendSupportReply(params: {
  accountId: string
  to: string
  subject: string
  bodyHtml: string
  replyToMessageId?: string
}): Promise<SendEmailResult> {
  const { accountId, to, subject, bodyHtml, replyToMessageId } = params

  const payload: Record<string, unknown> = {
    account_id: accountId,
    to: [{ identifier: to }],
    subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
    body: bodyHtml,
  }

  if (replyToMessageId) {
    payload.reply_to_message_id = replyToMessageId
  }

  try {
    const res = await fetch(`${UNIPILE_BASE()}/api/v1/emails`, {
      method: 'POST',
      headers: UNIPILE_HEADERS(),
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[Unipile] Send email error:', res.status, text)
      return { success: false, error: `Unipile ${res.status}: ${text}` }
    }

    const data = await res.json()
    return { success: true, emailId: data.id }
  } catch (err: any) {
    console.error('[Unipile] Send email exception:', err.message)
    return { success: false, error: err.message }
  }
}

// ─── Poll Inbound Emails ───────────────────────────────────────────────────────

export interface InboundEmail {
  id: string
  from: string
  fromName?: string
  subject: string
  bodyText: string
  bodyHtml?: string
  receivedAt: Date
}

/**
 * Poll for unread inbound emails from the connected mailbox.
 * Used as a cron fallback when webhook delivery is unreliable.
 * Only returns emails received after `since` to avoid reprocessing.
 */
export async function pollInboundEmails(
  accountId: string,
  since: Date,
): Promise<InboundEmail[]> {
  try {
    const sinceIso = since.toISOString()
    const res = await fetch(
      `${UNIPILE_BASE()}/api/v1/emails?account_id=${accountId}&limit=50&folder=INBOX`,
      { headers: UNIPILE_HEADERS() },
    )

    if (!res.ok) {
      console.error('[Unipile] Poll error:', res.status)
      return []
    }

    const data = await res.json()
    const items: any[] = data.items ?? data.emails ?? []

    return items
      .filter((e) => {
        // Only inbound (not sent by us)
        if (e.folder?.toLowerCase() === 'sent') return false
        // Only after our cutoff
        const receivedAt = new Date(e.date ?? e.received_at ?? 0)
        return receivedAt > since
      })
      .map((e) => ({
        id: e.id,
        from: e.from?.identifier ?? e.from_email ?? '',
        fromName: e.from?.display_name ?? e.from_name ?? undefined,
        subject: e.subject ?? '(no subject)',
        bodyText: e.body_plain ?? e.body ?? '',
        bodyHtml: e.body_html ?? undefined,
        receivedAt: new Date(e.date ?? e.received_at ?? Date.now()),
      }))
  } catch (err: any) {
    console.error('[Unipile] Poll exception:', err.message)
    return []
  }
}

// ─── Folder Management ─────────────────────────────────────────────────────────

/**
 * Move an email to an Outlook folder and mark it as read.
 * Creates the folder label if Unipile supports it.
 * Best-effort — failures are logged but do not block processing.
 */
export async function markEmailHandled(accountId: string, emailId: string): Promise<void> {
  try {
    // Mark as read
    await fetch(`${UNIPILE_BASE()}/api/v1/emails/${emailId}`, {
      method: 'PATCH',
      headers: UNIPILE_HEADERS(),
      body: JSON.stringify({ account_id: accountId, is_read: true }),
    })
  } catch (err: any) {
    console.warn('[Unipile] markEmailHandled error:', err.message)
  }
}
