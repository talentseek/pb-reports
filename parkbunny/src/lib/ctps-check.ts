import prisma from '@/lib/db'
import { formatPhoneE164 } from './voice-agent'

/**
 * CTPS (Corporate Telephone Preference Service) screening.
 *
 * B2B cold calling is legal in the UK under "Legitimate Interest" (PECR),
 * but calling a CTPS-registered number is a legal offence.
 *
 * This module provides a pluggable interface for CTPS checking.
 * Set CTPS_API_KEY and CTPS_API_URL env vars to enable.
 */

const CTPS_API_KEY = process.env.CTPS_API_KEY
const CTPS_API_URL = process.env.CTPS_API_URL

export function isCTPSConfigured(): boolean {
    return !!(CTPS_API_KEY && CTPS_API_URL)
}

/**
 * Check a single phone number against the CTPS register.
 * Returns true if the number IS on the register (should NOT be called).
 */
export async function checkCTPS(phoneE164: string): Promise<boolean> {
    if (!CTPS_API_KEY || !CTPS_API_URL) {
        console.warn('CTPS API not configured — skipping check')
        return false
    }

    try {
        const res = await fetch(`${CTPS_API_URL}/check`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${CTPS_API_KEY}`,
            },
            body: JSON.stringify({ number: phoneE164 }),
        })

        if (!res.ok) {
            console.error('CTPS API error', res.status)
            return false // fail open — don't block calling on API errors
        }

        const data = await res.json()
        return data.registered === true
    } catch (err) {
        console.error('CTPS check failed', err)
        return false
    }
}

/**
 * Screen all PENDING businesses in a campaign against the CTPS register.
 * Marks registered numbers as CTPS_BLOCKED.
 */
export async function screenCampaign(
    campaignId: string,
): Promise<{ screened: number; blocked: number }> {
    const businesses = await prisma.campaignBusiness.findMany({
        where: { campaignId, callStatus: 'PENDING' },
        include: {
            reportLocationPlace: {
                include: { place: { select: { phone: true } } },
            },
        },
    })

    let screened = 0
    let blocked = 0

    for (const cb of businesses) {
        const phone = cb.reportLocationPlace.place.phone
        if (!phone) continue

        const e164 = formatPhoneE164(phone)
        if (!e164) {
            // Mark invalid numbers
            await prisma.campaignBusiness.update({
                where: { id: cb.id },
                data: { callStatus: 'INVALID_NUMBER' },
            })
            continue
        }

        screened++
        const isRegistered = await checkCTPS(e164)

        if (isRegistered) {
            blocked++
            await prisma.campaignBusiness.update({
                where: { id: cb.id },
                data: { callStatus: 'CTPS_BLOCKED' },
            })
        }
    }

    return { screened, blocked }
}
