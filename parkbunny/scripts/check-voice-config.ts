import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const config = await prisma.voiceConfig.findFirst()
  if (!config) {
    console.log('❌ No VoiceConfig found in database')
    
    const res = await fetch('https://api.vapi.ai/phone-number', {
      headers: { Authorization: 'Bearer ' + process.env.VAPI_PRIVATE_API_KEY }
    })
    const phones = await res.json()
    console.log('')
    console.log('📞 VAPI Phone Numbers available:')
    if (Array.isArray(phones)) {
      for (const p of phones) {
        console.log('  ID: ' + p.id)
        console.log('  Number: ' + p.number)
        console.log('  Provider: ' + p.provider)
        console.log('  Name: ' + (p.name ?? '—'))
        console.log('')
      }
    } else {
      console.log(JSON.stringify(phones, null, 2))
    }
  } else {
    console.log('✅ VoiceConfig found:')
    console.log('  vapiAssistantId: ' + config.vapiAssistantId)
    console.log('  vapiPhoneNumId: ' + config.vapiPhoneNumId)
    console.log('  callingEnabled: ' + config.callingEnabled)
    console.log('  maxConcurrent: ' + config.maxConcurrent)
    console.log('  maxAttempts: ' + config.maxAttempts)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
