import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { dispatchCall, formatPhoneE164 } from '@/lib/voice-agent'

export async function GET() {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const config = await prisma.voiceConfig.findFirst()
    if (!config) return NextResponse.json({ configured: false })

    return NextResponse.json({
        configured: true,
        callingEnabled: config.callingEnabled,
        maxConcurrent: config.maxConcurrent,
        maxAttempts: config.maxAttempts,
        hasTwilio: !!config.twilioSid,
        hasVapi: !!config.vapiAssistantId,
        hasWebhookSecret: !!config.webhookSecret,
    })
}

export async function PATCH(request: NextRequest) {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
        twilioSid,
        twilioAuthToken,
        vapiApiKey,
        vapiAssistantId,
        vapiPhoneNumId,
        callingEnabled,
        maxConcurrent,
        maxAttempts,
        webhookSecret,
    } = body

    const existing = await prisma.voiceConfig.findFirst()

    if (existing) {
        const updated = await prisma.voiceConfig.update({
            where: { id: existing.id },
            data: {
                ...(twilioSid !== undefined && { twilioSid }),
                ...(twilioAuthToken !== undefined && { twilioAuthToken }),
                ...(vapiApiKey !== undefined && { vapiApiKey }),
                ...(vapiAssistantId !== undefined && { vapiAssistantId }),
                ...(vapiPhoneNumId !== undefined && { vapiPhoneNumId }),
                ...(callingEnabled !== undefined && { callingEnabled }),
                ...(maxConcurrent !== undefined && { maxConcurrent: Math.min(5, Math.max(1, maxConcurrent)) }),
                ...(maxAttempts !== undefined && { maxAttempts: Math.min(5, Math.max(1, maxAttempts)) }),
                ...(webhookSecret !== undefined && { webhookSecret }),
            },
        })
        return NextResponse.json({ id: updated.id, saved: true })
    }

    // Create new config
    if (!twilioSid || !twilioAuthToken || !vapiApiKey || !vapiAssistantId || !vapiPhoneNumId) {
        return NextResponse.json(
            { error: 'All credential fields are required for initial setup' },
            { status: 400 },
        )
    }

    const created = await prisma.voiceConfig.create({
        data: {
            twilioSid,
            twilioAuthToken,
            vapiApiKey,
            vapiAssistantId,
            vapiPhoneNumId,
            callingEnabled: callingEnabled ?? false,
            maxConcurrent: Math.min(5, Math.max(1, maxConcurrent ?? 1)),
            maxAttempts: Math.min(5, Math.max(1, maxAttempts ?? 3)),
            webhookSecret: webhookSecret ?? null,
        },
    })

    return NextResponse.json({ id: created.id, saved: true })
}

/**
 * POST: Test call — triggers Sarah to call a specified phone number.
 */
export async function POST(request: NextRequest) {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { action, phoneNumber } = await request.json()

    if (action !== 'test-call' || !phoneNumber) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const config = await prisma.voiceConfig.findFirst()
    if (!config) {
        return NextResponse.json({ error: 'Voice config not set up' }, { status: 400 })
    }

    const e164 = formatPhoneE164(phoneNumber)
    if (!e164) {
        return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    const vapiKey = process.env.VAPI_PRIVATE_API_KEY
    if (!vapiKey) {
        return NextResponse.json({ error: 'VAPI_PRIVATE_API_KEY not set' }, { status: 500 })
    }

    try {
        const res = await fetch('https://api.vapi.ai/call/phone', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${vapiKey}`,
            },
            body: JSON.stringify({
                assistantId: config.vapiAssistantId,
                phoneNumberId: config.vapiPhoneNumId,
                customer: { number: e164, name: 'Test Call' },
                assistantOverrides: {
                    variableValues: {
                        business_name: 'Test Business',
                        carpark_name: 'ParkBunny Test Car Park',
                    },
                },
            }),
        })

        if (!res.ok) {
            const text = await res.text().catch(() => '')
            return NextResponse.json({ error: `Vapi error: ${res.status}`, details: text }, { status: 502 })
        }

        const data = await res.json()
        return NextResponse.json({ callId: data.id, status: 'calling' })
    } catch (err) {
        return NextResponse.json({ error: 'Failed to dispatch test call' }, { status: 500 })
    }
}
