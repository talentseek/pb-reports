/**
 * Park Bunny — Create Customer Support VAPI Assistant
 *
 * Usage:
 *   npx tsx scripts/create-support-assistant.ts
 *
 * Reads VAPI_PRIVATE_API_KEY from .env and creates a new inbound
 * customer-support assistant loaded with the 49 FAQ entries.
 *
 * On success, prints the new assistant ID to add to .env as
 * VAPI_SUPPORT_ASSISTANT_ID.
 */
import 'dotenv/config'
import { buildFAQPromptBlock, FAQ_TOTAL } from '../src/lib/park-bunny-faq'

const VAPI_API = 'https://api.vapi.ai'
const VAPI_KEY = process.env.VAPI_PRIVATE_API_KEY

if (!VAPI_KEY) {
  console.error('❌ VAPI_PRIVATE_API_KEY not set in .env')
  process.exit(1)
}

const SYSTEM_PROMPT = `You are Bunny, the friendly and professional customer support assistant for Park Bunny — a parking payment app used across the UK.

## Your Role
- Answer customer questions about the Park Bunny app accurately and concisely.
- Use the FAQ knowledge below as your primary source of truth.
- Be warm, patient, and reassuring — many callers may be stressed about parking charges or payment issues.
- Speak in a natural, conversational British English tone. Avoid jargon.

## Conversation Guidelines
1. **Greet warmly**: "Hi there, you're through to Park Bunny support, this is Bunny speaking. How can I help you today?"
2. **Listen carefully**: Let the caller finish their question before responding.
3. **Match to FAQ**: Find the closest matching FAQ answer. If multiple FAQs are relevant, address the most pressing one first.
4. **Be honest about limits**: If a question falls outside the FAQ topics, say: "That's a great question, but I'm not able to help with that one I'm afraid. For anything outside our usual questions, I'd recommend emailing our support team at support@parkbunny.com and they'll get back to you within 24 hours."
5. **Clarify when needed**: If the caller's question is ambiguous, ask a brief clarifying question.
6. **Summarise before ending**: "Just to make sure I've covered everything — is there anything else I can help you with today?"
7. **Sign off politely**: "Lovely, well thanks for calling Park Bunny. Have a great day!"

## Important Distinctions to Make Clear
- Park Bunny is a PAYMENT APP. It does NOT issue parking fines, PCNs, or enforce parking rules.
- Refunds are generally handled by the landowner or operator, not Park Bunny.
- Enforcement companies (not Park Bunny) manage parking charges and appeals.
- Grace periods and site rules vary by location.

## Escalation Rules
- If the caller is very upset or the issue requires account-level investigation, say: "I understand this is frustrating. Let me make a note of your details so our support team can look into this properly. Could you confirm your email address on file?"
- If the caller asks to speak to a human, say: "Absolutely, I'll make sure someone from our team gets back to you. Can I take your name and the best number to reach you on?"
- Never argue with a caller. Always empathise and offer the next step.

## FAQ Knowledge Base (${FAQ_TOTAL} questions)
Below is your complete reference. Answer based on these — do not make up information.

${buildFAQPromptBlock()}
`

const assistantPayload = {
  name: 'Park Bunny Customer Support',
  firstMessage:
    "Hi there, you're through to Park Bunny support, this is Bunny speaking. How can I help you today?",
  model: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
    ],
    maxTokens: 300,
    temperature: 0.3,
  },
  voice: {
    provider: '11labs',
    voiceId: 'sarah',
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
  maxDurationSeconds: 600,
  silenceTimeoutSeconds: 30,
  endCallMessage:
    "Thanks for calling Park Bunny. If you need anything else, don't hesitate to call back or email us at support@parkbunny.com. Have a great day!",
  analysisPlan: {
    summaryPlan: {
      enabled: true,
      messages: [
        {
          role: 'system',
          content:
            'Summarise this customer support call in 2-3 sentences. Include: the main question asked, the answer given, and whether the caller seemed satisfied.',
        },
      ],
    },
    structuredDataPlan: {
      enabled: true,
      schema: {
        type: 'object',
        properties: {
          call_category: {
            type: 'string',
            description:
              'The FAQ category that best matches the caller question. One of: Getting Started, Finding a Car Park, Parking Sessions, Payment Timing and Grace Periods, Pre-Booking and Pre-Payment, Payments Fees and Receipts, Refunds and Changes, Vehicle Details, Parking Charges PCNs and Appeals, Breakdowns and Exceptional Situations, Devices and Support, Other',
          },
          questions_asked: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of the main questions the caller asked',
          },
          resolved: {
            type: 'boolean',
            description: 'Whether the caller question was answered satisfactorily from the FAQ',
          },
          needs_human_followup: {
            type: 'boolean',
            description:
              'Whether the caller requested human contact or the issue requires account-level investigation',
          },
          caller_sentiment: {
            type: 'string',
            enum: ['positive', 'neutral', 'negative'],
            description: 'Overall sentiment of the caller during the conversation',
          },
          caller_name: {
            type: 'string',
            description: 'Name of the caller if provided',
          },
          caller_email: {
            type: 'string',
            description: 'Email address of the caller if provided',
          },
        },
      },
      messages: [
        {
          role: 'system',
          content:
            'Extract structured data from this customer support call transcript. Identify the FAQ category, questions asked, resolution status, and caller details.',
        },
      ],
    },
  },
  // Note: Set the webhook URL in the VAPI dashboard after deployment:
  // https://yourdomain.com/api/webhooks/vapi/support
}

async function main() {
  console.log('🐰 Creating Park Bunny Customer Support Assistant...')
  console.log(`   FAQ entries loaded: ${FAQ_TOTAL}`)
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
  console.log('✅ Assistant created successfully!')
  console.log('')
  console.log('┌─────────────────────────────────────────────┐')
  console.log(`│  Assistant ID: ${data.id}  │`)
  console.log('└─────────────────────────────────────────────┘')
  console.log('')
  console.log('Add this to your .env file:')
  console.log(`VAPI_SUPPORT_ASSISTANT_ID=${data.id}`)
  console.log('')
  console.log('Next steps:')
  console.log('  1. Add the ID to your .env')
  console.log('  2. Configure a VAPI phone number for inbound calls')
  console.log('  3. Set the webhook URL on the assistant to:')
  console.log('     https://your-domain.com/api/webhooks/vapi/support')
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
