import 'dotenv/config'

const VAPI_KEY = process.env.VAPI_PRIVATE_API_KEY
const CALL_ID = '019d3f08-700e-733a-afe5-2ee28d9defa0'

async function main() {
  const res = await fetch('https://api.vapi.ai/call/' + CALL_ID, {
    headers: { Authorization: 'Bearer ' + VAPI_KEY }
  })
  const data = await res.json()

  console.log('📞 Call Report')
  console.log('═'.repeat(60))
  console.log('  Status: ' + data.status)
  console.log('  Duration: ' + (data.costBreakdown?.duration ?? data.duration ?? '?') + 's')
  console.log('  Ended Reason: ' + (data.endedReason ?? '?'))
  console.log('')

  if (data.analysis) {
    if (data.analysis.summary) {
      console.log('📝 Summary:')
      console.log('  ' + data.analysis.summary)
      console.log('')
    }
    if (data.analysis.structuredData) {
      console.log('📊 Structured Data Extracted:')
      const sd = data.analysis.structuredData
      for (const [key, value] of Object.entries(sd)) {
        console.log('  ' + key + ': ' + value)
      }
      console.log('')
    }
    if (data.analysis.successEvaluation) {
      console.log('✅ Success Evaluation: ' + data.analysis.successEvaluation)
      console.log('')
    }
  }

  if (data.transcript) {
    console.log('🎙️ Transcript:')
    console.log('─'.repeat(60))
    console.log(data.transcript)
    console.log('─'.repeat(60))
  }

  if (data.recordingUrl) {
    console.log('')
    console.log('🔊 Recording: ' + data.recordingUrl)
  }

  if (data.costBreakdown) {
    console.log('')
    console.log('💰 Cost: $' + (data.costBreakdown.total ?? '?'))
  }
}

main().catch(console.error)
