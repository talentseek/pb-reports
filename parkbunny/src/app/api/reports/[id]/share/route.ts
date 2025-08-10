import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { generateShareCode, hashPassword } from '@/lib/share'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const body = await req.json()
  const { enable, password, expiresAt, regenerate } = body as {
    enable?: boolean
    password?: string
    expiresAt?: string | null
    regenerate?: boolean
  }

  const report = await prisma.report.findFirst({ where: { id: params.id, user: { clerkId: userId } } })
  if (!report) return new Response('Not found', { status: 404 })

  const data: any = {}
  if (typeof enable === 'boolean') data.shareEnabled = enable
  if (typeof regenerate === 'boolean' && regenerate === true) data.shareCode = generateShareCode()
  if (typeof password === 'string' && password.length > 0) data.sharePasswordHash = await hashPassword(password)
  if (expiresAt === null) data.shareExpiresAt = null
  if (typeof expiresAt === 'string') data.shareExpiresAt = new Date(expiresAt)
  if (!report.shareCode && (data.shareEnabled || regenerate)) data.shareCode = generateShareCode()

  const updated = await prisma.report.update({ where: { id: report.id }, data })
  return Response.json({ shareCode: updated.shareCode, shareEnabled: updated.shareEnabled })
}


