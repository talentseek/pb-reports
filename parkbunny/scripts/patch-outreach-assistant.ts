/**
 * Patch the live Sarah assistant with the updated prompt and speaking settings.
 */
import 'dotenv/config'

const VAPI_KEY = process.env.VAPI_PRIVATE_API_KEY
const ASSISTANT_ID = '501d2196-59fe-4860-9f88-749dca9ac096'

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

async function main() {
  console.log('🔧 Patching Sarah assistant with updated prompt + speaking settings...')

  const patch = {
    model: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }],
      maxTokens: 500,
      temperature: 0.7,
    },
    // Slow down — more natural pauses
    startSpeakingPlan: {
      waitSeconds: 1.0,              // Was 0.6 — wait longer before responding
      smartEndpointingEnabled: true,
      transcriptionEndpointingPlan: {
        onNoPunctuationSeconds: 0.8,  // Was 0.5 — more patience
      },
    },
    stopSpeakingPlan: {
      numWords: 0,
      voiceSeconds: 0.3,   // Was 0.2 — slightly more tolerant of overlap
      backoffSeconds: 1.5,  // Was 1.0 — longer pause after being interrupted
    },
    // Slightly warmer voice settings
    voice: {
      provider: '11labs',
      voiceId: '5TRppDPuxBF23owe37hG',
      stability: 0.55,       // Was 0.5 — slightly more stable/less jittery
      similarityBoost: 0.8,
      model: 'eleven_turbo_v2_5',
      optimizeStreamingLatency: 3,
    },
  }

  const res = await fetch('https://api.vapi.ai/assistant/' + ASSISTANT_ID, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + VAPI_KEY,
    },
    body: JSON.stringify(patch),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('❌ PATCH failed (' + res.status + '):', text)
    process.exit(1)
  }

  const data = await res.json()
  console.log('✅ Updated successfully!')
  console.log('')
  console.log('Changes applied:')
  console.log('  📝 System prompt: +CRITICAL Name Handling section, +natural pacing instructions')
  console.log('  ⏱️  waitSeconds: 0.6 → 1.0 (slower response start)')
  console.log('  ⏱️  onNoPunctuationSeconds: 0.5 → 0.8 (more patience)')
  console.log('  ⏱️  backoffSeconds: 1.0 → 1.5 (longer pause after interruption)')
  console.log('  🎙️  stability: 0.5 → 0.55 (slightly warmer)')
  console.log('')
  console.log('Ready for testing!')
}

main().catch(console.error)
