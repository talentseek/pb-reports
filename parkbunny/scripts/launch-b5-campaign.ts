/**
 * Launch B5 4TD Arcadian Birmingham Campaign
 * 
 * Features:
 * - Wave dispatching: 2 calls per wave, 180s gaps
 * - IVR pre-filter: skips national prefix numbers (0330/0800/0845/0345/0844/0870)
 * - Deduplication: checks if placeId was already called in any campaign
 * - Uses Birmingham local number (0121)
 * 
 * Usage: npx tsx scripts/launch-b5-campaign.ts
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { formatPhoneE164, dispatchCall, checkDuplicateBusiness } from '../src/lib/voice-agent'

const prisma = new PrismaClient()

const REPORT_ID = 'cmn4g86ha0001l4048qk6uins'
const CARPARK_NAME = 'Arcadian'
const CAMPAIGN_NAME = 'B5 4TD — Arcadian Birmingham'
const POSTCODE = 'B5 4TD'

// Birmingham local number
const VAPI_PHONE_NUM_ID = '1ef87949-bce1-418d-abb4-107a6adf8494'
const VAPI_ASSISTANT_ID = '501d2196-59fe-4860-9f88-749dca9ac096'

const WAVE_SIZE = 2
const WAVE_GAP_MS = 180_000 // 180 seconds between waves
const CALL_GAP_MS = 10_000  // 10 seconds between individual calls in a wave

const IVR_PREFIXES = ['0330', '0800', '0845', '0345', '0844', '0870']

// Business types that almost always have IVR — skip to save calls
const IVR_HEAVY_TYPES = [
  'bank',
  'pharmacy',
  'car_dealer',
  'hospital',
  'doctor',
  'dentist',
  'insurance_agency',
  'department_store',
  'post_office',
  'supermarket',
]

function isIvrPrefix(phone: string): boolean {
  const clean = phone.replace(/\s/g, '')
  return IVR_PREFIXES.some(pfx => clean.startsWith(pfx))
}

function isIvrHeavyType(types: string): boolean {
  const typeList = types.toLowerCase().split(',')
  return IVR_HEAVY_TYPES.some(t => typeList.some(bt => bt.trim().includes(t)))
}

async function main() {
  console.log('🚀 Launching B5 4TD Arcadian Campaign')
  console.log('═'.repeat(60))

  // 1. Get location
  const location = await prisma.reportLocation.findFirst({
    where: { reportId: REPORT_ID },
    select: { id: true },
  })
  if (!location) { console.error('❌ Location not found'); return }

  // 2. Create or find campaign
  let campaign = await prisma.campaign.findFirst({
    where: { postcode: POSTCODE, name: CAMPAIGN_NAME },
  })
  if (!campaign) {
    campaign = await prisma.campaign.create({
      data: {
        name: CAMPAIGN_NAME,
        postcode: POSTCODE,
        carparkName: CARPARK_NAME,
        businessType: 'ALL',
        status: 'LAUNCHED',
        locationId: location.id,
        phoneNumberId: VAPI_PHONE_NUM_ID,
      },
    })
    console.log('📋 Campaign created: ' + campaign.id)
  } else {
    console.log('📋 Campaign exists: ' + campaign.id)
  }

  // 3. Get businesses with phones
  const places = await prisma.reportLocationPlace.findMany({
    where: { locationId: location.id },
    include: { place: { select: { name: true, phone: true, placeId: true, types: true } } },
  })

  const withPhone = places.filter(p => p.place.phone)
  console.log('📊 Total places: ' + places.length + ' | With phone: ' + withPhone.length)

  // Time window check — only run between 10am and 12pm
  const hour = new Date().getHours()
  if (hour < 10 || hour >= 12) {
    console.log('⏰ Current hour: ' + hour + '. Calls should run between 10am-12pm.')
    console.log('   Pass --force to override the time window.')
    if (!process.argv.includes('--force')) {
      console.log('   Exiting. Use: npx tsx scripts/launch-b5-campaign.ts --force')
      return
    }
    console.log('   --force flag detected, proceeding anyway.')
  }

  // 4. Filter and create CampaignBusiness records
  let ivrSkipped = 0
  let dupSkipped = 0
  let invalidSkipped = 0
  let typeSkipped = 0
  let prevIvrSkipped = 0
  const queued: string[] = []

  for (const rlp of withPhone) {
    // Check if already in this campaign
    const existing = await prisma.campaignBusiness.findFirst({
      where: { campaignId: campaign.id, reportLocationPlaceId: rlp.id },
    })
    if (existing) continue

    // IVR prefix check
    if (isIvrPrefix(rlp.place.phone!)) {
      await prisma.campaignBusiness.create({
        data: {
          campaignId: campaign.id,
          reportLocationPlaceId: rlp.id,
          callStatus: 'IVR_BLOCKED',
        },
      })
      ivrSkipped++
      console.log('  🤖 IVR prefix skip: ' + rlp.place.name)
      continue
    }

    // IVR-heavy business type check
    if (isIvrHeavyType(rlp.place.types)) {
      await prisma.campaignBusiness.create({
        data: {
          campaignId: campaign.id,
          reportLocationPlaceId: rlp.id,
          callStatus: 'IVR_BLOCKED',
        },
      })
      typeSkipped++
      console.log('  🏦 IVR-heavy type skip: ' + rlp.place.name + ' (' + rlp.place.types + ')')
      continue
    }

    // Dedup check across campaigns
    const dupCampaign = await checkDuplicateBusiness(rlp.place.placeId, campaign.id)
    if (dupCampaign) {
      await prisma.campaignBusiness.create({
        data: {
          campaignId: campaign.id,
          reportLocationPlaceId: rlp.id,
          callStatus: 'DUPLICATE_SKIPPED',
        },
      })
      dupSkipped++
      console.log('  🔄 Duplicate skip: ' + rlp.place.name + ' (from ' + dupCampaign + ')')
      continue
    }

    // Previously IVR-blocked check — if this placeId was IVR_BLOCKED in any campaign, skip
    const prevIvr = await prisma.campaignBusiness.findFirst({
      where: {
        reportLocationPlace: { place: { placeId: rlp.place.placeId } },
        callStatus: 'IVR_BLOCKED',
        campaignId: { not: campaign.id },
      },
    })
    if (prevIvr) {
      await prisma.campaignBusiness.create({
        data: {
          campaignId: campaign.id,
          reportLocationPlaceId: rlp.id,
          callStatus: 'IVR_BLOCKED',
        },
      })
      prevIvrSkipped++
      console.log('  🚫 Prev IVR skip: ' + rlp.place.name)
      continue
    }

    // Validate E.164
    const e164 = formatPhoneE164(rlp.place.phone!)
    if (!e164) {
      await prisma.campaignBusiness.create({
        data: {
          campaignId: campaign.id,
          reportLocationPlaceId: rlp.id,
          callStatus: 'INVALID_NUMBER',
        },
      })
      invalidSkipped++
      console.log('  ❓ Invalid: ' + rlp.place.name + ' — ' + rlp.place.phone)
      continue
    }

    // Queue for calling
    const cb = await prisma.campaignBusiness.create({
      data: {
        campaignId: campaign.id,
        reportLocationPlaceId: rlp.id,
        callStatus: 'QUEUED',
      },
    })
    queued.push(cb.id)
  }

  console.log('')
  console.log('═'.repeat(60))
  console.log('📊 Pre-flight:')
  console.log('   IVR prefix skipped: ' + ivrSkipped)
  console.log('   IVR type skipped: ' + typeSkipped)
  console.log('   Prev IVR skipped: ' + prevIvrSkipped)
  console.log('   Duplicates skipped: ' + dupSkipped)
  console.log('   Invalid numbers: ' + invalidSkipped)
  console.log('   Queued for calling: ' + queued.length)
  console.log('')

  if (queued.length === 0) {
    console.log('⚠️  No calls to make!')
    return
  }

  // 5. Dispatch in waves
  const totalWaves = Math.ceil(queued.length / WAVE_SIZE)
  console.log('🌊 Dispatching ' + queued.length + ' calls in ' + totalWaves + ' waves of ' + WAVE_SIZE)
  console.log('')

  let dispatched = 0
  let failed = 0

  for (let wave = 0; wave < totalWaves; wave++) {
    const waveStart = wave * WAVE_SIZE
    const waveEnd = Math.min(waveStart + WAVE_SIZE, queued.length)
    const waveIds = queued.slice(waveStart, waveEnd)

    console.log('🌊 Wave ' + (wave + 1) + '/' + totalWaves + ' (' + waveIds.length + ' calls)')

    for (const cbId of waveIds) {
      const cb = await prisma.campaignBusiness.findUnique({
        where: { id: cbId },
        include: { reportLocationPlace: { include: { place: true } } },
      })
      if (!cb) continue

      const result = await dispatchCall(
        cb as any,
        CARPARK_NAME,
        { vapiAssistantId: VAPI_ASSISTANT_ID, vapiPhoneNumId: VAPI_PHONE_NUM_ID },
      )

      if (result.success) {
        await prisma.campaignBusiness.update({
          where: { id: cbId },
          data: {
            callStatus: 'IN_PROGRESS',
            vapiCallId: result.vapiCallId,
            callAttempts: { increment: 1 },
            lastCallAt: new Date(),
          },
        })
        dispatched++
        console.log('  ✅ ' + cb.reportLocationPlace.place.name)
      } else {
        await prisma.campaignBusiness.update({
          where: { id: cbId },
          data: { callStatus: 'FAILED', callAttempts: { increment: 1 } },
        })
        failed++
        console.log('  ❌ ' + cb.reportLocationPlace.place.name + ' — ' + result.error)
      }

      // Small gap between individual dispatches
      await new Promise(r => setTimeout(r, CALL_GAP_MS))
    }

    // Gap between waves (except after last wave)
    if (wave < totalWaves - 1) {
      console.log('  ⏳ Waiting 180s before next wave...')
      await new Promise(r => setTimeout(r, WAVE_GAP_MS))
    }
  }

  // 6. Final summary
  console.log('')
  console.log('═'.repeat(60))
  console.log('🏁 Campaign dispatch complete!')
  console.log('   Dispatched: ' + dispatched)
  console.log('   Failed: ' + failed)
  console.log('   IVR prefix skipped: ' + ivrSkipped)
  console.log('   IVR type skipped: ' + typeSkipped)
  console.log('   Prev IVR skipped: ' + prevIvrSkipped)
  console.log('   Duplicates: ' + dupSkipped)
  console.log('   Invalid: ' + invalidSkipped)
  console.log('')
  console.log('📊 Monitor results at: https://app.parkbunnyreports.com/outreach/analytics')
}

main().catch(console.error).finally(() => prisma.$disconnect())
