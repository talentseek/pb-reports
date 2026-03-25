import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/db'

/**
 * GET /api/support/stats
 * Aggregated stats for the support dashboard.
 */
export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 7)

  const [
    totalCalls,
    todayCalls,
    resolvedCalls,
    escalatedCalls,
    avgDuration,
    categoryBreakdown,
    sentimentBreakdown,
    recentCalls,
  ] = await Promise.all([
    prisma.supportCall.count(),
    prisma.supportCall.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.supportCall.count({ where: { resolved: true } }),
    prisma.supportCall.count({ where: { escalatedToHuman: true } }),
    prisma.supportCall.aggregate({ _avg: { duration: true } }),
    prisma.supportCall.groupBy({
      by: ['category'],
      _count: true,
      where: { createdAt: { gte: weekStart }, category: { not: null } },
      orderBy: { _count: { category: 'desc' } },
    }),
    prisma.supportCall.groupBy({
      by: ['callerSentiment'],
      _count: true,
      where: { callerSentiment: { not: null } },
    }),
    prisma.supportCall.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  const resolutionRate = totalCalls > 0 ? Math.round((resolvedCalls / totalCalls) * 100) : 0
  const escalationRate = totalCalls > 0 ? Math.round((escalatedCalls / totalCalls) * 100) : 0

  return NextResponse.json({
    overview: {
      totalCalls,
      todayCalls,
      resolvedCalls,
      escalatedCalls,
      resolutionRate,
      escalationRate,
      avgDuration: Math.round(avgDuration._avg.duration ?? 0),
    },
    categoryBreakdown: categoryBreakdown.map((c) => ({
      category: c.category ?? 'Uncategorised',
      count: c._count,
    })),
    sentimentBreakdown: sentimentBreakdown.map((s) => ({
      sentiment: s.callerSentiment ?? 'unknown',
      count: s._count,
    })),
    recentCalls,
  })
}
