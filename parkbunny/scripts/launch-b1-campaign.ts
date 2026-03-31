/**
 * Launch voice outreach for B1 1QH — Q Park Birmingham
 * Creates a campaign and dispatches calls starting at the scheduled time.
 * 
 * Usage: npx tsx scripts/launch-b1-campaign.ts
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const VAPI_KEY = process.env.VAPI_PRIVATE_API_KEY!
const ASSISTANT_ID = '501d2196-59fe-4860-9f88-749dca9ac096'
const PHONE_NUMBER_ID = 'c3322c70-c7ce-4d15-a37b-db97b02be42b'
const LOCATION_ID = 'cmkf7l4i00003js04ofmbafn2'
const CARPARK_NAME = 'Q Park Birmingham'
const CALL_GAP_MS = 5000  // 5s between each call dispatch

function validateUKPhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
  if (cleaned.startsWith('+44') && cleaned.length >= 12) return cleaned
  if (cleaned.startsWith('0') && cleaned.length >= 10) return '+44' + cleaned.slice(1)
  if (cleaned.startsWith('44') && cleaned.length >= 11) return '+' + cleaned
  return null
}

async function main() {
  // Get all callable businesses for this location
  const places = await prisma.reportLocationPlace.findMany({
    where: { locationId: LOCATION_ID, included: true },
    include: { place: { select: { id: true, name: true, phone: true } } },
  })

  const callable = places.filter(p => p.place.phone && validateUKPhone(p.place.phone))
  console.log('📍 B1 1QH — Q Park Birmingham')
  console.log('   Total businesses: ' + places.length)
  console.log('   Callable (valid phone): ' + callable.length)
  console.log('')

  if (callable.length === 0) {
    console.log('❌ No callable businesses')
    return
  }

  // Check for existing campaigns
  const existingCampaigns = await prisma.campaign.findMany({
    where: { locationId: LOCATION_ID },
    select: { id: true, name: true, status: true },
  })

  if (existingCampaigns.length > 0) {
    console.log('⚠️  Existing campaigns:')
    for (const c of existingCampaigns) {
      console.log('   - ' + c.name + ' (' + c.status + ')')
    }
    console.log('')
  }

  // Create the campaign with ALL callable businesses
  const campaign = await prisma.campaign.create({
    data: {
      name: 'Q Park Birmingham B1 — Voice Outreach',
      locationId: LOCATION_ID,
      postcode: 'B1 1QH',
      carparkName: CARPARK_NAME,
      status: 'CALLING',
      businessType: 'All Categories',
      businesses: {
        create: callable.map(rlp => ({
          reportLocationPlaceId: rlp.id,
          callStatus: 'PENDING',
          callAttempts: 0,
        })),
      },
    },
  })

  // Fetch the created businesses with place data for calling
  const campaignBusinesses = await prisma.campaignBusiness.findMany({
    where: { campaignId: campaign.id },
    include: {
      reportLocationPlace: {
        include: { place: { select: { name: true, phone: true } } },
      },
    },
  })

  console.log('✅ Campaign created: ' + campaign.id)
  console.log('   Name: ' + campaign.name)
  console.log('   Businesses queued: ' + campaignBusinesses.length)
  console.log('')

  // Start calling
  console.log('📞 Starting calls...')
  console.log('═'.repeat(60))

  let called = 0
  let skipped = 0
  let failed = 0

  for (const cb of campaignBusinesses) {
    const phone = cb.reportLocationPlace.place.phone
    if (!phone) { skipped++; continue }

    const e164 = validateUKPhone(phone)
    if (!e164) { skipped++; continue }

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
        console.log('  ✅ ' + called + '/' + callable.length + ' ' + businessName + ' → ' + e164 + ' (Call ID: ' + data.id + ')')
      } else {
        failed++
        console.log('  ❌ ' + businessName + ': ' + JSON.stringify(data).slice(0, 100))
      }
    } catch (err) {
      failed++
      console.log('  ❌ ' + businessName + ': network error')
    }

    // Gap between calls - don't overwhelm
    if (called < callable.length) {
      await new Promise(r => setTimeout(r, CALL_GAP_MS))
    }
  }

  console.log('')
  console.log('═'.repeat(60))
  console.log('📊 Summary: ' + called + ' called | ' + skipped + ' skipped | ' + failed + ' failed')
  console.log('   Campaign ID: ' + campaign.id)
  console.log('   Monitor at: /outreach/campaigns/' + campaign.id)
}

main().catch(console.error).finally(() => prisma.$disconnect())
