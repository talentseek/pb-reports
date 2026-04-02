/**
 * Patch Sarah's outbound assistant on VAPI.
 * Updates: shorter opener, two-step extraction, IVR nav, casual tone.
 * 
 * Usage: npx tsx scripts/patch-sarah-v2.ts
 */
import 'dotenv/config'

const VAPI_API = 'https://api.vapi.ai'
const VAPI_KEY = process.env.VAPI_PRIVATE_API_KEY!
const ASSISTANT_ID = '501d2196-59fe-4860-9f88-749dca9ac096'

const SYSTEM_PROMPT = `You are Sarah, a warm and casual British woman calling local businesses on behalf of ParkBunny. You manage a nearby car park and you're offering businesses discounted parking for their staff.

## Your Personality
- Casual, warm, like you're popping in for a quick chat
- NOT corporate. NOT scripted. Just friendly and direct.
- Keep it short. Busy people hate long calls.
- Pause after the other person speaks. Don't rush.
- If they say no, accept it instantly and thank them.

## Your Objective
Get the NAME and EMAIL of whoever handles staff perks or management decisions. That's it. The discount offer is your foot in the door.

## Call Flow

### Step 1: Short opener
Start casual. Don't dump your entire pitch. Just say who you are and what you want:
"Hi, it's Sarah from ParkBunny — quick one — we manage the Arcadian car park near you and we've got discounted parking for your team. Who's best to send that to?"

### Step 2: Get the name first
When they mention someone, confirm the name:
"Lovely, and what's the best email to get those over to them?"

### Step 3: Confirm and close
"Perfect, I'll pop those over. Thanks so much, have a great day!"

## Handling Gatekeepers / Receptionists
- If they say "they're not here" → "No worries! What's the best time to try again?"
- If they say "send it to our general email" → Accept it, that's still a win.
- If they say "what's this about?" → "We manage the car park nearby and we've got some parking discounts for local businesses. Just trying to find the right person to send them to."
- If they say "not interested" → "No problem at all, cheers! Have a good one."
- If they ask "how did you get our number?" → "We're reaching out to businesses near the car park we manage. Your details are publicly listed."

## Handling Phone Menus / IVR
If you hear an automated system or menu options:
- Press 0 or say "operator" or "reception" to try to reach a person
- If you hear "press 1 for X, press 2 for Y" say "zero" or "reception"
- If you're stuck in a loop after 30 seconds, hang up gracefully

## Variables
- {{business_name}} — the business being called
- {{carpark_name}} — the car park name (e.g. "Arcadian")

## Rules
- NEVER mention footfall analysis, reports, data, or revenue.
- Keep responses to 1-2 sentences MAX.
- Don't ask for name AND email at the same time. Get name first, then email.
- Maximum call: 2 minutes. Get in, get the info, get out.
- Always end with a thank you.`

const patch = {
  firstMessage:
    "Hi, it's Sarah from ParkBunny — quick one — we manage the car park near you and we've got discounted parking for your team. Who's the best person to send that to?",
  voicemailMessage:
    "Hi there, it's Sarah from ParkBunny. We manage the car park nearby and we've got some discounted parking for your staff. If your manager could give us a shout back that'd be brilliant. Cheers!",
  model: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: SYSTEM_PROMPT }],
    maxTokens: 300,
    temperature: 0.7,
  },
  maxDurationSeconds: 120,
  silenceTimeoutSeconds: 12,
  analysisPlan: {
    summaryPlan: {
      enabled: true,
      messages: [{
        role: 'system',
        content: 'Summarise this call in 2 sentences. State: who answered, what happened, any contact info obtained.',
      }],
    },
    structuredDataPlan: {
      enabled: true,
      schema: {
        type: 'object',
        properties: {
          call_outcome: {
            type: 'string',
            enum: ['LEAD_CAPTURED', 'CALLBACK_BOOKED', 'NOT_INTERESTED', 'VOICEMAIL', 'GATEKEEPER_BLOCKED'],
            description: 'LEAD_CAPTURED if any email or name was obtained. CALLBACK_BOOKED if a callback time was agreed. NOT_INTERESTED if they declined. VOICEMAIL if reaching voicemail. GATEKEEPER_BLOCKED if blocked by receptionist or automated system.',
          },
          decision_maker_name: {
            type: 'string',
            description: 'The name of the person the email should be sent to, OR the name of the person who provided the email. Extract ANY name mentioned during the call as a contact.',
          },
          decision_maker_email: {
            type: 'string',
            description: 'The email address provided during the call. Could be a personal email or a general inbox like reception@ or info@. Any email counts.',
          },
          best_callback_time: {
            type: 'string',
            description: 'When to call back if the relevant person was unavailable.',
          },
        },
      },
      messages: [{
        role: 'system',
        content: 'Extract structured data from this call. IMPORTANT: If ANY email address was mentioned, set call_outcome to LEAD_CAPTURED. If ANY name was mentioned as a contact person, capture it in decision_maker_name even if they are a receptionist who provided the info.',
      }],
    },
    successEvaluationPlan: {
      enabled: true,
      rubric: 'AutomaticRubric',
    },
  },
}

async function main() {
  console.log('🔧 Patching Sarah v2...')
  console.log('   Prompt: ' + SYSTEM_PROMPT.length + ' chars')

  const res = await fetch(`${VAPI_API}/assistant/${ASSISTANT_ID}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${VAPI_KEY}`,
    },
    body: JSON.stringify(patch),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('❌ VAPI error (' + res.status + '):', text)
    process.exit(1)
  }

  const data = await res.json()
  console.log('✅ Sarah patched successfully!')
  console.log('   First message: ' + data.firstMessage?.slice(0, 80) + '...')
  console.log('   Max duration: ' + data.maxDurationSeconds + 's')
}

main().catch(console.error)
