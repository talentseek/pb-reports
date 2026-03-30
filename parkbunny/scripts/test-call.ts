/**
 * Test call dispatch — calls the specified number using the Sarah outreach assistant.
 * 
 * Usage: npx tsx scripts/test-call.ts +447759878580
 */
import 'dotenv/config'

const VAPI_KEY = process.env.VAPI_PRIVATE_API_KEY
const ASSISTANT_ID = '501d2196-59fe-4860-9f88-749dca9ac096' // Sarah - ParkBunny Outreach
const PHONE_NUMBER_ID = 'c3322c70-c7ce-4d15-a37b-db97b02be42b' // +443300589480

const customerNumber = process.argv[2]

if (!customerNumber) {
  console.error('Usage: npx tsx scripts/test-call.ts +447759878580')
  process.exit(1)
}

if (!VAPI_KEY) {
  console.error('❌ VAPI_PRIVATE_API_KEY not set')
  process.exit(1)
}

async function main() {
  console.log('📞 Dispatching test call...')
  console.log('  Assistant: Sarah (Outreach)')
  console.log('  From: +443300589480')
  console.log('  To: ' + customerNumber)
  console.log('')

  const payload = {
    assistantId: ASSISTANT_ID,
    phoneNumberId: PHONE_NUMBER_ID,
    customer: {
      number: customerNumber,
    },
    assistantOverrides: {
      variableValues: {
        business_name: 'Test Coffee Shop',
        carpark_name: 'ParkBunny Test Car Park',
      },
    },
  }

  const res = await fetch('https://api.vapi.ai/call/phone', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + VAPI_KEY,
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('❌ VAPI call failed (' + res.status + '):')
    console.error(JSON.stringify(data, null, 2))
    process.exit(1)
  }

  console.log('✅ Call dispatched!')
  console.log('  Call ID: ' + data.id)
  console.log('  Status: ' + data.status)
  console.log('')
  console.log('Your phone should ring in a few seconds. Pick up and chat with Sarah!')
  console.log('After the call ends, the webhook will process the results.')
}

main().catch(console.error)
