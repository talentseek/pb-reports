import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { sendSupportReply, markEmailHandled } from '@/lib/unipile-email'

/**
 * POST /api/support/emails/[id]/reply
 * Staff sends or approves a reply for a flagged email.
 *
 * Body: { replyText?: string } — if omitted, sends the AI-suggested reply.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params
  const body = await req.json().catch(() => ({}))

  const email = await prisma.supportEmail.findUnique({ where: { id } })
  if (!email) return NextResponse.json({ error: 'Email not found' }, { status: 404 })

  if (email.status === 'replied') {
    return NextResponse.json({ error: 'Email already replied' }, { status: 409 })
  }

  // Resolve which reply text to send
  const replyText: string = body.replyText ?? email.suggestedReply ?? ''
  if (!replyText.trim()) {
    return NextResponse.json({ error: 'No reply text provided and no AI suggestion available' }, { status: 400 })
  }

  // Get the connected Outlook account
  const integration = await prisma.emailIntegration.findFirst()
  if (!integration) {
    return NextResponse.json({ error: 'No email integration connected' }, { status: 503 })
  }

  // Send via Unipile
  const result = await sendSupportReply({
    accountId: integration.unipileAccountId,
    to: email.fromEmail,
    subject: email.subject,
    bodyHtml: `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">${replyText.replace(/\n/g, '<br>')}</div>`,
    replyToMessageId: email.unipileEmailId,
  })

  if (!result.success) {
    return NextResponse.json({ error: `Failed to send: ${result.error}` }, { status: 500 })
  }

  // Mark as read in Outlook
  await markEmailHandled(integration.unipileAccountId, email.unipileEmailId)

  // Update DB record
  await prisma.supportEmail.update({
    where: { id },
    data: {
      status: 'replied',
      resolved: true,
      replyText,
      replySentAt: new Date(),
    },
  })

  return NextResponse.json({ success: true })
}
