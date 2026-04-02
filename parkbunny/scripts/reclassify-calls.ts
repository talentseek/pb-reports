import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()
const VAPI_KEY = process.env.VAPI_PRIVATE_API_KEY!
const CAMPAIGN_ID = 'cmnee2bsg0001sbmz08x8v6ph'

async function main() {
  const cbs = await p.campaignBusiness.findMany({
    where: { campaignId: CAMPAIGN_ID, vapiCallId: { not: null } },
    select: { id: true, vapiCallId: true, callStatus: true },
  })
  console.log('Re-classifying ' + cbs.length + ' calls...')
  let reclassified = 0

  for (const cb of cbs) {
    const res = await fetch('https://api.vapi.ai/call/' + cb.vapiCallId, {
      headers: { Authorization: 'Bearer ' + VAPI_KEY },
    })
    const d = await res.json()
    const endedReason = d.endedReason || null
    const summary = d.analysis?.summary || ''
    let newStatus = cb.callStatus

    if (cb.callStatus === 'GATEKEEPER_BLOCKED') {
      const isIVR =
        endedReason === 'max-duration-reached' ||
        endedReason === 'silence-timed-out' ||
        /automated|menu loop|automated system|ivr|press \d/i.test(summary)
      if (isIVR) newStatus = 'IVR_BLOCKED'
    }

    if (cb.callStatus === 'FAILED' && endedReason === 'customer-ended-call') {
      newStatus = 'NOT_INTERESTED'
    }

    if (newStatus !== cb.callStatus) {
      await p.campaignBusiness.update({ where: { id: cb.id }, data: { callStatus: newStatus, endedReason } })
      reclassified++
      console.log('  ' + cb.callStatus + ' -> ' + newStatus + ' (' + endedReason + ')')
    } else {
      await p.campaignBusiness.update({ where: { id: cb.id }, data: { endedReason } })
    }
    await new Promise(r => setTimeout(r, 100))
  }

  console.log('Done. Reclassified: ' + reclassified)
}

main().catch(console.error).finally(() => p.$disconnect())
