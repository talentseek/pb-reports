/**
 * Pre-flight cleanup: mark IVR-heavy businesses and national prefixes
 * as IVR_BLOCKED so they won't be called in the retry.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

const B5_CAMPAIGN_ID = 'cmnhd59hu0001sb6tcwyjymc9'

const IVR_PREFIXES = ['0330', '0333', '0343', '0800', '0845', '0345', '0844', '0870']
const IVR_HEAVY_TYPES = [
  'bank', 'pharmacy', 'car_dealer', 'hospital', 'doctor', 'dentist',
  'insurance_agency', 'department_store', 'post_office', 'supermarket',
]

async function main() {
  const callable = await p.campaignBusiness.findMany({
    where: {
      campaignId: B5_CAMPAIGN_ID,
      callStatus: { in: ['VOICEMAIL', 'NO_ANSWER', 'CALLBACK_BOOKED'] },
      callAttempts: { lt: 3 },
    },
    include: { reportLocationPlace: { include: { place: { select: { name: true, phone: true, types: true } } } } }
  })

  let blocked = 0

  for (const b of callable) {
    const phone = (b.reportLocationPlace.place.phone || '').replace(/\s/g, '')
    const types = b.reportLocationPlace.place.types.toLowerCase()

    const isIvrPrefix = IVR_PREFIXES.some(pfx => phone.startsWith(pfx))
    const isIvrType = IVR_HEAVY_TYPES.some(t => types.includes(t))

    if (isIvrPrefix || isIvrType) {
      const reason = isIvrPrefix ? 'IVR prefix (' + phone.slice(0, 4) + ')' : 'IVR-heavy type'
      await p.campaignBusiness.update({
        where: { id: b.id },
        data: { callStatus: 'IVR_BLOCKED' },
      })
      blocked++
      console.log('🚫 Blocked: ' + b.reportLocationPlace.place.name + ' — ' + reason)
    }
  }

  console.log('')
  console.log('Blocked ' + blocked + ' businesses. Remaining callable: ' + (callable.length - blocked))
  await p.$disconnect()
}
main()
