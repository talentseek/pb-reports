import prisma from '@/lib/db'

/**
 * VAPI webhook endpoint for INBOUND customer support calls.
 * Separate from the outbound sales webhook at /api/webhooks/vapi/route.ts.
 *
 * PUBLIC (no Clerk auth) — Vapi sends events server-to-server.
 */
export async function POST(req: Request) {
  const body = await req.json()
  const messageType = body?.message?.type

  try {
    switch (messageType) {
      case 'status-update':
        await handleStatusUpdate(body.message)
        break
      case 'end-of-call-report':
        await handleEndOfCallReport(body.message)
        break
      default:
        break
    }
  } catch (err) {
    console.error('Support webhook error:', err)
  }

  return new Response('OK', { status: 200 })
}

async function handleStatusUpdate(message: any) {
  const callId = message?.call?.id
  if (!callId) return

  const status = message?.status
  const callerNumber = message?.call?.customer?.number ?? null

  if (status === 'in-progress') {
    const existing = await prisma.supportCall.findUnique({ where: { vapiCallId: callId } })

    if (!existing) {
      await prisma.supportCall.create({
        data: {
          vapiCallId: callId,
          callerNumber,
          status: 'in_progress',
        },
      })
    }
  }
}

async function handleEndOfCallReport(message: any) {
  const callId = message?.call?.id
  if (!callId) return

  const structured = message?.analysis?.structuredData ?? {}
  const summary = message?.analysis?.summary ?? message?.summary ?? null
  const transcript = message?.transcript ?? null
  const recordingUrl = message?.recordingUrl ?? null
  const duration = message?.call?.duration ? Math.round(message.call.duration) : null

  const data = {
    status: structured.needs_human_followup ? 'transferred' : 'completed',
    category: structured.call_category ?? null,
    questionsAsked: structured.questions_asked ?? null,
    summary,
    transcript,
    recordingUrl,
    duration,
    resolved: structured.resolved ?? false,
    escalatedToHuman: structured.needs_human_followup ?? false,
    callerSentiment: structured.caller_sentiment ?? null,
    callerName: structured.caller_name ?? null,
    callerEmail: structured.caller_email ?? null,
  }

  const existing = await prisma.supportCall.findUnique({ where: { vapiCallId: callId } })

  if (existing) {
    await prisma.supportCall.update({ where: { vapiCallId: callId }, data })
  } else {
    await prisma.supportCall.create({
      data: {
        vapiCallId: callId,
        callerNumber: message?.call?.customer?.number ?? null,
        ...data,
      },
    })
  }
}
