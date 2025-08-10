import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import mockBusinesses from '@/lib/mockData'
import { defaultSettings } from '@/lib/calculations'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const reports = await prisma.report.findMany({
    where: { user: { clerkId: userId } },
    orderBy: { createdAt: 'desc' },
  })
  return Response.json(reports)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const body = await req.json()
  const { name, postcodes, estimatedRevenuePerPostcode } = body as { name: string; postcodes: string[] | string; estimatedRevenuePerPostcode?: number }
  const postcodesStr = Array.isArray(postcodes) ? postcodes.join(',') : String(postcodes)

  // Ensure a user record exists
  let user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) {
    // Use a unique placeholder email to satisfy unique constraint in POC
    user = await prisma.user.create({ data: { clerkId: userId, email: `${userId}@example.invalid` } })
  }

  const report = await prisma.report.create({
    data: {
      name,
      postcodes: postcodesStr,
      settings: {
        estimatedRevenuePerPostcode: typeof estimatedRevenuePerPostcode === 'number' ? estimatedRevenuePerPostcode : 100000,
        postcodesCount: Array.isArray(postcodes) ? postcodes.length : (postcodesStr ? postcodesStr.split(',').filter(Boolean).length : 1),
        upliftPercentages: defaultSettings.upliftPercentages,
        signUpRates: defaultSettings.signUpRates,
      },
      userId: user.id,
      businesses: {
        create: mockBusinesses.map((b) => ({
          name: b.name,
          category: b.category,
          address: b.address,
          website: b.website,
          mapsLink: b.mapsLink,
        })),
      },
    },
  })

  return Response.json(report)
}
