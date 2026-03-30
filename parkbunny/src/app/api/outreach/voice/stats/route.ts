import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/db'

/**
 * GET /api/outreach/voice/stats
 * Aggregated voice outreach analytics — mirrors the quality of /api/support/stats.
 * 
 * Optional query params:
 *   ?campaignId=xxx — stats for a specific campaign
 *   ?locationId=xxx — stats for a specific location
 *   (no params) — global stats across all voice campaigns
 */
export async function GET(request: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get('campaignId')
  const locationId = searchParams.get('locationId')

  // Build filter
  const campaignWhere: any = {}
  if (campaignId) {
    campaignWhere.campaignId = campaignId
  } else if (locationId) {
    const campaigns = await prisma.campaign.findMany({
      where: { locationId },
      select: { id: true },
    })
    campaignWhere.campaignId = { in: campaigns.map(c => c.id) }
  }

  // Run all queries in parallel
  const [
    statusBreakdown,
    totalCalls,
    avgDuration,
    sentimentBreakdown,
    recentCalls,
    campaignSummaries,
    todaysCalls,
    weeklyTrend,
  ] = await Promise.all([
    // 1. Call outcome distribution
    prisma.campaignBusiness.groupBy({
      by: ['callStatus'],
      where: { ...campaignWhere, callStatus: { not: 'PENDING' } },
      _count: true,
    }),

    // 2. Total calls made (non-pending)
    prisma.campaignBusiness.count({
      where: {
        ...campaignWhere,
        callStatus: { notIn: ['PENDING', 'QUEUED', 'CTPS_BLOCKED', 'INVALID_NUMBER'] },
      },
    }),

    // 3. Average call duration
    prisma.campaignBusiness.aggregate({
      where: { ...campaignWhere, callDuration: { not: null } },
      _avg: { callDuration: true },
    }),

    // 4. Sentiment from extracted structured data (via callSummary proxy - positive/negative keywords)
    // We extract sentiment via the webhook's structured data, stored in callSummary
    prisma.campaignBusiness.findMany({
      where: {
        ...campaignWhere,
        callStatus: { notIn: ['PENDING', 'QUEUED', 'CTPS_BLOCKED', 'INVALID_NUMBER'] },
      },
      select: { callStatus: true, callDuration: true },
    }),

    // 5. Recent call activity (last 20)
    prisma.campaignBusiness.findMany({
      where: {
        ...campaignWhere,
        lastCallAt: { not: null },
      },
      orderBy: { lastCallAt: 'desc' },
      take: 20,
      include: {
        reportLocationPlace: {
          include: { place: { select: { name: true, phone: true } } },
        },
        campaign: { select: { name: true, carparkName: true, postcode: true } },
      },
    }),

    // 6. Campaign summaries
    prisma.campaign.findMany({
      where: locationId ? { locationId } : campaignId ? { id: campaignId } : {},
      select: {
        id: true,
        name: true,
        status: true,
        carparkName: true,
        postcode: true,
        createdAt: true,
        _count: { select: { businesses: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),

    // 7. Today's calls
    prisma.campaignBusiness.count({
      where: {
        ...campaignWhere,
        lastCallAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),

    // 8. Daily call counts for last 7 days
    (async () => {
      const days: { date: string; count: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date()
        dayStart.setDate(dayStart.getDate() - i)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(dayStart)
        dayEnd.setDate(dayEnd.getDate() + 1)

        const count = await prisma.campaignBusiness.count({
          where: {
            ...campaignWhere,
            lastCallAt: { gte: dayStart, lt: dayEnd },
          },
        })
        days.push({
          date: dayStart.toISOString().split('T')[0],
          count,
        })
      }
      return days
    })(),
  ])

  // Compute outcome counts
  const outcomes: Record<string, number> = {}
  for (const row of statusBreakdown) {
    outcomes[row.callStatus] = row._count
  }

  const leadsCaptured = outcomes['LEAD_CAPTURED'] ?? 0
  const callbacksBooked = outcomes['CALLBACK_BOOKED'] ?? 0
  const notInterested = outcomes['NOT_INTERESTED'] ?? 0
  const voicemail = outcomes['VOICEMAIL'] ?? 0
  const gatekeeperBlocked = outcomes['GATEKEEPER_BLOCKED'] ?? 0
  const noAnswer = outcomes['NO_ANSWER'] ?? 0
  const invalidNumber = outcomes['INVALID_NUMBER'] ?? 0
  const failed = outcomes['FAILED'] ?? 0
  const ctpsBlocked = outcomes['CTPS_BLOCKED'] ?? 0

  // Conversion rate: leads / total calls made
  const conversionRate = totalCalls > 0
    ? Math.round((leadsCaptured / totalCalls) * 100)
    : 0

  // Contact rate: leads + callbacks / total calls
  const contactRate = totalCalls > 0
    ? Math.round(((leadsCaptured + callbacksBooked) / totalCalls) * 100)
    : 0

  // Rejection rate
  const rejectionRate = totalCalls > 0
    ? Math.round((notInterested / totalCalls) * 100)
    : 0

  // Compute average call duration for successful calls
  const successfulCalls = sentimentBreakdown.filter(
    c => c.callDuration && c.callDuration > 0
  )
  const avgSuccessDuration = successfulCalls.length > 0
    ? Math.round(successfulCalls.reduce((s, c) => s + (c.callDuration ?? 0), 0) / successfulCalls.length)
    : 0

  return NextResponse.json({
    overview: {
      totalCalls,
      todaysCalls: todaysCalls,
      leadsCaptured,
      callbacksBooked,
      conversionRate,
      contactRate,
      rejectionRate,
      avgDuration: Math.round(avgDuration._avg.callDuration ?? 0),
      avgSuccessDuration,
    },
    outcomeBreakdown: [
      { outcome: 'Lead Captured', count: leadsCaptured, color: 'emerald' },
      { outcome: 'Callback Booked', count: callbacksBooked, color: 'blue' },
      { outcome: 'Not Interested', count: notInterested, color: 'red' },
      { outcome: 'Voicemail', count: voicemail, color: 'amber' },
      { outcome: 'Gatekeeper Blocked', count: gatekeeperBlocked, color: 'rose' },
      { outcome: 'No Answer', count: noAnswer, color: 'slate' },
      { outcome: 'Invalid Number', count: invalidNumber, color: 'gray' },
      { outcome: 'Failed', count: failed, color: 'gray' },
      { outcome: 'CTPS Blocked', count: ctpsBlocked, color: 'gray' },
    ].filter(o => o.count > 0),
    weeklyTrend,
    campaigns: campaignSummaries.map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
      carparkName: c.carparkName,
      postcode: c.postcode,
      businessCount: c._count.businesses,
      createdAt: c.createdAt,
    })),
    recentCalls: recentCalls.map(cb => ({
      id: cb.id,
      businessName: cb.reportLocationPlace.place.name,
      phone: cb.reportLocationPlace.place.phone,
      campaignName: cb.campaign.name,
      carparkName: cb.campaign.carparkName,
      callStatus: cb.callStatus,
      callAttempts: cb.callAttempts,
      callDuration: cb.callDuration,
      callSummary: cb.callSummary,
      transcript: cb.transcript,
      recordingUrl: cb.recordingUrl,
      extractedName: cb.extractedName,
      extractedEmail: cb.extractedEmail,
      extractedPhone: cb.extractedPhone,
      callbackTime: cb.callbackTime,
      lastCallAt: cb.lastCallAt,
    })),
  })
}
