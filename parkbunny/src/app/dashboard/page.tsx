import Link from "next/link";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    select: { 
      id: true, 
      name: true, 
      postcodes: true, 
      createdAt: true, 
      shareEnabled: true, 
      shareCode: true, 
      settings: true,
      archived: true,
      locations: {
        select: {
          id: true,
          status: true
        }
      },
      user: {
        select: {
          email: true,
          clerkId: true
        }
      }
    },
  });

  // Get unique user IDs to fetch from Clerk
  const uniqueUserIds = [...new Set(reports.map(r => r.user?.clerkId).filter(Boolean))];
  
  // Fetch user information from Clerk
  const clerkUsers = await Promise.all(
    uniqueUserIds.map(async (clerkId) => {
      try {
        const user = await clerkClient.users.getUser(clerkId);
        return {
          clerkId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.emailAddresses[0]?.emailAddress,
          username: user.username,
          createdAt: user.createdAt
        };
      } catch (error) {
        console.error(`Failed to fetch user ${clerkId}:`, error);
                 return {
           clerkId,
           firstName: null,
           lastName: null,
           email: null,
           username: null,
           createdAt: null
         };
      }
    })
  );

  // Create a map for quick lookup
  const userMap = new Map(clerkUsers.map(u => [u.clerkId, u]));

  // Enhance reports with user information
  const reportsWithUserInfo = reports.map(report => ({
    ...report,
    user: report.user ? {
      ...report.user,
      ...userMap.get(report.user.clerkId)
    } : undefined
  }));

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your Reports</h1>
        <Link
          href="/reports/new"
          className="inline-flex items-center justify-center rounded bg-primary text-primary-foreground px-4 py-2 hover:opacity-90"
        >
          Create New Report
        </Link>
      </header>
      <DashboardClient reports={reportsWithUserInfo} />
    </main>
  );
}


