/**
 * Park Bunny — Create Outbound Outreach VAPI Assistant ("Sarah")
 *
 * Usage:
 *   npx tsx scripts/create-outreach-assistant.ts
 *
 * Reads VAPI_PRIVATE_API_KEY from .env and creates a new outbound
 * sales assistant configured with the gatekeeper pivot strategy
 * and structured data extraction for decision-maker info.
 *
 * On success, prints the new assistant ID. Store it in the
 * VoiceConfig table via the dashboard at /outreach/voice-config.
 *
 * NOTE: An assistant named "Sarah - ParkBunny Outreach" already
 * exists (ID: 501d2196-59fe-4860-9f88-749dca9ac096). This script
 * is for reproducibility — run it to create a fresh copy or to
 * update the configuration after prompt changes.
 */
import 'dotenv/config'

const VAPI_API = 'https://api.vapi.ai'
const VAPI_KEY = process.env.VAPI_PRIVATE_API_KEY

if (!VAPI_KEY) {
  console.error('❌ VAPI_PRIVATE_API_KEY not set in .env')
  process.exit(1)
}

const SYSTEM_PROMPT = `You are Sarah, a friendly and professional outreach caller from ParkBunny. Your goal is to speak with businesses near car parks that ParkBunny manages and offer them discounted parking for their staff and customers.

## Your Personality
- Warm, upbeat, professional British woman
- Naturally conversational — NOT robotic or scripted-sounding
- Take a breath between sentences. Don't rush. Pause briefly after the other person speaks before responding.
- Speak at a relaxed, friendly pace — like you're chatting with a colleague, not reading from a script
- Never pushy or aggressive
- Concise — respect that you are calling busy businesses

## Your Objective
Your PRIMARY goal is to extract the decision-maker's name and email address. The discount offer is your leverage to get this information.

## Strategy: The Gatekeeper Pivot
You will almost always reach a receptionist, bartender, clerk, or frontline staff member — NOT the decision-maker. Your approach:
1. Open by telling them you are giving their business discounted parking (not asking — telling)
2. Ask who handles staff perks or management decisions
3. Get their name and email to send discount codes
4. If they can't help, ask for the best time to call back

## CRITICAL: Name Handling
When someone gives you a name (e.g. "Steven Waite" or "speak to Sarah"), understand that:
- The person you are SPEAKING TO is almost certainly NOT that person — they are referring you to someone else
- Do NOT address the person you're speaking to by the referred name
- Instead say something like "Lovely, thanks for that. And what's the best email to reach [name] on?"
- Only use their name to address them if they explicitly say "that's me" or "I'm the manager"

## Handling Objections
- "We're not interested" → "No problem at all, thanks for your time. Have a great day!"
- "What's this about?" → "We manage the car park nearby and we're offering local businesses discounted parking for their staff and customers. Just trying to find the right person to send the details to."
- "Send it to our general email" → Accept it gracefully, that's still a win.
- "They're not available" → "No worries! Could I get the best time to call back and catch them?"
- "How did you get our number?" → "We're reaching out to businesses in the area around the car park we manage. Your details are publicly listed."

## Variables Available
- {{business_name}} — the name of the business being called
- {{carpark_name}} — the name of the car park ParkBunny manages

Use these naturally in conversation when relevant.

## Important Rules
- Keep responses SHORT — 1-2 sentences max
- Pause naturally between thoughts — do not blurt everything out at once
- Do NOT explain ParkBunny's full business model
- Do NOT mention footfall analysis, reports, or data
- Do NOT pressure anyone
- If they say no, thank them and end the call gracefully
- Maximum call duration: 2-3 minutes
- Always end with "Thanks so much for your time, have a lovely day!"`

const assistantPayload = {
  name: 'Sarah - ParkBunny Outreach',
  firstMessage:
    "Hi there, I'm Sarah calling from ParkBunny. We've just taken over the management of the car park nearby and I'm reaching out because we have a budget to offer your staff and customers exclusive discounted parking rates. I know you're likely busy, so I'm just trying to find out who handles staff perks or management decisions? Could I grab their name and the best email to send these discount codes to?",
  voicemailMessage:
    "Hi there, this is Sarah from ParkBunny. We manage the car park nearby and have some discounted parking rates available for your staff and customers. If you could ask your manager to give us a call back or drop me an email, that would be brilliant. Thanks so much, bye!",
  model: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
    ],
    maxTokens: 500,
    temperature: 0.7,
  },
  voice: {
    provider: '11labs',
    voiceId: '5TRppDPuxBF23owe37hG', // Same voice as Lilly (support agent) per user request
    stability: 0.6,
    similarityBoost: 0.8,
    model: 'eleven_turbo_v2_5',
    optimizeStreamingLatency: 3,
  },
  transcriber: {
    provider: 'deepgram',
    model: 'nova-2',
    language: 'en',
    smartFormat: true,
  },
  startSpeakingPlan: {
    waitSeconds: 0.6,
    smartEndpointingEnabled: true,
    transcriptionEndpointingPlan: {
      onNoPunctuationSeconds: 0.5,
    },
  },
  stopSpeakingPlan: {
    numWords: 0,
    voiceSeconds: 0.2,
    backoffSeconds: 1.0,
  },
  serverMessages: ['end-of-call-report', 'status-update'],
  endCallPhrases: ['goodbye', 'bye', 'thanks bye', 'have a good day'],
  maxDurationSeconds: 180,
  firstMessageMode: 'assistant-speaks-first',
  silenceTimeoutSeconds: 15,
  endCallMessage:
    "Thanks so much for your time, have a lovely day!",
  voicemailDetection: {
    enabled: true,
    provider: 'twilio',
    voicemailDetectionTypes: ['machine_end_beep', 'machine_end_silence'],
  },
  analysisPlan: {
    summaryPlan: {
      enabled: true,
      messages: [
        {
          role: 'system',
          content:
            'Summarise this outbound sales call in 2-3 sentences. Include: who answered (receptionist, manager, owner), the call outcome, and any contact details obtained.',
        },
      ],
    },
    structuredDataPlan: {
      enabled: true,
      schema: {
        type: 'object',
        properties: {
          call_outcome: {
            type: 'string',
            enum: [
              'LEAD_CAPTURED',
              'CALLBACK_BOOKED',
              'NOT_INTERESTED',
              'VOICEMAIL',
              'GATEKEEPER_BLOCKED',
            ],
            description: 'The outcome of the call',
          },
          decision_maker_name: {
            type: 'string',
            description:
              'The name of the manager or decision-maker mentioned in the conversation',
          },
          decision_maker_email: {
            type: 'string',
            description:
              'The email address provided to send parking discount codes to',
          },
          decision_maker_phone: {
            type: 'string',
            description:
              'Any direct phone number for the decision-maker if provided',
          },
          best_callback_time: {
            type: 'string',
            description:
              'The best time to call back if the decision-maker was unavailable',
          },
          who_answered: {
            type: 'string',
            description:
              'Role of the person who answered (e.g. receptionist, manager, owner, bartender)',
          },
          caller_sentiment: {
            type: 'string',
            enum: ['positive', 'neutral', 'negative'],
            description:
              'Overall sentiment of the person during the conversation',
          },
        },
      },
      messages: [
        {
          role: 'system',
          content:
            'Extract structured data from this outbound sales call transcript. Identify the call outcome, any decision-maker details captured, callback time, who answered, and their sentiment.',
        },
      ],
    },
    successEvaluationPlan: {
      enabled: true,
      rubric: 'AutomaticRubric',
    },
  },
  // Note: Set the webhook URL in the VAPI dashboard or via VoiceConfig after deployment:
  // https://yourdomain.com/api/webhooks/vapi
}

async function main() {
  console.log('📞 Creating ParkBunny Outreach Assistant (Sarah)...')
  console.log(`   System prompt length: ${SYSTEM_PROMPT.length} chars`)
  console.log('')

  const res = await fetch(`${VAPI_API}/assistant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${VAPI_KEY}`,
    },
    body: JSON.stringify(assistantPayload),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`❌ VAPI API error (${res.status}):`, text)
    process.exit(1)
  }

  const data = await res.json()
  console.log('✅ Outreach assistant created successfully!')
  console.log('')
  console.log('┌─────────────────────────────────────────────┐')
  console.log(`│  Assistant ID: ${data.id}`)
  console.log('└─────────────────────────────────────────────┘')
  console.log('')
  console.log('Next steps:')
  console.log('  1. Go to /outreach/voice-config and paste this ID into "VAPI Assistant ID"')
  console.log('  2. Configure the webhook URL on the VAPI dashboard:')
  console.log('     https://your-domain.com/api/webhooks/vapi')
  console.log('  3. Ensure a Twilio phone number is imported into VAPI')
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
