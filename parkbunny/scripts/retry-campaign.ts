/**
 * Retry failed campaign businesses (those still in PENDING status after the first run)
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const VAPI_KEY = process.env.VAPI_PRIVATE_API_KEY!
const ASSISTANT_ID = '501d2196-59fe-4860-9f88-749dca9ac096'
const PHONE_NUMBER_ID = 'c3322c70-c7ce-4d15-a37b-db97b02be42b'
const CAMPAIGN_ID = 'cmnee2bsg0001sbmz08x8v6ph'
const CARPARK_NAME = 'Q Park Birmingham'
const CALL_GAP_MS = 15000  // 15s between retries to avoid concurrency

function validateUKPhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
  if (cleaned.startsWith('+44') && cleaned.length >= 12) return cleaned
  if (cleaned.startsWith('0') && cleaned.length >= 10) return '+44' + cleaned.slice(1)
  if (cleaned.startsWith('44') && cleaned.length >= 11) return '+' + cleaned
  return null
}

async function main() {
  const pending = await prisma.campaignBusiness.findMany({
    where: { campaignId: CAMPAIGN_ID, callStatus: 'PENDING' },
    include: {
      reportLocationPlace: {
        include: { place: { select: { name: true, phone: true } } },
      },
    },
  })

  console.log('🔁 Retrying ' + pending.length + ' failed businesses (15s gap)')
  console.log('═'.repeat(60))

  let called = 0
  let failed = 0

  for (const cb of pending) {
    const phone = cb.reportLocationPlace.place.phone
    if (!phone) continue
    const e164 = validateUKPhone(phone)
    if (!e164) continue

    const businessName = cb.reportLocationPlace.place.name

    try {
      const res = await fetch('https://api.vapi.ai/call/phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + VAPI_KEY,
        },
        body: JSON.stringify({
          assistantId: ASSISTANT_ID,
          phoneNumberId: PHONE_NUMBER_ID,
          customer: { number: e164 },
          assistantOverrides: {
            variableValues: {
              business_name: businessName,
              carpark_name: CARPARK_NAME,
            },
          },
        }),
      })

      const data = await res.json()
      if (res.ok) {
        called++
        await prisma.campaignBusiness.update({
          where: { id: cb.id },
          data: {
            callStatus: 'IN_PROGRESS',
            vapiCallId: data.id,
            callAttempts: 1,
            lastCallAt: new Date(),
          },
        })
        console.log('  ✅ ' + called + '/' + pending.length + ' ' + businessName + ' → ' + e164)
      } else {
        failed++
        console.log('  ❌ ' + businessName + ': ' + (data.message || 'unknown error'))
      }
    } catch (err) {
      failed++
      console.log('  ❌ ' + businessName + ': network error')
    }

    await new Promise(r => setTimeout(r, CALL_GAP_MS))
  }

  console.log('')
  console.log('═'.repeat(60))
  console.log('📊 Retry summary: ' + called + ' called | ' + failed + ' failed')
}

main().catch(console.error).finally(() => prisma.$disconnect())
