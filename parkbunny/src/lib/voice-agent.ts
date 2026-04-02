import prisma from '@/lib/db'
import type { CampaignBusiness, CallStatus } from '@prisma/client'

const VAPI_API_URL = 'https://api.vapi.ai'

// ─── Phone formatting ───

export function formatPhoneE164(phone: string): string | null {
    try {
        // Strip spaces, dashes, parentheses
        let clean = phone.replace(/[\s\-()]/g, '')

        // Handle +44 prefix
        if (clean.startsWith('+44')) {
            clean = '0' + clean.slice(3)
        } else if (clean.startsWith('44') && clean.length > 10) {
            clean = '0' + clean.slice(2)
        }

        // Must start with 0 and be 10-11 digits
        if (!clean.startsWith('0')) return null
        if (clean.length < 10 || clean.length > 11) return null
        
        // Must be a valid UK prefix
        if (!/^0[1-9]/.test(clean)) return null

        // Convert to E.164: +44 + number without leading 0
        return '+44' + clean.slice(1)
    } catch {
        return null
    }
}

// ─── Calling window ───

export function isWithinCallingWindow(): boolean {
    const now = new Date()
    const ukFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        hour: 'numeric',
        minute: 'numeric',
        weekday: 'short',
        hour12: false,
    })
    const parts = ukFormatter.formatToParts(now)
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10)
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10)
    const weekday = parts.find(p => p.type === 'weekday')?.value ?? ''

    // Mon-Fri only
    if (['Sat', 'Sun'].includes(weekday)) return false

    const t = hour * 60 + minute
    // 10:00–11:30 or 14:30–16:30
    return (t >= 600 && t <= 690) || (t >= 870 && t <= 990)
}

// ─── Vapi call dispatch ───

export interface DispatchResult {
    vapiCallId: string
    success: true
}

export interface DispatchError {
    success: false
    error: string
}

export async function dispatchCall(
    cb: CampaignBusiness & { reportLocationPlace: { place: { name: string; phone: string | null } } },
    carparkName: string,
    config: { vapiAssistantId: string; vapiPhoneNumId: string },
): Promise<DispatchResult | DispatchError> {
    const phone = cb.reportLocationPlace.place.phone
    if (!phone) return { success: false, error: 'no_phone' }

    const e164 = formatPhoneE164(phone)
    if (!e164) return { success: false, error: 'invalid_number' }

    const businessName = cb.reportLocationPlace.place.name.slice(0, 40)

    const payload = {
        assistantId: config.vapiAssistantId,
        phoneNumberId: config.vapiPhoneNumId,
        customer: { number: e164, name: businessName },
        assistantOverrides: {
            variableValues: {
                business_name: businessName,
                carpark_name: carparkName,
            },
        },
        metadata: {
            campaignBusinessId: cb.id,
            reportLocationPlaceId: cb.reportLocationPlaceId,
        },
    }

    const vapiKey = process.env.VAPI_PRIVATE_API_KEY
    if (!vapiKey) return { success: false, error: 'no_vapi_key' }

    try {
        const res = await fetch(`${VAPI_API_URL}/call/phone`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${vapiKey}`,
            },
            body: JSON.stringify(payload),
        })

        if (!res.ok) {
            const text = await res.text().catch(() => '')
            console.error('Vapi dispatch error', res.status, text)
            return { success: false, error: `vapi_${res.status}` }
        }

        const data = await res.json()
        return { success: true, vapiCallId: data.id }
    } catch (err) {
        console.error('Vapi dispatch exception', err)
        return { success: false, error: 'network_error' }
    }
}

// ─── Webhook processing ───

export interface ProcessedCallResult {
    callStatus: CallStatus
    callSummary: string | null
    transcript: string | null
    recordingUrl: string | null
    callDuration: number | null
    extractedName: string | null
    extractedEmail: string | null
    extractedPhone: string | null
    callbackTime: string | null
    endedReason: string | null
}

// ─── Transcript intelligence ───

const IVR_KEYWORDS = /\bpress \d|press the hash|press option|please hold|your call cannot be transferred|option \d|please select|for .+ press|dial \d|menu loop|automated system|to hear (these|this|the) options? again/i

const CALLBACK_KEYWORDS = /\b(call.{0,5}back|ring.{0,5}back|try again (later|tomorrow)|come back|call .{0,10}(tomorrow|later|morning|afternoon)|call us.{0,5}back)\b/i

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+\s*(?:@|at)\s*[a-zA-Z0-9.-]+\s*(?:\.|dot)\s*(?:com?|co\s*\.?\s*u\s*k|org|net|uk)/gi

function extractEmailFromTranscript(transcript: string): string | null {
    // Split transcript into Sarah's lines and Business lines
    // We want emails that are GIVEN BY the business in conversation,
    // not IVR scripts mentioning website URLs
    
    const lines = transcript.split('\n')
    
    // Strategy 1: Look for email explicitly mentioned after Sarah asks for it
    // Find lines where the business responds to Sarah's email question
    const emailContextPatterns = [
        /(?:send it to|email (?:is|address)|it's|that's)\s+([a-zA-Z0-9][\w\s.]{0,30}?)\s*(?:at|@)\s*([a-zA-Z0-9][\w\s.]{0,30}?)\s*dot\s*(co\s*dot\s*u\s*k|com|org|net|uk|io)/i,
        /(?:send it to|email (?:is|address)|it's|that's)\s+([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    ]
    
    for (const line of lines) {
        // Only check Business lines (not Sarah's lines)
        if (line.startsWith('Sarah:')) continue
        
        for (const pattern of emailContextPatterns) {
            const match = line.match(pattern)
            if (match) {
                if (match[3]) {
                    // Spoken email: reconstruct
                    const local = match[1].trim().replace(/\s+/g, '').replace(/dot/gi, '.')
                    const domain = match[2].trim().replace(/\s+/g, '').replace(/dot/gi, '.')
                    const tld = match[3].replace(/\s+/g, '').replace(/dot/gi, '.')
                    const email = (local + '@' + domain + '.' + tld).toLowerCase()
                    if (email.length < 50) return email
                } else {
                    // Literal email
                    const email = (match[1] + '@' + match[2]).toLowerCase()
                    if (email.length < 50) return email
                }
            }
        }
    }
    
    // Strategy 1.5: Broader spoken email on business lines  
    // Catches "claudia dot white at h i e birmingham city dot com"
    const IVR_LINE_MARKERS = /\bpress \d|option \d|please hold|please select|booking|website|visit|online|chat service|dial \d|for .+ press|opening hours|menu|automated/i
    // Strip context-setting prefixes, NOT email words like "mail" or "back"
    const CONTEXT_PREFIX = /^(say|please|it's|that's|is that|so|if you send it to|send it to| )\s*/i
    
    function cleanEmailParts(raw: string): string {
        let cleaned = raw.trim()
        for (let i = 0; i < 3; i++) {
            cleaned = cleaned.replace(CONTEXT_PREFIX, '').trim()
        }
        return cleaned.replace(/\s+/g, '').replace(/dot/gi, '.')
    }
    
    for (const line of lines) {
        if (line.startsWith('Sarah:')) continue
        // Skip IVR/automated recording lines — they mention websites, not real emails
        if (IVR_LINE_MARKERS.test(line)) continue
        // Generic spoken email: word(s) "at" word(s) "dot" tld
        const broadMatch = line.match(
            /([a-zA-Z][a-zA-Z0-9\s.]{0,30}?)\s+at\s+([a-zA-Z][a-zA-Z0-9\s.]{0,30}?)\s+dot\s+(co\s+dot\s+u\s+k|com|org|net|uk|io)/i
        )
        if (broadMatch) {
            const local = cleanEmailParts(broadMatch[1])
            const domain = cleanEmailParts(broadMatch[2])
            const tld = broadMatch[3].replace(/\s+/g, '').replace(/dot/gi, '.')
            const email = (local + '@' + domain + '.' + tld).toLowerCase()
            if (email.length > 5 && email.length < 50 && /^[a-z0-9.]+@[a-z0-9.]+\.[a-z.]+$/.test(email)) {
                return email
            }
        }
    }
    
    // Strategy 2: Check ALL lines (including Sarah's) for confirmed/mentioned email
    // Sarah often confirms: "is that mail at o2 academy..." or "I'll pop those over to back to back at..."
    for (const line of lines) {
        const confirmMatch = line.match(
            /([a-zA-Z][a-zA-Z0-9\s.]{0,25}?)\s+(?:at|@)\s+([a-zA-Z][a-zA-Z0-9\s.]{0,25}?)\s+dot\s+(co\s+dot\s+u\s+k|com|org|net|uk|io)/i
        )
        if (confirmMatch) {
            // Skip if this looks like IVR content
            if (IVR_LINE_MARKERS.test(line)) continue
            const local = cleanEmailParts(confirmMatch[1])
            const domain = cleanEmailParts(confirmMatch[2])
            const tld = confirmMatch[3].replace(/\s+/g, '').replace(/dot/gi, '.')
            const email = (local + '@' + domain + '.' + tld).toLowerCase()
            if (email.length > 5 && email.length < 50 && /^[a-z0-9.]+@[a-z0-9.]+\.[a-z.]+$/.test(email)) {
                return email
            }
        }
    }
    
    // Strategy 3: Last resort — look for literal @ anywhere in business speech
    // but only if it looks like a real email (short, has proper structure)
    for (const line of lines) {
        if (line.startsWith('Sarah:')) continue
        const literalMatch = line.match(/([a-zA-Z0-9._%+-]{2,30})@([a-zA-Z0-9.-]{2,30}\.[a-zA-Z]{2,6})/)
        if (literalMatch) {
            const email = literalMatch[0].toLowerCase()
            // Filter out obvious non-emails
            if (email.length < 50 && !email.includes('www.') && !email.includes('http')) {
                return email
            }
        }
    }

    return null
}

function extractNameFromTranscript(transcript: string): string | null {
    // Look for patterns like "send it to [Name]" or "speak to [Name]" or "[Name] speaking"
    const patterns = [
        /(?:this is|speaking|my name is|I'm|I am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
        /(?:send it to|speak to|ask for|put you through to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+speaking/,
    ]
    for (const p of patterns) {
        const match = transcript.match(p)
        if (match) {
            const name = match[1].trim()
            // Filter out common false positives
            if (['Sarah', 'Park', 'Bunny', 'Quick', 'Hello', 'Thanks', 'Sorry'].includes(name)) continue
            if (name.length >= 2 && name.length <= 30) return name
        }
    }
    return null
}

function detectCallbackTime(transcript: string): string | null {
    const patterns = [
        /call.{0,5}back\s+(tomorrow|monday|tuesday|wednesday|thursday|friday)/i,
        /try again\s+(tomorrow|later|in the morning|this afternoon)/i,
        /(tomorrow|monday|tuesday|wednesday|thursday|friday)\s*(?:morning|afternoon|late)?\s*(?:would be|is)?\s*(?:best|good|better)/i,
    ]
    for (const p of patterns) {
        const match = transcript.match(p)
        if (match) return match[0].trim()
    }
    return null
}

export function processCallResult(payload: any): ProcessedCallResult {
    // ── Extract raw data from VAPI response ──
    const endedReason = payload?.endedReason ?? payload?.call?.endedReason ?? null
    const summary = payload?.summary ?? payload?.analysis?.summary ?? ''
    const transcript = payload?.transcript ?? payload?.artifact?.transcript ?? null
    const recordingUrl = payload?.recordingUrl ?? payload?.artifact?.recordingUrl ?? null

    // ── Compute duration from timestamps ──
    let callDuration: number | null = null
    const startedAt = payload?.startedAt ?? payload?.call?.startedAt
    const endedAt = payload?.endedAt ?? payload?.call?.endedAt
    if (startedAt && endedAt) {
        callDuration = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000)
    } else if (payload?.call?.duration) {
        callDuration = Math.round(payload.call.duration)
    }

    // ── Try VAPI structured data first (may be empty) ──
    const structured = payload?.analysis?.structuredData
        ?? payload?.artifact?.structuredOutputs?.[0]?.output
        ?? {}

    let extractedName: string | null = structured.decision_maker_name ?? null
    let extractedEmail: string | null = structured.decision_maker_email ?? null
    let callbackTime: string | null = structured.best_callback_time ?? null

    // ── Transcript-based intelligence (supplement/override VAPI) ──
    const isIVR = transcript ? IVR_KEYWORDS.test(transcript) : false
    // Only check for callback in human (business) speech, not in IVR/Sarah lines
    const businessText = transcript
        ? transcript.split('\n').filter((l: string) => l.startsWith('Business:')).join(' ')
        : ''
    const isCallback = CALLBACK_KEYWORDS.test(businessText) && !isIVR

    // Extract email from transcript if VAPI missed it
    if (!extractedEmail && transcript) {
        extractedEmail = extractEmailFromTranscript(transcript)
    }

    // Extract name from transcript if VAPI missed it
    if (!extractedName && transcript) {
        extractedName = extractNameFromTranscript(transcript)
    }

    // Detect callback time from transcript
    if (!callbackTime && transcript) {
        callbackTime = detectCallbackTime(transcript)
    }

    // ── Determine call status ──
    let callStatus: CallStatus = 'FAILED'

    // Priority 1: endedReason-based statuses (definitive)
    if (endedReason === 'voicemail') {
        callStatus = 'VOICEMAIL'
    } else if (endedReason === 'customer-did-not-answer') {
        callStatus = 'NO_ANSWER'
    } else if (endedReason === 'twilio-failed-to-connect-call') {
        callStatus = 'FAILED'
    }
    // Priority 2: Transcript-based classification (smart)
    else if (extractedEmail) {
        callStatus = 'LEAD_CAPTURED'
    } else if (isCallback || callbackTime) {
        callStatus = 'CALLBACK_BOOKED'
    } else if (isIVR) {
        // If entire call was IVR and we never got through
        callStatus = 'IVR_BLOCKED'
    } else if (endedReason === 'exceeded-max-duration' || endedReason === 'silence-timed-out') {
        // Timed out without IVR — likely unanswered transfer or hold
        callStatus = isIVR ? 'IVR_BLOCKED' : 'FAILED'
    } else if (endedReason === 'customer-ended-call' || endedReason === 'assistant-said-end-call-phrase') {
        // Human hung up or Sarah ended normally
        callStatus = 'NOT_INTERESTED'
    } else if (endedReason === 'customer-busy') {
        callStatus = 'NO_ANSWER'
    }

    // Priority 3: Use VAPI structured outcome ONLY as fallback
    // Our transcript-based classifier is more accurate, so only use VAPI
    // when we classified as FAILED/NOT_INTERESTED and VAPI disagrees
    const rawOutcome = structured.call_outcome as string | undefined
    if (rawOutcome && (callStatus === 'FAILED' || callStatus === 'NOT_INTERESTED')) {
        const outcomeMap: Record<string, CallStatus> = {
            LEAD_CAPTURED: 'LEAD_CAPTURED',
            CALLBACK_BOOKED: 'CALLBACK_BOOKED',
            VOICEMAIL: 'VOICEMAIL',
            GATEKEEPER_BLOCKED: 'GATEKEEPER_BLOCKED',
            IVR_BLOCKED: 'IVR_BLOCKED',
        }
        if (outcomeMap[rawOutcome]) callStatus = outcomeMap[rawOutcome]
    }

    return {
        callStatus,
        callSummary: summary || null,
        transcript,
        recordingUrl,
        callDuration,
        extractedName,
        extractedEmail,
        extractedPhone: null,
        callbackTime,
        endedReason,
    }
}

// ─── Callable business lookup ───

export async function getCallableBusinesses(campaignId: string, maxAttempts: number = 3) {
    return prisma.campaignBusiness.findMany({
        where: {
            campaignId,
            OR: [
                { callStatus: 'PENDING' },
                { callStatus: 'QUEUED' },
                {
                    callStatus: { in: ['VOICEMAIL', 'NO_ANSWER'] },
                    callAttempts: { lt: maxAttempts },
                    nextCallAt: { lte: new Date() },
                },
            ],
        },
        include: {
            reportLocationPlace: {
                include: { place: true },
            },
        },
        orderBy: [{ callAttempts: 'asc' }, { createdAt: 'asc' }],
    })
}

// ─── Deduplication ───

/**
 * Check if a business (by Google placeId) has already been contacted in any campaign.
 * Returns the campaign name if duplicate, null if safe to call.
 * 
 * NOTE: The `placeId` parameter must be the Google Places API ID (e.g., 'ChIJ...')
 * NOT the internal Prisma Place.id (cuid). The query traverses:
 * CampaignBusiness → ReportLocationPlace → Place.placeId
 */
export async function checkDuplicateBusiness(
    placeId: string,
    excludeCampaignId?: string,
): Promise<string | null> {
    const existing = await prisma.campaignBusiness.findFirst({
        where: {
            reportLocationPlace: {
                place: { placeId },
            },
            callStatus: { notIn: ['PENDING', 'QUEUED', 'DUPLICATE_SKIPPED'] },
            ...(excludeCampaignId ? { campaignId: { not: excludeCampaignId } } : {}),
        },
        include: { campaign: { select: { name: true } } },
    })
    return existing ? existing.campaign.name : null
}

