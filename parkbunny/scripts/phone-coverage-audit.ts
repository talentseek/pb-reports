/**
 * Phone Coverage Audit — Check how many businesses per LIVE location have valid phones.
 *
 * Usage:
 *   npx tsx scripts/phone-coverage-audit.ts
 *
 * Reports per-location stats: total included businesses, with phone, valid E.164, no phone.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Simple UK phone validation — matches the logic in voice-agent.ts formatPhoneE164.
 * Returns E.164 format or null if invalid.
 */
function validateUKPhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
  if (cleaned.startsWith('+44') && cleaned.length >= 12) return cleaned
  if (cleaned.startsWith('0') && cleaned.length >= 10) return '+44' + cleaned.slice(1)
  if (cleaned.startsWith('44') && cleaned.length >= 11) return '+' + cleaned
  return null
}

async function main() {
  const locations = await prisma.reportLocation.findMany({
    where: { status: 'LIVE' },
    include: {
      report: { select: { name: true } },
      places: {
        where: { included: true },
        include: {
          place: { select: { id: true, name: true, phone: true, types: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (locations.length === 0) {
    console.log('No LIVE locations found.')
    return
  }

  console.log('📞 Phone Coverage Audit — LIVE Locations Only')
  console.log('═'.repeat(80))
  console.log('')

  let globalTotal = 0
  let globalWithPhone = 0
  let globalValidE164 = 0
  let globalNoPhone = 0
  let globalInvalid = 0

  for (const loc of locations) {
    const total = loc.places.length
    let withPhone = 0
    let validE164 = 0
    let noPhone = 0
    let invalidPhones: string[] = []

    for (const rlp of loc.places) {
      const phone = rlp.place.phone
      if (!phone) {
        noPhone++
        continue
      }

      withPhone++
      const e164 = validateUKPhone(phone)
      if (e164) {
        validE164++
      } else {
        invalidPhones.push(`  ⚠️  ${rlp.place.name}: "${phone}"`)
      }
    }

    const coverage = total > 0 ? Math.round((validE164 / total) * 100) : 0
    const bar = '█'.repeat(Math.floor(coverage / 5)) + '░'.repeat(20 - Math.floor(coverage / 5))

    console.log(`📍 ${loc.postcode} — ${loc.report.name}`)
    console.log(`   ${bar} ${coverage}%`)
    console.log(`   Total: ${total} | With Phone: ${withPhone} | Valid E.164: ${validE164} | No Phone: ${noPhone} | Invalid: ${invalidPhones.length}`)

    if (invalidPhones.length > 0 && invalidPhones.length <= 5) {
      invalidPhones.forEach(line => console.log(line))
    } else if (invalidPhones.length > 5) {
      invalidPhones.slice(0, 3).forEach(line => console.log(line))
      console.log(`   ... and ${invalidPhones.length - 3} more`)
    }

    console.log('')

    globalTotal += total
    globalWithPhone += withPhone
    globalValidE164 += validE164
    globalNoPhone += noPhone
    globalInvalid += invalidPhones.length
  }

  console.log('═'.repeat(80))
  console.log('📊 GLOBAL SUMMARY')
  console.log(`   Locations: ${locations.length}`)
  console.log(`   Total businesses: ${globalTotal}`)
  console.log(`   With phone: ${globalWithPhone} (${globalTotal > 0 ? Math.round((globalWithPhone / globalTotal) * 100) : 0}%)`)
  console.log(`   Valid E.164: ${globalValidE164} (${globalTotal > 0 ? Math.round((globalValidE164 / globalTotal) * 100) : 0}%)`)
  console.log(`   No phone: ${globalNoPhone}`)
  console.log(`   Invalid format: ${globalInvalid}`)
  console.log('')
  console.log(`   🎯 Callable: ${globalValidE164} businesses across ${locations.length} locations`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
