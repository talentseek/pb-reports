import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { processInboundEmail } from '@/lib/email-support'

/**
 * Unipile webhook handler for ParkBunny.
 *
 * Handles two event types:
 *  1. CREATION_SUCCESS / RECONNECTED — Outlook account connected
 *  2. message_created — New inbound email received in the support mailbox
 *
 * PUBLIC — no Clerk auth (Unipile fires server-to-server).
 */
export async function POST(req: NextRequest) {
  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  console.log('[Unipile Webhook]', JSON.stringify({ type: payload?.type, event: payload?.event, status: payload?.status }).slice(0, 200))

  try {
    // ── Inbound email event ──────────────────────────────────────────────────
    if (
      payload.event === 'message_created' ||
      payload.type === 'message_created' ||
      payload.event === 'mail_received' ||
      payload.type === 'mail_received'
    ) {
      await handleInboundEmail(payload)
      return NextResponse.json({ received: true })
    }

    // ── Account connected ────────────────────────────────────────────────────
    const { status, account_id, name } = payload

    if (status === 'CREATION_SUCCESS' || status === 'RECONNECTED') {
      if (name !== 'parkbunny-support') {
        // Not our support account — ignore
        return NextResponse.json({ received: true })
      }

      if (!account_id) {
        return NextResponse.json({ error: 'Missing account_id' }, { status: 400 })
      }

      // Fetch the email address from Unipile account details
      let emailAddress: string | null = null
      try {
        const dsn = process.env.UNIPILE_DSN
        const key = process.env.UNIPILE_API_KEY
        if (dsn && key) {
          const res = await fetch(`https://${dsn}/api/v1/accounts/${account_id}`, {
            headers: { 'X-API-KEY': key, Accept: 'application/json' },
          })
          if (res.ok) {
            const data = await res.json()
            emailAddress = data.email ?? data.username ?? null
          }
        }
      } catch (err: any) {
        console.warn('[Unipile Webhook] Could not fetch account details:', err.message)
      }

      // Upsert EmailIntegration
      const existing = await prisma.emailIntegration.findFirst({
        where: { unipileAccountId: account_id },
      })

      if (existing) {
        await prisma.emailIntegration.update({
          where: { id: existing.id },
          data: { emailAddress: emailAddress ?? existing.emailAddress },
        })
      } else {
        await prisma.emailIntegration.create({
          data: {
            provider: 'OUTLOOK',
            unipileAccountId: account_id,
            emailAddress,
          },
        })
      }

      console.log(`[Unipile Webhook] Outlook account connected: ${account_id} (${emailAddress})`)
      return NextResponse.json({ received: true, action: 'connected' })
    }

    // ── Account disconnected ─────────────────────────────────────────────────
    if (
      status === 'ACCOUNT_DELETED' ||
      status === 'SYNC_STOPPED' ||
      status === 'CONNECTION_ERROR'
    ) {
      if (payload.account_id) {
        await prisma.emailIntegration.deleteMany({
          where: { unipileAccountId: payload.account_id },
        })
        console.log(`[Unipile Webhook] Outlook account disconnected: ${payload.account_id}`)
      }
      return NextResponse.json({ received: true, action: 'disconnected' })
    }
  } catch (err: any) {
    console.error('[Unipile Webhook] Error:', err.message)
    // Always return 200 to Unipile so it doesn't retry
  }

  return NextResponse.json({ received: true })
}

export async function GET() {
  return NextResponse.json({ status: 'Unipile webhook active', capabilities: ['account_events', 'email_inbound'] })
}

// ─── Inbound Email Handler ─────────────────────────────────────────────────────

async function handleInboundEmail(payload: any) {
  // Unipile mail_received sends flat keys (no nested data wrapper)
  // Field names match the data[] config we registered via API
  const emailId: string = payload.email_id ?? payload.id ?? ''
  const fromAttendee = payload.from_attendee ?? {}
  const from: string = fromAttendee.identifier ?? fromAttendee.email ?? ''
  const fromName: string | undefined = fromAttendee.display_name ?? fromAttendee.name ?? undefined
  const subject: string = payload.subject ?? '(no subject)'
  const bodyText: string = payload.body_plain ?? payload.body ?? ''
  const bodyHtml: string | undefined = payload.body ?? undefined
  const receivedAt = new Date(payload.date ?? Date.now())
  const accountId: string = payload.account_id ?? ''

  // role = "recipient" means we received it; skip anything we sent
  if (payload.role && payload.role !== 'recipient') {
    console.log(`[Unipile Webhook] Skipping email with role="${payload.role}" (not inbound)`)
    return
  }

  // Skip emails sitting in Sent folder
  const folders: string[] = payload.folders ?? []
  if (folders.some((f: string) => f.toLowerCase().includes('sent'))) {
    console.log('[Unipile Webhook] Skipping email in Sent folder')
    return
  }

  if (!emailId || !from || !accountId) {
    console.warn('[Unipile Webhook] Inbound email missing required fields:', { emailId, from, accountId })
    return
  }

  // Ignore emails sent FROM our own support address (avoid echo loops)
  const integration = await prisma.emailIntegration.findFirst({
    where: { unipileAccountId: accountId },
  })
  const ourEmail = integration?.emailAddress?.toLowerCase()
  if (ourEmail && from.toLowerCase() === ourEmail) {
    console.log('[Unipile Webhook] Ignoring outbound email (from ourselves)')
    return
  }

  // Deduplicate — if already in DB, skip
  const existing = await prisma.supportEmail.findUnique({ where: { unipileEmailId: emailId } })
  if (existing) {
    console.log('[Unipile Webhook] Email already processed:', emailId)
    return
  }

  console.log(`[Unipile Webhook] New inbound support email from ${from}: "${subject}"`)

  // Process asynchronously — return 200 to Unipile immediately
  processInboundEmail(
    { unipileEmailId: emailId, fromEmail: from, fromName, subject, bodyText, bodyHtml, receivedAt },
    accountId,
  ).catch((err) => console.error('[Unipile Webhook] processInboundEmail error:', err.message))
}
