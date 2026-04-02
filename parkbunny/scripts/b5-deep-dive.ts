/**
 * Deep dive: dump ALL B5 campaign transcripts to a file for analysis.
 * Groups by actual outcome pattern, not just the status label.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'

const prisma = new PrismaClient()
const CAMPAIGN_ID = 'cmnhd59hu0001sb6tcwyjymc9'

async function main() {
  const calls = await prisma.campaignBusiness.findMany({
    where: { campaignId: CAMPAIGN_ID, callStatus: { notIn: ['IVR_BLOCKED', 'DUPLICATE_SKIPPED', 'PENDING', 'QUEUED'] } },
    include: { reportLocationPlace: { include: { place: { select: { name: true, phone: true } } } } },
    orderBy: { callStatus: 'asc' },
  })

  const lines: string[] = []
  const patterns: Record<string, { count: number; examples: string[] }> = {}

  for (const c of calls) {
    const name = c.reportLocationPlace.place.name
    const phone = c.reportLocationPlace.place.phone || '?'
    const status = c.callStatus
    const ended = c.endedReason || '?'
    const dur = c.callDuration ?? 0
    const summary = c.callSummary || 'NO SUMMARY'
    const transcript = c.transcript || 'NO TRANSCRIPT'
    
    // Classify the actual pattern
    let pattern = 'UNKNOWN'
    const t = transcript.toLowerCase()
    const s = summary.toLowerCase()
    
    if (transcript === 'NO TRANSCRIPT' && summary === 'NO SUMMARY') {
      if (ended === 'customer-ended-call' && dur === 0) pattern = 'INSTANT_HANGUP'
      else if (ended === 'machine-detected') pattern = 'VOICEMAIL_DETECTED'
      else if (ended === 'silence-timed-out') pattern = 'SILENCE_TIMEOUT'
      else if (ended === 'customer-ended-call') pattern = 'HANGUP_NO_CONVERSATION'
      else if (ended.includes('failed')) pattern = 'CALL_FAILED'
      else pattern = 'NO_DATA_' + ended
    } else if (t.includes('automated') || t.includes('press') || t.includes('option') || t.includes('menu')) {
      pattern = 'IVR_SYSTEM'
    } else if (t.includes('voicemail') || t.includes('leave a message') || t.includes('not available') || t.includes('after the tone') || t.includes('answering machine')) {
      pattern = 'VOICEMAIL_MESSAGE'
    } else if (dur <= 5) {
      pattern = 'ULTRA_SHORT'
    } else if (t.includes('not interested') || t.includes('no thank') || t.includes('no thanks')) {
      pattern = 'EXPLICIT_REJECTION'
    } else if (t.includes('email') || t.includes('@') || t.includes('send it to')) {
      pattern = 'HAD_EMAIL_DISCUSSION'
    } else if (t.includes('call back') || t.includes('ring back') || t.includes('try again')) {
      pattern = 'CALLBACK_SUGGESTED'
    } else if (t.includes('manager') || t.includes('owner') || t.includes('boss')) {
      pattern = 'GATEKEEPER_REDIRECT'
    } else if (dur <= 15) {
      pattern = 'SHORT_CONVERSATION'
    } else {
      pattern = 'CONVERSATION_' + status
    }

    if (!patterns[pattern]) patterns[pattern] = { count: 0, examples: [] }
    patterns[pattern].count++
    if (patterns[pattern].examples.length < 5) {
      patterns[pattern].examples.push(name)
    }

    lines.push('═'.repeat(80))
    lines.push(`📍 ${name}`)
    lines.push(`📞 ${phone} | Status: ${status} | Ended: ${ended} | Duration: ${dur}s`)
    lines.push(`🏷️  Pattern: ${pattern}`)
    lines.push('')
    lines.push('SUMMARY: ' + summary)
    lines.push('')
    lines.push('TRANSCRIPT:')
    lines.push(transcript)
    lines.push('')
  }

  // Build pattern summary at the top
  const header: string[] = []
  header.push('╔══════════════════════════════════════════════════════════════╗')
  header.push('║  B5 4TD ARCADIAN — DEEP DIVE TRANSCRIPT ANALYSIS           ║')
  header.push('║  Campaign: ' + CAMPAIGN_ID + '                  ║')
  header.push('║  Total calls analysed: ' + calls.length.toString().padEnd(37) + '║')
  header.push('╚══════════════════════════════════════════════════════════════╝')
  header.push('')
  header.push('=== PATTERN BREAKDOWN ===')
  header.push('')
  
  const sorted = Object.entries(patterns).sort((a, b) => b[1].count - a[1].count)
  for (const [pattern, data] of sorted) {
    header.push(`${pattern.padEnd(30)} ${data.count.toString().padStart(3)} calls  (${data.examples.slice(0, 3).join(', ')})`)
  }
  header.push('')
  header.push('=== FULL TRANSCRIPTS BELOW ===')
  header.push('')

  const output = [...header, ...lines].join('\n')
  writeFileSync('/tmp/b5-deep-dive.txt', output)
  
  // Also print pattern summary to console
  console.log(header.join('\n'))
  
  await prisma.$disconnect()
}

main().catch(console.error)
