import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/db'

export async function GET() {
  const items = await (prisma as any).feedback.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { type, title, details, contact } = body || {}
  if (!type || !title) return new NextResponse('Missing fields', { status: 400 })
  const created = await (prisma as any).feedback.create({
    data: {
      type: String(type).toUpperCase() === 'FEATURE' ? 'FEATURE' : 'BUG',
      title: String(title).slice(0, 200),
      details: details ? String(details).slice(0, 2000) : null,
      createdById: user.id,
      createdByEmail: contact ? String(contact).slice(0, 200) : user.emailAddresses?.[0]?.emailAddress || null,
    },
  })
  return NextResponse.json(created, { status: 201 })
}


