/**
 * Export ALL B5 + B1 campaign transcripts with metadata for audit.
 * Outputs a structured JSON with every call's details.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'

const prisma = new PrismaClient()

const B5_CAMPAIGN_ID = 'cmnhd59hu0001sb6tcwyjymc9'

async function main() {
  const calls = await prisma.campaignBusiness.findMany({
    where: { campaignId: B5_CAMPAIGN_ID },
    include: {
      reportLocationPlace: {
        include: { place: { select: { name: true, phone: true, placeId: true, types: true } } }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  // Also fetch VAPI data for duration
  const vapiKey = process.env.VAPI_PRIVATE_API_KEY!
  
  const audits: any[] = []
  
  for (const call of calls) {
    if (!call.transcript || call.callStatus === 'DUPLICATE_SKIPPED' || call.callStatus === 'INVALID_NUMBER') {
      continue
    }
    
    const lines = call.transcript.split('\n').filter(Boolean)
    const sarahLines = lines.filter(l => l.startsWith('Sarah:'))
    const businessLines = lines.filter(l => l.startsWith('Business:'))
    const wordCount = call.transcript.split(/\s+/).length
    
    // Fetch duration from VAPI if we have a call ID
    let duration = call.callDuration || 0
    if (!duration && call.vapiCallId) {
      try {
        const res = await fetch(`https://api.vapi.ai/call/${call.vapiCallId}`, {
          headers: { Authorization: `Bearer ${vapiKey}` }
        })
        if (res.ok) {
          const data = await res.json()
          if (data.startedAt && data.endedAt) {
            duration = Math.round((new Date(data.endedAt).getTime() - new Date(data.startedAt).getTime()) / 1000)
          }
        }
      } catch {}
    }
    
    audits.push({
      business: call.reportLocationPlace.place.name,
      phone: call.reportLocationPlace.place.phone,
      type: call.reportLocationPlace.place.types,
      status: call.callStatus,
      endedReason: call.endedReason,
      duration,
      wordCount,
      sarahTurns: sarahLines.length,
      businessTurns: businessLines.length,
      transcript: call.transcript,
      extractedEmail: call.extractedEmail,
      extractedName: call.extractedName,
      callbackTime: call.callbackTime,
      summary: call.callSummary,
    })
  }

  // Sort by duration for analysis
  audits.sort((a, b) => a.duration - b.duration)
  
  writeFileSync('/tmp/b5-full-audit.json', JSON.stringify(audits, null, 2))
  console.log(`Exported ${audits.length} calls to /tmp/b5-full-audit.json`)
  
  // Quick stats
  const byStatus: Record<string, number> = {}
  const byDuration: Record<string, number> = { '0-5s': 0, '5-15s': 0, '15-30s': 0, '30-60s': 0, '60s+': 0 }
  
  for (const a of audits) {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1
    if (a.duration <= 5) byDuration['0-5s']++
    else if (a.duration <= 15) byDuration['5-15s']++
    else if (a.duration <= 30) byDuration['15-30s']++
    else if (a.duration <= 60) byDuration['30-60s']++
    else byDuration['60s+']++
  }
  
  console.log('\nBy Status:', JSON.stringify(byStatus, null, 2))
  console.log('\nBy Duration:', JSON.stringify(byDuration, null, 2))
  
  await prisma.$disconnect()
}

main()
