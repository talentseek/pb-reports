import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BusinessSelectionClient from "@/components/BusinessSelectionClient";

export default async function OutreachCategoryPage({
  params
}: {
  params: { locationId: string; category: string }
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const decodedCategory = decodeURIComponent(params.category);

  // Fetch the specific location
  const location = await prisma.reportLocation.findUnique({
    where: {
      id: params.locationId,
      status: 'LIVE'
    },
    include: {
      report: {
        select: {
          name: true
        }
      },
      places: {
        where: {
          groupedCategory: decodedCategory
        },
        include: {
          place: true
        }
      }
    }
  });

  if (!location) {
    notFound();
  }

  const includedCount = location.places.filter(p => p.included).length;
  const totalCount = location.places.length;

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <header>
        <div className="flex items-center gap-4">
          <Link 
            href={`/outreach/${location.id}`} 
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to {location.postcode}
          </Link>
        </div>
        <h1 className="text-3xl font-bold mt-2">{decodedCategory}</h1>
        <p className="text-muted-foreground">
          {location.postcode} • {location.report.name} • {includedCount} of {totalCount} businesses selected
        </p>
      </header>

      <BusinessSelectionClient 
        locationId={location.id}
        category={decodedCategory}
        postcode={location.postcode}
        businesses={location.places}
      />
    </main>
  );
}
