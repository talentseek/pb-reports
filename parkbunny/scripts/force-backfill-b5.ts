/**
 * Force-backfill ALL B5 campaign calls by pulling reports from VAPI API.
 * This handles cases where webhook was missed due to vapiCallId overwrites.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { processCallResult } from '../src/lib/voice-agent'

const prisma = new PrismaClient()
const VAPI_KEY = process.env.VAPI_PRIVATE_API_KEY!
const CAMPAIGN_ID = 'cmnhd59hu0001sb6tcwyjymc9'

async function main() {
  const calls = await prisma.campaignBusiness.findMany({
    where: {
      campaignId: CAMPAIGN_ID,
      vapiCallId: { not: null },
      callSummary: null,
    },
    select: { id: true, vapiCallId: true },
  })

  console.log('Force-backfilling ' + calls.length + ' calls...')
  let updated = 0, running = 0, errors = 0

  for (const cb of calls) {
    try {
      const res = await fetch('https://api.vapi.ai/call/' + cb.vapiCallId, {
        headers: { Authorization: 'Bearer ' + VAPI_KEY },
      })
      const data = await res.json()

      if (data.status !== 'ended') {
        running++
        continue
      }

      const result = processCallResult(data)

      await prisma.campaignBusiness.update({
        where: { id: cb.id },
        data: {
          callStatus: result.callStatus,
          callSummary: result.callSummary,
          transcript: result.transcript,
          recordingUrl: result.recordingUrl,
          callDuration: result.callDuration,
          extractedName: result.extractedName,
          extractedEmail: result.extractedEmail,
          extractedPhone: result.extractedPhone,
          callbackTime: result.callbackTime,
          endedReason: result.endedReason,
        },
      })

      updated++
      const icon = result.callStatus === 'LEAD_CAPTURED' ? '🎯' :
                   result.callStatus === 'NOT_INTERESTED' ? '❌' :
                   result.callStatus === 'VOICEMAIL' ? '📞' :
                   result.callStatus === 'NO_ANSWER' ? '📵' :
                   result.callStatus === 'IVR_BLOCKED' ? '🤖' : '•'
      const extra = result.extractedEmail ? ' <' + result.extractedEmail + '>' : ''
      console.log('  ' + icon + ' ' + result.callStatus + extra)

    } catch (err) {
      errors++
      console.log('  ⚠️  Error for ' + cb.vapiCallId)
    }

    await new Promise(r => setTimeout(r, 150))
  }

  console.log('')
  console.log('Done: ' + updated + ' updated, ' + running + ' still running, ' + errors + ' errors')
  
  // Show final stats
  const stats = await prisma.campaignBusiness.groupBy({
    by: ['callStatus'],
    where: { campaignId: CAMPAIGN_ID },
    _count: true,
    orderBy: { _count: { callStatus: 'desc' } },
  })
  console.log('')
  console.log('=== FINAL B5 STATUS ===')
  stats.forEach(r => console.log('  ' + r.callStatus.padEnd(20) + r._count))

  // Check for leads
  const leads = await prisma.campaignBusiness.findMany({
    where: { campaignId: CAMPAIGN_ID, callStatus: { in: ['LEAD_CAPTURED', 'CALLBACK_BOOKED'] } },
    select: { extractedName: true, extractedEmail: true, reportLocationPlace: { select: { place: { select: { name: true } } } } },
  })
  if (leads.length > 0) {
    console.log('')
    console.log('=== LEADS ===')
    leads.forEach(l => console.log('  ' + l.reportLocationPlace.place.name + ' | ' + (l.extractedName || '?') + ' | ' + (l.extractedEmail || '?')))
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
