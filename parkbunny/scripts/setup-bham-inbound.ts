/**
 * Configure Birmingham local number for:
 * 1. Outbound: Sarah assistant (already set — this just verifies)
 * 2. Inbound: Park Bunny Customer Support (Lilly) with escalation
 * 
 * Also patches Lilly to handle "someone called me about parking" queries
 * with blind transfer to 07538783927.
 * 
 * Usage: npx tsx scripts/setup-bham-inbound.ts
 */
import 'dotenv/config'

const VAPI_API = 'https://api.vapi.ai'
const VAPI_KEY = process.env.VAPI_PRIVATE_API_KEY!

const BHAM_PHONE_ID = '1ef87949-bce1-418d-abb4-107a6adf8494'
const LILLY_ASSISTANT_ID = 'dfae7838-f575-4336-a18c-e710574f6427'
const ESCALATION_NUMBER = '+447538783927'

async function main() {
  // 1. Configure Birmingham number for inbound → Lilly
  console.log('📱 Configuring Birmingham number for inbound calls...')
  
  const phoneRes = await fetch(`${VAPI_API}/phone-number/${BHAM_PHONE_ID}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${VAPI_KEY}`,
    },
    body: JSON.stringify({
      assistantId: LILLY_ASSISTANT_ID,
    }),
  })

  if (!phoneRes.ok) {
    const text = await phoneRes.text()
    console.error('❌ Failed to config phone: ' + phoneRes.status, text)
  } else {
    const phone = await phoneRes.json()
    console.log('✅ Birmingham number inbound → Lilly')
    console.log('   Number: ' + phone.number)
  }

  // 2. Add transfer tool to Lilly for escalation
  console.log('')
  console.log('🔧 Patching Lilly with escalation handling...')

  // First get current Lilly config
  const lillyRes = await fetch(`${VAPI_API}/assistant/${LILLY_ASSISTANT_ID}`, {
    headers: { Authorization: `Bearer ${VAPI_KEY}` },
  })
  const lilly = await lillyRes.json()
  const currentPrompt = lilly.model?.messages?.[0]?.content ?? ''

  // Add escalation section to her prompt
  const escalationAddendum = `

## Parking Discount Callbacks (IMPORTANT)
If a caller mentions ANY of the following:
- "Someone called me about parking" or "parking discounts"
- "Sarah called me" or "I got a call from ParkBunny about parking"
- "I want to know about the discounted parking"
- Any reference to receiving a call about staff parking offers

Respond: "Ah yes, that would have been our commercial team. Let me put you straight through to them now — one moment!"
Then use the transferCall tool to transfer them to the commercial team.
Do NOT try to handle the parking discount query yourself.
`

  const updatedPrompt = currentPrompt + escalationAddendum

  const patchRes = await fetch(`${VAPI_API}/assistant/${LILLY_ASSISTANT_ID}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${VAPI_KEY}`,
    },
    body: JSON.stringify({
      model: {
        ...lilly.model,
        messages: [{ role: 'system', content: updatedPrompt }],
        tools: [
          ...(lilly.model?.tools ?? []),
          {
            type: 'transferCall',
            destinations: [
              {
                type: 'number',
                number: ESCALATION_NUMBER,
                message: 'Connecting you to our commercial team now.',
                description: 'Transfer call to commercial team when caller asks about parking discounts or references a callback from Sarah',
              },
            ],
          },
        ],
      },
    }),
  })

  if (!patchRes.ok) {
    const text = await patchRes.text()
    console.error('❌ Failed to patch Lilly: ' + patchRes.status, text)
  } else {
    console.log('✅ Lilly patched with escalation!')
    console.log('   Transfer target: ' + ESCALATION_NUMBER)
  }

  console.log('')
  console.log('🏁 Setup complete!')
  console.log('   Inbound on Birmingham number → Lilly (support)')
  console.log('   Parking callbacks → blind transfer to ' + ESCALATION_NUMBER)
}

main().catch(console.error)
