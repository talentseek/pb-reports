import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLACE_CATEGORIES } from "@/lib/placesCategories";

export default async function OutreachLocationPage({
  params
}: {
  params: { locationId: string }
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

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
        include: {
          place: true
        }
      }
    }
  });

  if (!location) {
    notFound();
  }

  // Group businesses by category
  const businessesByCategory = location.places.reduce((acc, place) => {
    const category = place.groupedCategory || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(place);
    return acc;
  }, {} as Record<string, typeof location.places>);

  // Get category counts
  const categoryCounts = Object.entries(businessesByCategory).map(([category, places]) => ({
    category,
    total: places.length,
    included: places.filter(p => p.included).length
  }));

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <header>
        <div className="flex items-center gap-4">
          <Link 
            href="/outreach" 
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Outreach
          </Link>
        </div>
        <h1 className="text-3xl font-bold mt-2">{location.postcode}</h1>
        <p className="text-muted-foreground">
          {location.report.name} • Select a business category to start your campaign
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryCounts.map(({ category, total, included }) => (
          <Link key={category} href={`/outreach/${location.id}/${encodeURIComponent(category)}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Businesses</span>
                    <Badge variant="secondary">
                      {included} / {total}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {included > 0 ? `${included} businesses ready for campaign` : 'No businesses selected'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {categoryCounts.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No businesses found for this location. Refresh the location data in the report first.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
