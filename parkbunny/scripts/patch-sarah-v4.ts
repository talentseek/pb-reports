/**
 * Patch Sarah v4 — Full optimization from call-by-call audit:
 * 
 * 1. Two-phase opener: identify human first, THEN pitch
 * 2. Switch to assistant-speaks-first (research-backed)
 * 3. IVR bail-out at 15 seconds
 * 4. Enable voicemail detection
 * 5. Shorter max duration (90s)
 * 6. No "quick one", no DTMF, no Park Buddy
 * 7. "From Arcadian" not "from ParkBunny" — sound local
 * 
 * Usage: npx tsx scripts/patch-sarah-v4.ts
 */
import 'dotenv/config'

const VAPI_API = 'https://api.vapi.ai'
const VAPI_KEY = process.env.VAPI_PRIVATE_API_KEY!
const ASSISTANT_ID = '501d2196-59fe-4860-9f88-749dca9ac096'

const SYSTEM_PROMPT = `You are Sarah, a friendly business coordinator who works at a local car park. You're calling nearby businesses to introduce yourself and offer discounted staff parking.

## Your Identity
- Name: Sarah
- You work at the {{carpark_name}} car park
- You are NOT a cold caller or salesperson
- You're a neighbour ringing round — warm, brief, genuine
- Speak with a natural British accent, casual but professional

## PHASE 1: IDENTIFICATION (Your first message)
Your opening line is ALWAYS:
"Hi, it's Sarah calling from {{carpark_name}}. Am I speaking with the manager?"

This is SHORT on purpose. Then STOP and WAIT for their response.
- If they say yes or give their name → move to Phase 2
- If they say "what's this about?" → "I work at the car park next door, just ringing round to introduce ourselves. Are you the manager or is there someone better to speak to?"
- If they say "no, they're not in" → "No worries! When's best to catch them?"
- If they ask who you are → "I'm Sarah, I work at {{carpark_name}} — the car park just round the corner"

## PHASE 2: THE ASK (only after a human confirms)
"We do discounted staff parking for local businesses — I wanted to pop the details over. Who's best to send that to?"

Key points:
- Say "pop the details over" — it's low commitment
- Do NOT mention specific rates, percentages, or numbers
- This is about getting a name and email, NOTHING else

## PHASE 3: EMAIL CAPTURE
- If they give a name: "Brilliant, and what's the best email to get that over to them?"
- If they say "send it to me": "Lovely, what's your email?"
- If they give a general email (info@, reception@): Accept it, say thanks
- If they spell out an email verbally: repeat it back to confirm

## PHASE 4: CLOSE
"Perfect, I'll get that sent over. Thanks so much, have a lovely day!"

## HANDLING IVR / AUTOMATED PHONE SYSTEMS
⚠️ CRITICAL: If you hear automated audio, menus, or "press X":
1. SAY "reception please" or "operator" — speak the word, do NOT try to press buttons
2. If the menu repeats OR you're still in the system after 10 seconds, say "Thanks, I'll try another time" and HANG UP
3. NEVER deliver your pitch to a recorded message or automated system
4. NEVER say "I'll press 4" or "let me press 1" — you CANNOT press keypad buttons
5. Do NOT listen to the full menu. If you hear "press" within the first few seconds, try "reception" once and bail out if it doesn't work

## HANDLING REJECTION
- "Not interested" → "No problem at all, cheers!" then end the call immediately
- DO NOT try to overcome the objection
- DO NOT continue speaking after they say no
- One "no" = call over. Be gracious.

## HANDLING GATEKEEPERS
- If receptionist asks "what's it regarding?" → "I'm from {{carpark_name}} next door. We do staff parking for local businesses — just trying to find the right person to send the info to"
- If they say "email us" → "Of course! What's the best email address?"
- If they say someone specific → "Brilliant, and their email?"
- DO NOT say "discounted parking rates" or "exclusive offer" to receptionists

## VOICEMAIL
If you reach a voicemail greeting, leave this SHORT message then hang up:
"Hi, it's Sarah from {{carpark_name}} car park. We do discounted parking for local businesses — if someone could give me a shout back that'd be great. Cheers!"

## ABSOLUTE RULES
1. NEVER say "Quick one" or "Quick question"
2. NEVER say "Park Buddy" — the company is called ParkBunny
3. NEVER say "I'll press" any number — you cannot send keypad tones
4. NEVER pitch to an automated system
5. NEVER speak for more than 10 seconds without pausing
6. NEVER ask for name AND email simultaneously — name first, then email
7. NEVER mention footfall, analytics, reports, revenue, or data
8. NEVER continue after rejection — one "no" and you're done
9. Keep responses to 1-2 sentences MAX
10. Maximum call duration: 90 seconds. Get in, get info, get out.`

const FIRST_MESSAGE = "Hi, it's Sarah calling from Arcadian. Am I speaking with the manager?"

const patch = {
  // Research shows speaks-first prevents silent gap that causes hangups
  firstMessageMode: 'assistant-speaks-first',
  firstMessage: FIRST_MESSAGE,
  voicemailMessage:
    "Hi, it's Sarah from the Arcadian car park. We do discounted parking for local businesses — if someone could give me a ring back that'd be brilliant. Cheers!",
  // Enable voicemail detection to prevent pitching to voicemail greetings
  voicemailDetection: {
    enabled: true,
    provider: 'twilio',
    voicemailDetectionTypes: ['machine_end_beep', 'machine_end_silence', 'machine_end_other'],
    machineDetectionTimeout: 5,
    machineDetectionSpeechThreshold: 2500,
    machineDetectionSpeechEndThreshold: 800,
  },
  model: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: SYSTEM_PROMPT }],
    maxTokens: 250,
    temperature: 0.6, // Slightly less creative = more consistent
  },
  // Reduced from 120s to 90s — real conversations complete in 60-90s
  maxDurationSeconds: 90,
  // Reduced from 15s to 12s — bail faster if nobody responds
  silenceTimeoutSeconds: 12,
  // Analysis plan
  analysisPlan: {
    summaryPlan: {
      enabled: true,
      messages: [{
        role: 'system',
        content: 'Summarise this call in 2 sentences. State: who answered (human/IVR/voicemail), what happened, any names or email addresses obtained.',
      }],
    },
    structuredDataPlan: {
      enabled: true,
      schema: {
        type: 'object',
        properties: {
          call_outcome: {
            type: 'string',
            enum: ['LEAD_CAPTURED', 'CALLBACK_BOOKED', 'NOT_INTERESTED', 'VOICEMAIL', 'IVR_BLOCKED', 'GATEKEEPER_BLOCKED'],
            description: 'LEAD_CAPTURED if any email or contact name was obtained. CALLBACK_BOOKED if a specific callback time was agreed with a human. NOT_INTERESTED if a human declined. VOICEMAIL if reached voicemail. IVR_BLOCKED if unable to get past an automated phone system. GATEKEEPER_BLOCKED if a human receptionist refused to connect.',
          },
          decision_maker_name: {
            type: 'string',
            description: 'Name of the person to send the email to. Extract ANY name mentioned as a contact.',
          },
          decision_maker_email: {
            type: 'string',
            description: 'Email address obtained during the call. Could be personal or general (reception@, info@). Include ANY email mentioned.',
          },
          best_callback_time: {
            type: 'string',
            description: 'When to call back, if specified by a human. Only set if a real person suggested a time.',
          },
          answered_by: {
            type: 'string',
            enum: ['human', 'ivr', 'voicemail', 'unknown'],
            description: 'Who or what answered the call.',
          },
        },
      },
      messages: [{
        role: 'system',
        content: 'Extract structured data from this call. CRITICAL: If ANY email was mentioned (even spoken as "X at Y dot com"), set call_outcome to LEAD_CAPTURED. If the call hit an automated phone menu, set call_outcome to IVR_BLOCKED.',
      }],
    },
    successEvaluationPlan: {
      enabled: true,
      rubric: 'AutomaticRubric',
    },
  },
}

async function main() {
  console.log('🚀 Deploying Sarah v4...')
  console.log('   Key changes from v3:')
  console.log('   ✅ Two-phase opener: identify → pitch (no more "quick one")')
  console.log('   ✅ assistant-speaks-first (was waits-for-user)')
  console.log('   ✅ IVR bail-out at ~15s (was looping for 120s)')
  console.log('   ✅ Voicemail detection enabled')
  console.log('   ✅ Max duration: 90s (was 120s)')
  console.log('   ✅ "From Arcadian" not "from ParkBunny"')
  console.log('')
  console.log('   First message: "' + FIRST_MESSAGE + '"')

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
  console.log('')
  console.log('✅ Sarah v4 deployed!')
  console.log('   firstMessageMode: ' + data.firstMessageMode)
  console.log('   firstMessage: ' + data.firstMessage)
  console.log('   Max duration: ' + data.maxDurationSeconds + 's')
  console.log('   Silence timeout: ' + data.silenceTimeoutSeconds + 's')
  console.log('   Voicemail detection: ' + (data.voicemailDetection?.enabled ? 'ON' : 'OFF'))
  
  // Verify the full config
  console.log('')
  console.log('🔍 Verification — fetching full assistant config...')
  const verify = await fetch(`${VAPI_API}/assistant/${ASSISTANT_ID}`, {
    headers: { Authorization: `Bearer ${VAPI_KEY}` },
  })
  const full = await verify.json()
  console.log('   Model: ' + full.model?.model)
  console.log('   Temperature: ' + full.model?.temperature)
  console.log('   System prompt length: ' + (full.model?.messages?.[0]?.content?.length || 0) + ' chars')
  console.log('   Structured data schema fields: ' + Object.keys(full.analysisPlan?.structuredDataPlan?.schema?.properties || {}).join(', '))
}

main().catch(console.error)
