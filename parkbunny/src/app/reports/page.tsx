import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import DashboardReports from "@/components/DashboardReports";

export default async function ReportsPage() {
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

  // Convert null user to undefined to match the expected type
  const reportsWithUserInfo = reports.map(report => ({
    ...report,
    user: report.user || undefined
  }));

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <Link
          href="/reports/new"
          className="inline-flex items-center justify-center rounded bg-primary text-primary-foreground px-4 py-2 hover:opacity-90"
        >
          Create New Report
        </Link>
      </header>
      
      <DashboardReports reports={reportsWithUserInfo} />
    </main>
  );
}
