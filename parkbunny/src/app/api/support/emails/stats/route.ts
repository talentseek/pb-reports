import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/db'

/**
 * GET /api/support/emails/stats
 * Aggregated stats for the email support dashboard.
 */
export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 7)

  const [
    totalEmails,
    todayEmails,
    resolvedEmails,
    escalatedEmails,
    needsReviewEmails,
    categoryBreakdown,
    sentimentBreakdown,
    recentEmails,
  ] = await Promise.all([
    prisma.supportEmail.count(),
    prisma.supportEmail.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.supportEmail.count({ where: { resolved: true } }),
    prisma.supportEmail.count({ where: { escalatedToHuman: true } }),
    prisma.supportEmail.count({ where: { status: 'needs_review' } }),
    prisma.supportEmail.groupBy({
      by: ['category'],
      _count: true,
      where: { createdAt: { gte: weekStart }, category: { not: null } },
      orderBy: { _count: { category: 'desc' } },
    }),
    prisma.supportEmail.groupBy({
      by: ['sentiment'],
      _count: true,
      where: { sentiment: { not: null } },
    }),
    prisma.supportEmail.findMany({
      orderBy: { receivedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        fromEmail: true,
        fromName: true,
        subject: true,
        receivedAt: true,
        status: true,
        category: true,
        resolved: true,
        sentiment: true,
        aiSummary: true,
      },
    }),
  ])

  const resolutionRate = totalEmails > 0 ? Math.round((resolvedEmails / totalEmails) * 100) : 0
  const escalationRate = totalEmails > 0 ? Math.round((escalatedEmails / totalEmails) * 100) : 0

  return NextResponse.json({
    overview: {
      totalEmails,
      todayEmails,
      resolvedEmails,
      escalatedEmails,
      needsReviewEmails,
      resolutionRate,
      escalationRate,
    },
    categoryBreakdown: categoryBreakdown.map((c) => ({
      category: c.category ?? 'Uncategorised',
      count: c._count,
    })),
    sentimentBreakdown: sentimentBreakdown.map((s) => ({
      sentiment: s.sentiment ?? 'unknown',
      count: s._count,
    })),
    recentEmails,
  })
}
