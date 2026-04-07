import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

const B5_CAMPAIGN_ID = 'cmnhd59hu0001sb6tcwyjymc9'

async function main() {
  console.log('═'.repeat(60))
  console.log('🔍 PRE-FLIGHT AUDIT — DATABASE & CALLABLE BUSINESSES')
  console.log('═'.repeat(60))
  
  const all = await p.campaignBusiness.findMany({
    where: { campaignId: B5_CAMPAIGN_ID },
    include: { reportLocationPlace: { include: { place: { select: { name: true, phone: true, types: true } } } } }
  })
  
  const byStatus: Record<string, number> = {}
  for (const b of all) byStatus[b.callStatus] = (byStatus[b.callStatus] || 0) + 1
  
  console.log('')
  console.log('📊 Current B5 status breakdown (' + all.length + ' total):')
  for (const [s, c] of Object.entries(byStatus).sort((a, b) => b[1] - a[1])) {
    console.log('   ' + s + ': ' + c)
  }
  
  // Callable = VOICEMAIL, NO_ANSWER, CALLBACK_BOOKED with attempts < 3
  const callable = all.filter(b => 
    ['VOICEMAIL', 'NO_ANSWER', 'CALLBACK_BOOKED'].includes(b.callStatus) && 
    b.callAttempts < 3
  )
  
  console.log('')
  console.log('📞 Callable businesses (retryable): ' + callable.length)
  for (const b of callable) {
    console.log('   ' + b.reportLocationPlace.place.name + ' | ' + b.callStatus + ' | attempts: ' + b.callAttempts + ' | ' + b.reportLocationPlace.place.phone)
  }
  
  // Estimate timing
  const waves = Math.ceil(callable.length / 2)
  const totalMinutes = waves * 3
  console.log('')
  console.log('⏱️  Timing estimate:')
  console.log('   Waves: ' + waves + ' (2 calls per wave)')
  console.log('   Est. duration: ~' + totalMinutes + ' minutes')
  
  // Check for IVR-heavy types still in callable
  const ivrTypes = ['bank', 'pharmacy', 'car_dealer', 'hospital', 'doctor', 'dentist', 'department_store', 'supermarket', 'post_office']
  const ivrInCallable = callable.filter(b => {
    const types = b.reportLocationPlace.place.types.toLowerCase()
    return ivrTypes.some(t => types.includes(t))
  })
  
  console.log('')
  console.log('⚠️  Checks:')
  console.log('   Missing phone: ' + callable.filter(b => !b.reportLocationPlace.place.phone).length)
  if (ivrInCallable.length > 0) {
    console.log('   ⚡ IVR-heavy types still callable:')
    for (const b of ivrInCallable) console.log('      ' + b.reportLocationPlace.place.name + ' -> ' + b.reportLocationPlace.place.types)
  } else {
    console.log('   IVR-heavy types in callable: 0 ✅')
  }
  
  // Check nextCallAt timing
  const notReady = callable.filter(b => b.nextCallAt && new Date(b.nextCallAt) > new Date())
  if (notReady.length > 0) {
    console.log('   ⏰ Not yet ready (nextCallAt in future): ' + notReady.length)
    for (const b of notReady) console.log('      ' + b.reportLocationPlace.place.name + ' -> ready at ' + b.nextCallAt)
  } else {
    console.log('   All callable businesses ready now ✅')
  }
  
  await p.$disconnect()
}
main()
