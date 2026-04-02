/**
 * Retry failed calls from B5 campaign (name too long errors).
 * Usage: npx tsx scripts/retry-failed-b5.ts
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { formatPhoneE164, dispatchCall } from '../src/lib/voice-agent'

const prisma = new PrismaClient()
const CAMPAIGN_ID = 'cmnhd59hu0001sb6tcwyjymc9'
const CARPARK_NAME = 'Arcadian'
const VAPI_PHONE_NUM_ID = '1ef87949-bce1-418d-abb4-107a6adf8494'
const VAPI_ASSISTANT_ID = '501d2196-59fe-4860-9f88-749dca9ac096'

async function main() {
  const failed = await prisma.campaignBusiness.findMany({
    where: { campaignId: CAMPAIGN_ID, callStatus: 'FAILED' },
    include: { reportLocationPlace: { include: { place: true } } },
  })
  console.log('Retrying ' + failed.length + ' failed calls...')

  let ok = 0, err = 0
  const WAVE_SIZE = 5
  for (let i = 0; i < failed.length; i++) {
    const cb = failed[i]
    const result = await dispatchCall(
      cb as any,
      CARPARK_NAME,
      { vapiAssistantId: VAPI_ASSISTANT_ID, vapiPhoneNumId: VAPI_PHONE_NUM_ID },
    )
    if (result.success) {
      await prisma.campaignBusiness.update({
        where: { id: cb.id },
        data: {
          callStatus: 'IN_PROGRESS',
          vapiCallId: result.vapiCallId,
          callAttempts: { increment: 1 },
          lastCallAt: new Date(),
        },
      })
      ok++
      console.log('  ✅ ' + cb.reportLocationPlace.place.name.slice(0, 40))
    } else {
      err++
      console.log('  ❌ ' + cb.reportLocationPlace.place.name.slice(0, 40) + ' — ' + result.error)
    }
    // Wave gap every 5 calls
    if ((i + 1) % WAVE_SIZE === 0 && i < failed.length - 1) {
      console.log('  ⏳ Waiting 60s before next batch...')
      await new Promise(r => setTimeout(r, 60_000))
    } else {
      await new Promise(r => setTimeout(r, 3000))
    }
  }
  console.log('\nDone: ' + ok + ' retried, ' + err + ' still failed')
}

main().catch(console.error).finally(() => prisma.$disconnect())
