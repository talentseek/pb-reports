import prisma from '@/lib/db'
import { verifyPassword } from '@/lib/share'
import { cookies } from 'next/headers'

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const form = await req.formData()
  const password = String(form.get('password') ?? '')
  const report = await prisma.report.findFirst({ where: { shareCode: params.code, shareEnabled: true } })
  if (!report) return new Response('Not found', { status: 404 })
  if (report.shareExpiresAt && report.shareExpiresAt < new Date()) return new Response('Expired', { status: 403 })
  const ok = await verifyPassword(password, report.sharePasswordHash)
  if (!ok) return new Response('Unauthorized', { status: 401 })
  const cookieName = `pb_share_${report.shareCode}`
  ;(await cookies()).set(cookieName, 'ok', { httpOnly: true, path: `/share/${report.shareCode}`, maxAge: 60 * 60 * 24 * 7 })
  await prisma.report.update({ where: { id: report.id }, data: { shareViewCount: { increment: 1 }, shareLastViewedAt: new Date() } })
  return new Response(null, { status: 302, headers: { Location: `/share/${report.shareCode}` } })
}


