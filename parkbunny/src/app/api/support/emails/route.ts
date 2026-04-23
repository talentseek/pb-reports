import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/db'

/**
 * GET /api/support/emails
 * Paginated list of inbound support emails with filters.
 */
export async function GET(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10)))
  const category = url.searchParams.get('category') ?? undefined
  const status = url.searchParams.get('status') ?? undefined
  const resolved = url.searchParams.get('resolved')
  const daysBack = parseInt(url.searchParams.get('days') ?? '30', 10)

  const dateFilter = new Date()
  dateFilter.setDate(dateFilter.getDate() - daysBack)

  const where: any = { createdAt: { gte: dateFilter } }
  if (category) where.category = category
  if (status) where.status = status
  if (resolved !== null && resolved !== undefined) {
    where.resolved = resolved === 'true'
  }

  const [emails, total] = await Promise.all([
    prisma.supportEmail.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        fromEmail: true,
        fromName: true,
        subject: true,
        receivedAt: true,
        status: true,
        category: true,
        resolved: true,
        escalatedToHuman: true,
        sentiment: true,
        aiSummary: true,
        suggestedReply: true,
        replyText: true,
        replySentAt: true,
        createdAt: true,
      },
    }),
    prisma.supportEmail.count({ where }),
  ])

  return NextResponse.json({
    emails,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
