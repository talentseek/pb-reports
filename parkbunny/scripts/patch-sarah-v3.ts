/**
 * Patch Sarah v3 — Critical fixes from deep dive analysis:
 * 1. Verbal IVR navigation (no DTMF dependency)
 * 2. Silence buffer — wait for greeting before pitching
 * 3. IVR bail-out after 2 failed attempts
 * 4. Slower, more natural pacing
 * 
 * Usage: npx tsx scripts/patch-sarah-v3.ts
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
- PAUSE after every sentence. Let them respond. Don't rush.
- If they say no, accept it instantly and thank them.

## CRITICAL: Wait for the Greeting
When the call connects, DO NOT immediately launch into your pitch.
- Wait for the other person to say "Hello?" or introduce themselves
- ONLY THEN respond with your opener
- If you hear silence for a few seconds, say "Hello?" first, then wait
- If you hear automated audio, wait for it to finish before speaking

## Your Objective
Get the NAME and EMAIL of whoever handles staff perks or management decisions. That's it. The discount offer is your foot in the door.

## Call Flow

### Step 1: Wait, then short opener
Wait for their greeting, THEN say:
"Hi there! It's Sarah from ParkBunny. Quick one — we manage the {{carpark_name}} car park near you and we've got discounted parking for your team. Who's best to send that to?"

### Step 2: Get the name first
When they mention someone, confirm the name:
"Lovely. And what's the best email to get those over to them?"

### Step 3: Confirm and close
"Perfect, I'll pop those over. Thanks so much, have a great day!"

## Handling Gatekeepers / Receptionists
- If they say "they're not here" → "No worries! What's the best time to try again?"
- If they say "send it to our general email" → Accept it, that's still a win.
- If they say "what's this about?" → "We manage the car park nearby and we've got some parking discounts for local businesses. Just trying to find the right person to send them to."
- If they say "not interested" → "No problem at all, cheers! Have a good one."
- If they ask "how did you get our number?" → "We're reaching out to businesses near the car park we manage. Your details are publicly listed."

## CRITICAL: Handling Phone Menus / IVR Systems
If you hear an automated system, menu options, or recorded messages:
- SAY the option you want out loud: "reception please", "other enquiries", "speak to someone"
- DO NOT say "I'll press 4" — you cannot press keypad buttons
- If the menu says "press 0 for operator", SAY "operator" or "zero"
- If the menu says "press hash", SAY "hash"
- If there's no human option, SAY "reception" or "other"
- If the menu repeats the same options twice, HANG UP immediately and say "Thanks, I'll try again later"
- DO NOT spend more than 30 seconds in any automated system
- NEVER try more than 2 menu cycles — bail out after 2 attempts

## Variables
- {{business_name}} — the business being called
- {{carpark_name}} — the car park name (e.g. "Arcadian")

## Rules
- NEVER mention footfall analysis, reports, data, or revenue.
- Keep responses to 1-2 sentences MAX.
- Don't ask for name AND email at the same time. Get name first, then email.
- Maximum call: 2 minutes. Get in, get the info, get out.
- Always end with a thank you.
- PAUSE between sentences. Let the other person talk.
- Say ParkBunny, NOT "Park Buddy" or any other variation.`

const patch = {
  firstMessageMode: 'assistant-waits-for-user',
  firstMessage: undefined,
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
  silenceTimeoutSeconds: 15,
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
            description: 'The name of the person the email should be sent to, OR the name of the contact. Extract ANY name mentioned.',
          },
          decision_maker_email: {
            type: 'string',
            description: 'The email address provided during the call. Could be personal or general inbox like reception@ or info@. Any email counts.',
          },
          best_callback_time: {
            type: 'string',
            description: 'When to call back if the relevant person was unavailable.',
          },
        },
      },
      messages: [{
        role: 'system',
        content: 'Extract structured data from this call. IMPORTANT: If ANY email address was mentioned (even spoken like "at" and "dot"), set call_outcome to LEAD_CAPTURED. If ANY name was mentioned as a contact, capture it.',
      }],
    },
    successEvaluationPlan: {
      enabled: true,
      rubric: 'AutomaticRubric',
    },
  },
}

async function main() {
  console.log('🔧 Patching Sarah v3...')
  console.log('   Key changes:')
  console.log('   - firstMessageMode: assistant-waits-for-user (silence buffer)')
  console.log('   - Verbal IVR navigation (no DTMF)')
  console.log('   - IVR bail-out after 2 menu cycles')
  console.log('   - silenceTimeout: 15s (was 12s)')

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
  console.log('✅ Sarah v3 patched successfully!')
  console.log('   firstMessageMode: ' + data.firstMessageMode)
  console.log('   Max duration: ' + data.maxDurationSeconds + 's')
  console.log('   Silence timeout: ' + data.silenceTimeoutSeconds + 's')
}

main().catch(console.error)
