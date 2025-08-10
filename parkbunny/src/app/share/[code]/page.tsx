import prisma from '@/lib/db'
import ReportView from '@/components/report/ReportView'
import { cookies } from 'next/headers'

async function getReportByCode(code: string) {
  return prisma.report.findFirst({ where: { shareCode: code, shareEnabled: true }, include: { businesses: true } })
}

export default async function PublicReportPage({ params }: { params: { code: string } }) {
  const report = await getReportByCode(params.code)
  if (!report) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">Link not available</h1>
        <p className="text-sm text-gray-600">This shared report is disabled or does not exist.</p>
      </main>
    )
  }

  if (report.shareExpiresAt && report.shareExpiresAt < new Date()) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">Link expired</h1>
      </main>
    )
  }

  const cookieName = `pb_share_${report.shareCode}`
  const cookie = (await cookies()).get(cookieName)?.value
  const authed = cookie === 'ok'
  if (!authed) {
    return (
      <main className="mx-auto max-w-sm p-6 space-y-4">
        <h1 className="text-xl font-semibold">Enter password</h1>
        <form method="POST" action={`/share/${report.shareCode}/verify`} className="space-y-3">
          <input type="password" name="password" className="w-full rounded border px-3 py-2" required />
          <button className="rounded bg-black text-white px-4 py-2">View report</button>
        </form>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <ReportView report={report} />
    </main>
  )
}


