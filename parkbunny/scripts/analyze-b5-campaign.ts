import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()
const B1_CAMPAIGN = 'cmnee2bsg0001sbmz08x8v6ph'
const REPORT_ID = 'cmn4g86ha0001l4048qk6uins'

async function main() {
  const loc = await p.reportLocation.findFirst({
    where: { reportId: REPORT_ID },
    select: { id: true, postcode: true },
  })
  if (!loc) { console.log('Location not found'); return }
  console.log('Location:', loc.id, loc.postcode)

  const places = await p.reportLocationPlace.findMany({
    where: { locationId: loc.id },
    include: { place: { select: { name: true, phone: true, placeId: true } } },
  })
  const withPhone = places.filter(p => p.place.phone)
  const nationalPrefixes = ['0330', '0800', '0845', '0345', '0844', '0870']
  const ivrLikely = withPhone.filter(p => nationalPrefixes.some(pfx => p.place.phone!.replace(/\s/g, '').startsWith(pfx)))
  const callable = withPhone.filter(p => !nationalPrefixes.some(pfx => p.place.phone!.replace(/\s/g, '').startsWith(pfx)))

  // Check B1 duplicates
  const b1Places = await p.campaignBusiness.findMany({
    where: { campaignId: B1_CAMPAIGN },
    select: { reportLocationPlace: { select: { placeId: true } } },
  })
  const b1PlaceIds = new Set(b1Places.map(b => b.reportLocationPlace.placeId))
  const dupes = callable.filter(p => b1PlaceIds.has(p.place.placeId))

  console.log('')
  console.log('Total places: ' + places.length)
  console.log('With phone: ' + withPhone.length)
  console.log('IVR-likely (national prefix): ' + ivrLikely.length)
  console.log('Callable: ' + callable.length)
  console.log('Duplicates from B1: ' + dupes.length)
  if (dupes.length > 0) {
    dupes.forEach(d => console.log('  DUP: ' + d.place.name))
  }
  console.log('Net callable: ' + (callable.length - dupes.length))

  console.log('')
  console.log('IVR skip list:')
  ivrLikely.forEach(p => console.log('  SKIP: ' + p.place.name + ' — ' + p.place.phone))

  await p.$disconnect()
}

main().catch(console.error)
