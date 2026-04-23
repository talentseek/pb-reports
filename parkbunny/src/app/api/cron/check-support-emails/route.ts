import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { pollInboundEmails } from '@/lib/unipile-email'
import { processInboundEmail } from '@/lib/email-support'

// GET /api/cron/check-support-emails
//
// Fallback cron job — polls Unipile every 15 minutes for any inbound emails
// that may have been missed by the webhook. Configured in vercel.json.
// Vercel Cron schedule: every 15 minutes
export async function GET(req: NextRequest) {
  // Simple cron secret check
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const integration = await prisma.emailIntegration.findFirst()
  if (!integration) {
    return NextResponse.json({ skipped: true, reason: 'No email integration configured' })
  }

  // Poll from last 20 minutes to overlap with 15-minute interval
  const since = new Date(Date.now() - 20 * 60 * 1000)

  const emails = await pollInboundEmails(integration.unipileAccountId, since)

  console.log(`[CronEmailCheck] Found ${emails.length} emails since ${since.toISOString()}`)

  let processed = 0
  let skipped = 0

  for (const email of emails) {
    // Skip if already in DB (webhook already handled it)
    const existing = await prisma.supportEmail.findUnique({
      where: { unipileEmailId: email.id },
    })
    if (existing) {
      skipped++
      continue
    }

    // Ignore emails from our own address
    const ourEmail = integration.emailAddress?.toLowerCase()
    if (ourEmail && email.from.toLowerCase() === ourEmail) {
      skipped++
      continue
    }

    await processInboundEmail(
      {
        unipileEmailId: email.id,
        fromEmail: email.from,
        fromName: email.fromName,
        subject: email.subject,
        bodyText: email.bodyText,
        bodyHtml: email.bodyHtml,
        receivedAt: email.receivedAt,
      },
      integration.unipileAccountId,
    )

    processed++
  }

  return NextResponse.json({ processed, skipped, total: emails.length })
}
