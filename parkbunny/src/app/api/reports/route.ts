import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { defaultSettings } from '@/lib/calculations'
import { generateShareCode, hashPassword } from '@/lib/share'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  // Return all reports regardless of owner
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return Response.json(reports)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const body = await req.json()
  const { name, postcodes, estimatedRevenuePerPostcode, radiusMiles, placesMaxPerType } = body as { name: string; postcodes: string[] | string; estimatedRevenuePerPostcode?: number; radiusMiles?: number; placesMaxPerType?: number }
  const postcodesStr = Array.isArray(postcodes) ? postcodes.join(',') : String(postcodes)

  // Ensure a user record exists
  let user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) {
    // Use a unique placeholder email to satisfy unique constraint in POC
    user = await prisma.user.create({ data: { clerkId: userId, email: `${userId}@example.invalid` } })
  }

  // Prepare default share details
  const defaultSharePassword = process.env.SHARE_DEFAULT_PASSWORD || 'parkbunny'
  const sharePasswordHash = await hashPassword(defaultSharePassword)
  const report = await prisma.report.create({
    data: {
      name,
      postcodes: postcodesStr,
      settings: {
        estimatedRevenuePerPostcode: typeof estimatedRevenuePerPostcode === 'number' ? estimatedRevenuePerPostcode : 100000,
        postcodesCount: Array.isArray(postcodes) ? postcodes.length : (postcodesStr ? postcodesStr.split(',').filter(Boolean).length : 1),
        radiusMiles: typeof radiusMiles === 'number' ? Math.max(0.5, Math.min(10, radiusMiles)) : 0.75,
        placesMaxPerType: typeof placesMaxPerType === 'number' ? Math.max(1, Math.min(50, Math.floor(placesMaxPerType))) : 10,
        upliftPercentages: defaultSettings.upliftPercentages,
        signUpRates: defaultSettings.signUpRates,
        // Commercial terms defaults
        transactionFeePercent: 1.5,
        convenienceFeePence: 25,
        // Store plaintext for convenience (can be changed later)
        sharePasswordPlain: defaultSharePassword,
      },
      shareEnabled: true,
      shareCode: generateShareCode(),
      sharePasswordHash,
      userId: user.id,
      // No mock businesses; to be populated from Places integration
    },
  })

  return Response.json(report)
}
