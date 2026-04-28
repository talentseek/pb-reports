/**
 * ParkBunny — Email Support AI Processor
 *
 * Core logic for processing inbound support emails:
 *  1. Classify and generate an AI reply using the FAQ knowledge base
 *  2. Auto-send the reply via Unipile if resolved
 *  3. Persist results to the SupportEmail table
 *
 * Uses OpenRouter as the AI backend (OpenAI-compatible API).
 * Set OPENROUTER_API_KEY in env vars.
 * Optionally set OPENROUTER_MODEL to override the default model.
 */

import OpenAI from 'openai'
import prisma from '@/lib/db'
import { buildFAQPromptBlock, FAQ_CATEGORY_NAMES } from '@/lib/park-bunny-faq'
import { sendSupportReply, markEmailHandled } from '@/lib/unipile-email'

// OpenRouter uses the OpenAI-compatible API — just override baseURL and apiKey
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://app.parkbunnyreports.com',
    'X-Title': 'ParkBunny Email Support',
  },
})

// Default: Kimi K2.6 — strong reasoning, good value.
// Override via OPENROUTER_MODEL env var.
const MODEL = process.env.OPENROUTER_MODEL ?? 'moonshotai/kimi-k2.6'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface InboundEmailData {
  unipileEmailId: string
  fromEmail: string
  fromName?: string
  subject: string
  bodyText: string
  bodyHtml?: string
  receivedAt: Date
}

interface AIResult {
  category: string
  resolved: boolean
  needs_human_followup: boolean
  sentiment: 'positive' | 'neutral' | 'negative'
  summary: string
  reply: string
}

// ─── System Prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  const faqBlock = buildFAQPromptBlock()
  const categories = FAQ_CATEGORY_NAMES.join(', ')

  return `You are a professional customer support AI for Park Bunny — a UK parking payment app.
A customer has sent an email to support@parkbunny.app. You must read their email carefully, find the most relevant answer from the FAQ knowledge base below, and write a warm, clear, helpful email reply.

## Reply Writing Guidelines
- Professional British English tone — helpful, clear, reassuring
- 2–4 short paragraphs with no bullet points inside the reply text
- Always open with: "Thank you for getting in touch with Park Bunny."
- Always close with: "Kind regards,\\nThe Park Bunny Support Team"
- Only use information from the FAQ — never fabricate policies or amounts
- If the question is outside the FAQ scope, say: "I'm afraid this falls outside our standard support queries, but a member of our team will be in touch within 1 working day."

## Important Distinctions
- Park Bunny is a PAYMENT APP, not an enforcement company — we do not issue parking charges or PCNs
- Refunds and changes to existing sessions are managed through the app or via the car park operator — not Park Bunny
- If someone has received a parking charge notice (PCN), this was issued by the car park enforcement company, not us

## FAQ Knowledge Base
${faqBlock}

## Response Format
Return ONLY a valid JSON object with these exact fields:
{
  "category": "One of: ${categories}, or 'Other'",
  "resolved": true or false (true if FAQ answers the question),
  "needs_human_followup": true or false (true if human review required),
  "sentiment": "positive" or "neutral" or "negative",
  "summary": "1–2 sentence summary of the customer's issue",
  "reply": "The complete email reply text, ready to send. Do NOT include a subject line — just the body."
}`
}

// ─── Core Processor ────────────────────────────────────────────────────────────

/**
 * Process a single inbound support email end-to-end:
 *  1. Create/find SupportEmail row
 *  2. Call OpenAI to classify + generate reply
 *  3. If resolved → auto-send reply via Unipile, mark as read in Outlook
 *  4. If unresolved → flag as needs_review
 *  5. Update DB record with final status
 */
export async function processInboundEmail(
  email: InboundEmailData,
  unipileAccountId: string,
): Promise<void> {
  // 1. Upsert SupportEmail record (status: processing)
  const record = await prisma.supportEmail.upsert({
    where: { unipileEmailId: email.unipileEmailId },
    create: {
      unipileEmailId: email.unipileEmailId,
      fromEmail: email.fromEmail,
      fromName: email.fromName ?? null,
      subject: email.subject,
      bodyText: email.bodyText,
      bodyHtml: email.bodyHtml ?? null,
      receivedAt: email.receivedAt,
      status: 'processing',
    },
    update: {}, // already exists — don't reprocess
  })

  // Skip if already processed (status is no longer 'processing')
  if (record.status !== 'processing') {
    console.log(`[EmailSupport] Email ${email.unipileEmailId} already processed — skipping`)
    return
  }

  // 2. Call OpenAI
  let aiResult: AIResult | null = null
  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        {
          role: 'user',
          content: `Customer email from: ${email.fromName ? `${email.fromName} <${email.fromEmail}>` : email.fromEmail}
Subject: ${email.subject}

${email.bodyText}`,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    if (!raw.trim()) {
      console.error(`[EmailSupport] AI returned empty content (model: ${MODEL}, finish_reason: ${completion.choices[0]?.finish_reason})`)
      await prisma.supportEmail.update({
        where: { id: record.id },
        data: { status: 'needs_review', aiSummary: `AI returned empty response (model: ${MODEL}). Manual review required.` },
      })
      return
    }

    // Some models wrap JSON in markdown code blocks — strip them
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    aiResult = JSON.parse(cleaned) as AIResult
  } catch (err: any) {
    console.error('[EmailSupport] OpenAI error:', err.message)
    // Mark as needs_review so a human sees it
    await prisma.supportEmail.update({
      where: { id: record.id },
      data: { status: 'needs_review', aiSummary: 'AI processing failed — manual review required.' },
    })
    return
  }

  const {
    category,
    resolved,
    needs_human_followup,
    sentiment,
    summary,
    reply,
  } = aiResult

  // 3. Auto-reply if resolved and no human needed
  let replySentAt: Date | null = null
  let finalStatus: string

  if (resolved && !needs_human_followup) {
    const sendResult = await sendSupportReply({
      accountId: unipileAccountId,
      to: email.fromEmail,
      subject: email.subject,
      bodyHtml: plainTextToHtml(reply),
      replyToMessageId: email.unipileEmailId,
    })

    if (sendResult.success) {
      replySentAt = new Date()
      finalStatus = 'replied'
      // Mark email as read in Outlook (best-effort)
      await markEmailHandled(unipileAccountId, email.unipileEmailId)
    } else {
      // Send failed — escalate to human
      finalStatus = 'needs_review'
      console.warn('[EmailSupport] Auto-reply failed, escalating:', sendResult.error)
    }
  } else {
    // Human follow-up required
    finalStatus = 'needs_review'
  }

  // 4. Persist results
  await prisma.supportEmail.update({
    where: { id: record.id },
    data: {
      status: finalStatus,
      category: category ?? null,
      resolved: finalStatus === 'replied',
      escalatedToHuman: finalStatus === 'needs_review',
      sentiment: sentiment ?? null,
      aiSummary: summary ?? null,
      suggestedReply: reply ?? null,
      replyText: finalStatus === 'replied' ? reply : null,
      replySentAt,
    },
  })

  console.log(
    `[EmailSupport] Processed ${email.unipileEmailId} → ${finalStatus} (category: ${category}, resolved: ${resolved})`,
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert plain text reply to simple HTML for sending via Unipile.
 * Preserves paragraph breaks and line breaks.
 */
function plainTextToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const paragraphs = escaped
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n')

  return `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">\n${paragraphs}\n</div>`
}
