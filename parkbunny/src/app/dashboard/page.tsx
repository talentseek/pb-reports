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

  // Get actual business data from the database
  const businessData = await prisma.reportLocationPlace.groupBy({
    by: ['groupedCategory'],
    _count: {
      id: true
    }
  });

  // Calculate total businesses
  const totalBusinesses = businessData.reduce((total, item) => total + item._count.id, 0);

  // Create businesses by category object
  const businessesByCategory = businessData.reduce((acc, item) => {
    acc[item.groupedCategory || 'Other'] = item._count.id;
    return acc;
  }, {} as Record<string, number>);

  // If no businesses found, show placeholder data
  if (totalBusinesses === 0) {
    const placeholderTotal = reports.reduce((total, report) => total + report.locations.length * 50, 0);
    businessesByCategory["Hotels & Accommodation"] = Math.floor(placeholderTotal * 0.2);
    businessesByCategory["Restaurants & Cafes"] = Math.floor(placeholderTotal * 0.25);
    businessesByCategory["Bars & Nightlife"] = Math.floor(placeholderTotal * 0.15);
    businessesByCategory["Fitness & Wellness"] = Math.floor(placeholderTotal * 0.1);
    businessesByCategory["Offices & Coworking"] = Math.floor(placeholderTotal * 0.1);
    businessesByCategory["Retail & Services"] = Math.floor(placeholderTotal * 0.1);
    businessesByCategory["Other"] = Math.floor(placeholderTotal * 0.1);
  }

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


