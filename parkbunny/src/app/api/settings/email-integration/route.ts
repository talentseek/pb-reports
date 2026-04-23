import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { generateHostedAuthLink } from '@/lib/unipile-email'

/**
 * GET /api/settings/email-integration
 * Returns the current email integration status.
 */
export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const integration = await prisma.emailIntegration.findFirst({
    orderBy: { connectedAt: 'desc' },
  })

  return NextResponse.json({ integration: integration ?? null })
}

/**
 * DELETE /api/settings/email-integration
 * Disconnects the Outlook account — removes from DB (and optionally from Unipile).
 */
export async function DELETE() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const integration = await prisma.emailIntegration.findFirst()
  if (!integration) return NextResponse.json({ error: 'No integration found' }, { status: 404 })

  // Best-effort: delete from Unipile
  try {
    const dsn = process.env.UNIPILE_DSN
    const key = process.env.UNIPILE_API_KEY
    if (dsn && key) {
      await fetch(`https://${dsn}/api/v1/accounts/${integration.unipileAccountId}`, {
        method: 'DELETE',
        headers: { 'X-API-KEY': key },
      })
    }
  } catch (err: any) {
    console.warn('[EmailIntegration] Unipile delete failed:', err.message)
  }

  await prisma.emailIntegration.delete({ where: { id: integration.id } })
  return NextResponse.json({ success: true })
}

/**
 * POST /api/settings/email-integration/connect
 * Generates a Unipile Hosted Auth URL and redirects the user.
 */
export async function POST() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await generateHostedAuthLink()

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ url: result.url })
}
