/**
 * Backfill call results from VAPI API for calls where the webhook was missed.
 * Pulls the call report for each IN_PROGRESS CampaignBusiness and updates the DB.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { processCallResult } from '../src/lib/voice-agent'

const prisma = new PrismaClient()
const VAPI_KEY = process.env.VAPI_PRIVATE_API_KEY!
const CAMPAIGN_ID = 'cmnee2bsg0001sbmz08x8v6ph'

async function main() {
  const pending = await prisma.campaignBusiness.findMany({
    where: { campaignId: CAMPAIGN_ID, callStatus: 'IN_PROGRESS' },
    select: { id: true, vapiCallId: true },
  })

  console.log('🔄 Backfilling ' + pending.length + ' calls from VAPI API...')
  console.log('═'.repeat(60))

  let updated = 0
  let stillRunning = 0
  let noData = 0

  for (const cb of pending) {
    if (!cb.vapiCallId) { noData++; continue }

    try {
      const res = await fetch('https://api.vapi.ai/call/' + cb.vapiCallId, {
        headers: { Authorization: 'Bearer ' + VAPI_KEY },
      })
      const data = await res.json()

      if (data.status !== 'ended') {
        stillRunning++
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
        },
      })

      updated++
      const statusIcon = result.callStatus === 'LEAD_CAPTURED' ? '🎯' :
                         result.callStatus === 'CALLBACK_BOOKED' ? '📅' :
                         result.callStatus === 'NOT_INTERESTED' ? '❌' :
                         result.callStatus === 'VOICEMAIL' ? '📞' :
                         result.callStatus === 'NO_ANSWER' ? '📵' : '•'

      console.log('  ' + statusIcon + ' ' + result.callStatus + (result.extractedName ? ' — ' + result.extractedName : '') + (result.extractedEmail ? ' <' + result.extractedEmail + '>' : ''))

    } catch (err) {
      console.log('  ⚠️  Failed to fetch call ' + cb.vapiCallId)
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200))
  }

  console.log('')
  console.log('═'.repeat(60))
  console.log('📊 Backfill complete: ' + updated + ' updated | ' + stillRunning + ' still running | ' + noData + ' no call ID')
}

main().catch(console.error).finally(() => prisma.$disconnect())
