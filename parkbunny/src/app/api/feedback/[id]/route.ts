import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/db'

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const user = await currentUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const id = params.id
  if (!id) return new NextResponse('Bad Request', { status: 400 })
  const item = await (prisma as any).feedback.findUnique({ where: { id } })
  if (!item) return new NextResponse('Not Found', { status: 404 })
  const nextStatus = item.status === 'DONE' ? 'OPEN' : 'DONE'
  const updated = await (prisma as any).feedback.update({
    where: { id },
    data: {
      status: nextStatus,
      completedAt: nextStatus === 'DONE' ? new Date() : null,
    },
  })
  return NextResponse.json(updated)
}


