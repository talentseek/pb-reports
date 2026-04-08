/**
 * Full call-by-call audit of B5 campaign.
 * Grades every call and identifies specific improvements.
 */
import { readFileSync, writeFileSync } from 'fs'

interface CallAudit {
  business: string
  phone: string
  type: string
  status: string
  endedReason: string
  duration: number
  wordCount: number
  sarahTurns: number
  businessTurns: number
  transcript: string
  extractedEmail: string | null
  extractedName: string | null
  callbackTime: string | null
  summary: string | null
}

interface GradedCall {
  business: string
  status: string
  duration: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  category: string
  problems: string[]
  improvements: string[]
  transcript_snippet: string
}

const calls: CallAudit[] = JSON.parse(readFileSync('/tmp/b5-full-audit.json', 'utf-8'))
const graded: GradedCall[] = []

// ------ Pattern Detection Functions ------

function detectProblems(call: CallAudit): string[] {
  const problems: string[] = []
  const t = call.transcript

  // 1. Sarah speaks before human greeting
  if (t.startsWith('Sarah:') && !t.includes('Business:')) {
    problems.push('NO_HUMAN_RESPONSE: Sarah spoke but no human response detected')
  }
  
  const lines = t.split('\n').filter(Boolean)
  const firstSarah = lines.find(l => l.startsWith('Sarah:'))
  const firstBusiness = lines.find(l => l.startsWith('Business:'))
  
  // 2. Sarah starts before business greets
  if (firstSarah && firstBusiness && lines.indexOf(firstSarah) < lines.indexOf(firstBusiness)) {
    // Check if Sarah's first line is before business's first line (expected for outbound)
    // But if business line is just a short "Hello?" this is fine
  }

  // 3. Sarah repeats herself
  const sarahLines = lines.filter(l => l.startsWith('Sarah:'))
  if (sarahLines.length >= 2) {
    const first = sarahLines[0].slice(7).trim().toLowerCase().slice(0, 50)
    const second = sarahLines[1]?.slice(7).trim().toLowerCase().slice(0, 50)
    if (first && second && first === second) {
      problems.push('SARAH_REPEATS: Sarah repeated her opener verbatim')
    }
  }

  // 4. Sarah talks over the person 
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].startsWith('Business:') && lines[i].length < 30 && 
        lines[i + 1]?.startsWith('Sarah:') && lines[i + 1].length > 100) {
      // Short business response followed by long Sarah response = potential talk-over
      if (/hello|hi |what|sorry/i.test(lines[i])) {
        problems.push('TALK_OVER: Sarah may have talked over a greeting/question')
        break
      }
    }
  }

  // 5. IVR loop detection
  const ivrMenuCount = (t.match(/press \d|option \d|please select/gi) || []).length
  if (ivrMenuCount >= 3) {
    problems.push(`IVR_LOOP: Menu repeated ${ivrMenuCount} times, Sarah couldn't navigate`)
  }
  
  // 6. Sarah says "I'll press X" (can't send DTMF)
  if (/I'll press|I will press|let me press|pressing/i.test(t)) {
    problems.push('DTMF_ATTEMPT: Sarah tried to press buttons (cannot send DTMF)')
  }

  // 7. Ultra-short call (< 10s with transcript)
  if (call.duration < 10 && call.wordCount > 5) {
    problems.push(`ULTRA_SHORT: ${call.duration}s call — likely immediate hang-up or latency issue`)
  }

  // 8. Sarah says wrong name
  if (/park buddy|parkbuddy/i.test(t)) {
    problems.push('WRONG_NAME: Sarah said "Park Buddy" instead of "ParkBunny"')
  }

  // 9. "Quick one" too casual for business
  if (/quick one|quick 1/i.test(t)) {
    problems.push('TOO_CASUAL: "Quick one" may sound unprofessional for some businesses')
  }

  // 10. Max duration reached — Sarah got stuck
  if (call.endedReason === 'exceeded-max-duration' || call.endedReason === 'max-duration-reached') {
    problems.push('MAX_DURATION: Call hit 2-minute limit — Sarah got stuck somewhere')
  }
  
  // 11. Silence timeout
  if (call.endedReason === 'silence-timed-out' && call.businessTurns > 0) {
    problems.push('SILENCE_TIMEOUT: Conversation went silent after initial exchange')
  }

  // 12. Sarah gives full pitch to IVR
  if (/press \d/i.test(t) && /discounted parking/i.test(t)) {
    problems.push('PITCH_TO_IVR: Sarah pitched to an automated system')
  }

  // 13. Sarah says "operator" multiple times
  const operatorCount = (t.match(/\boperator\b|reception please/gi) || []).length
  if (operatorCount >= 3) {
    problems.push(`STUCK_IN_MENU: Said "operator"/"reception" ${operatorCount} times without getting through`)
  }

  // 14. Customer said "not interested" but Sarah continued
  const notInterestedIdx = t.indexOf('not interested')
  if (notInterestedIdx > 0) {
    const afterNotInterested = t.slice(notInterestedIdx + 15)
    if (/discount|parking|send/i.test(afterNotInterested) && afterNotInterested.includes('Sarah:')) {
      problems.push('PUSHED_PAST_NO: Sarah continued pitching after "not interested"')
    }
  }

  return problems
}

function suggestImprovements(call: CallAudit, problems: string[]): string[] {
  const improvements: string[] = []
  
  for (const p of problems) {
    if (p.startsWith('NO_HUMAN_RESPONSE')) {
      improvements.push('Add AMD detection or wait for human greeting before starting')
    }
    if (p.startsWith('SARAH_REPEATS')) {
      improvements.push('Fix first-message overlap — Sarah should not repeat her opener')
    }
    if (p.startsWith('TALK_OVER')) {
      improvements.push('Add pause after business speaks — wait 1s before responding')
    }
    if (p.startsWith('IVR_LOOP')) {
      improvements.push('Bail out of IVR after 2 menu repeats instead of looping')
    }
    if (p.startsWith('DTMF_ATTEMPT')) {
      improvements.push('Use verbal commands ("reception please") not button presses')
    }
    if (p.startsWith('ULTRA_SHORT')) {
      improvements.push('Investigate: likely latency or AMD false positive. Consider faster TTS model')
    }
    if (p.startsWith('WRONG_NAME')) {
      improvements.push('Add explicit "Say ParkBunny, NEVER Park Buddy" to prompt')
    }
    if (p.startsWith('TOO_CASUAL')) {
      improvements.push('Use "Hi, It\'s Sarah from ParkBunny" instead of "Quick one"')
    }
    if (p.startsWith('MAX_DURATION')) {
      improvements.push('Sarah should detect when stuck and gracefully exit earlier')
    }
    if (p.startsWith('PITCH_TO_IVR')) {
      improvements.push('Detect IVR before starting pitch — listen for menu indicators first')
    }
    if (p.startsWith('PUSHED_PAST_NO')) {
      improvements.push('Sarah MUST accept "no" immediately — end with "No problem, cheers!"')
    }
  }
  
  // General improvements based on outcome
  if (call.status === 'NOT_INTERESTED' && call.duration > 15 && call.businessTurns >= 2) {
    improvements.push('Had real conversation — analyze objection and add specific handling')
  }
  if (call.status === 'CALLBACK_BOOKED' && !call.callbackTime) {
    improvements.push('Got a callback mention but no specific time captured — improve extraction')
  }
  
  return Array.from(new Set(improvements))
}

function gradeCall(call: CallAudit): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (call.status === 'LEAD_CAPTURED') return 'A'
  if (call.status === 'CALLBACK_BOOKED') return 'B'
  if (call.status === 'NOT_INTERESTED' && call.businessTurns >= 3 && call.duration > 30) return 'C' // Good conversation, they said no
  if (call.status === 'VOICEMAIL') return 'C' // Expected, not a problem
  if (call.status === 'NOT_INTERESTED' && call.duration > 15) return 'C'
  if (call.status === 'IVR_BLOCKED') return 'D'
  if (call.status === 'NOT_INTERESTED' && call.duration < 10) return 'D'
  if (call.status === 'FAILED') return 'F'
  return 'D'
}

function categorize(call: CallAudit): string {
  const t = call.transcript.toLowerCase()
  if (/press \d|option \d|please select|menu/i.test(t) && call.businessTurns < 2) return 'IVR_SYSTEM'
  if (call.duration < 10 && call.wordCount < 30) return 'INSTANT_HANGUP'
  if (call.status === 'VOICEMAIL') return 'VOICEMAIL'
  if (call.status === 'LEAD_CAPTURED') return 'SUCCESSFUL_LEAD'
  if (call.status === 'CALLBACK_BOOKED') return 'CALLBACK_AGREED'
  if (/not interested|no thank|not at the moment/i.test(t)) return 'POLITE_DECLINE'
  if (/what is this|who is this|what's this about/i.test(t)) return 'GATEKEEPER_CHALLENGE'
  if (/transferred|transferring|put you through/i.test(t)) return 'TRANSFER_ATTEMPTED'
  if (call.duration > 30) return 'REAL_CONVERSATION'
  return 'SHORT_EXCHANGE'
}

// ------ Process Every Call ------

for (const call of calls) {
  const problems = detectProblems(call)
  const improvements = suggestImprovements(call, problems)
  const grade = gradeCall(call)
  const category = categorize(call)
  
  // Get first 200 chars of transcript for snippet
  const snippet = call.transcript.slice(0, 300).replace(/\n/g, ' | ')
  
  graded.push({
    business: call.business,
    status: call.status,
    duration: call.duration,
    grade,
    category,
    problems,
    improvements,
    transcript_snippet: snippet,
  })
}

// ------ Generate Report ------

// Sort: F first, then D, C, B, A
const gradeOrder = { F: 0, D: 1, C: 2, B: 3, A: 4 }
graded.sort((a, b) => gradeOrder[a.grade] - gradeOrder[b.grade])

let report = `# B5 Campaign — Full Call-by-Call Audit\n\n`
report += `**Total Calls Audited:** ${graded.length}\n\n`

// Grade distribution
const gradeDist: Record<string, number> = {}
for (const g of graded) gradeDist[g.grade] = (gradeDist[g.grade] || 0) + 1
report += `## Grade Distribution\n\n`
report += `| Grade | Count | % |\n|---|---|---|\n`
for (const g of ['A', 'B', 'C', 'D', 'F']) {
  const count = gradeDist[g] || 0
  report += `| ${g} | ${count} | ${Math.round(count / graded.length * 100)}% |\n`
}

// Category distribution
const catDist: Record<string, number> = {}
for (const g of graded) catDist[g.category] = (catDist[g.category] || 0) + 1
report += `\n## Category Breakdown\n\n`
report += `| Category | Count | % |\n|---|---|---|\n`
for (const [cat, count] of Object.entries(catDist).sort((a, b) => b[1] - a[1])) {
  report += `| ${cat} | ${count} | ${Math.round(count / graded.length * 100)}% |\n`
}

// Problem frequency
const problemFreq: Record<string, number> = {}
for (const g of graded) {
  for (const p of g.problems) {
    const key = p.split(':')[0]
    problemFreq[key] = (problemFreq[key] || 0) + 1
  }
}
report += `\n## Most Common Problems\n\n`
report += `| Problem | Count | % of calls |\n|---|---|---|\n`
for (const [prob, count] of Object.entries(problemFreq).sort((a, b) => b[1] - a[1])) {
  report += `| ${prob} | ${count} | ${Math.round(count / graded.length * 100)}% |\n`
}

// Duration analysis
report += `\n## Duration Analysis\n\n`
const durationBuckets = [
  { label: '0-5s (instant hangup)', min: 0, max: 5 },
  { label: '6-10s (near-instant)', min: 6, max: 10 },
  { label: '11-20s (short exchange)', min: 11, max: 20 },
  { label: '21-45s (brief conversation)', min: 21, max: 45 },
  { label: '46-90s (full conversation)', min: 46, max: 90 },
  { label: '90s+ (long/stuck)', min: 91, max: 9999 },
]
report += `| Bucket | Count | Avg Grade |\n|---|---|---|\n`
for (const b of durationBuckets) {
  const bucket = graded.filter(g => g.duration >= b.min && g.duration <= b.max)
  if (bucket.length === 0) continue
  const avgGrade = bucket.reduce((sum, g) => sum + gradeOrder[g.grade], 0) / bucket.length
  const gradeLabel = avgGrade < 1 ? 'F' : avgGrade < 2 ? 'D' : avgGrade < 3 ? 'C' : avgGrade < 4 ? 'B' : 'A'
  report += `| ${b.label} | ${bucket.length} | ${gradeLabel} (${avgGrade.toFixed(1)}) |\n`
}

// Every single call
report += `\n---\n\n## Individual Call Grades\n\n`
for (const g of graded) {
  const emoji = { A: '🎯', B: '📅', C: '⚪', D: '🟡', F: '🔴' }[g.grade]
  report += `### ${emoji} ${g.business} — Grade ${g.grade}\n`
  report += `- **Status:** ${g.status} | **Duration:** ${g.duration}s | **Category:** ${g.category}\n`
  if (g.problems.length > 0) {
    report += `- **Problems:** ${g.problems.join('; ')}\n`
  }
  if (g.improvements.length > 0) {
    report += `- **Improvements:** ${g.improvements.join('; ')}\n`
  }
  report += `- **Snippet:** \`${g.transcript_snippet.slice(0, 200)}...\`\n\n`
}

writeFileSync('/tmp/b5-audit-report.md', report)
console.log(`\nAudit report written to /tmp/b5-audit-report.md (${report.length} chars)`)
console.log(`\nGrade distribution:`, gradeDist)
console.log(`Problem frequency:`, Object.entries(problemFreq).sort((a, b) => b[1] - a[1]).slice(0, 10))
