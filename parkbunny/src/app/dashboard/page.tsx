import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import DashboardOverview from "@/components/DashboardOverview";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Fetch all reports for stats
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
          status: true,
          latitude: true,
          longitude: true,
          postcode: true
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

  // Calculate stats
  const totalReports = reports.length;
  const activeReports = reports.filter(r => !r.archived).length;
  const archivedReports = reports.filter(r => r.archived).length;
  
  // Get all locations for map
  const allLocations = reports.flatMap(report => 
    report.locations.map(location => ({
      ...location,
      reportName: report.name,
      status: location.status
    }))
  );

  // Calculate total businesses (this would need to be calculated from places data)
  // For now, we'll use a placeholder - this should be calculated from actual places data
  const totalBusinesses = reports.reduce((total, report) => {
    // This is a placeholder - in reality, you'd sum up all places from all locations
    return total + (report.locations.length * 50); // Assuming ~50 businesses per location
  }, 0);

  // Get businesses by category (placeholder - would need actual places data)
  const businessesByCategory = {
    "Retail": Math.floor(totalBusinesses * 0.3),
    "Food & Beverage": Math.floor(totalBusinesses * 0.25),
    "Services": Math.floor(totalBusinesses * 0.2),
    "Healthcare": Math.floor(totalBusinesses * 0.15),
    "Other": Math.floor(totalBusinesses * 0.1)
  };

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link
          href="/reports/new"
          className="inline-flex items-center justify-center rounded bg-primary text-primary-foreground px-4 py-2 hover:opacity-90"
        >
          Create New Report
        </Link>
      </header>
      
      <DashboardOverview 
        stats={{
          totalReports,
          activeReports,
          archivedReports,
          totalBusinesses,
          businessesByCategory
        }}
        locations={allLocations}
      />
    </main>
  );
}


