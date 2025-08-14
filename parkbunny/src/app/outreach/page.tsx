import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function OutreachPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Fetch all live locations across all reports
  const liveLocations = await prisma.reportLocation.findMany({
    where: {
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
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Outreach</h1>
          <p className="text-muted-foreground mt-2">
            Select a live location to start your outreach campaign
          </p>
        </div>
        <Link
          href="/outreach/campaigns"
          className="inline-flex items-center justify-center rounded bg-secondary text-secondary-foreground px-4 py-2 hover:opacity-90"
        >
          View Campaigns
        </Link>
      </header>

      {liveLocations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No live locations found. Update location status to &quot;LIVE&quot; in your reports to start outreach campaigns.
              </p>
              <Link 
                href="/reports" 
                className="inline-flex items-center justify-center rounded bg-primary text-primary-foreground px-4 py-2 hover:opacity-90"
              >
                View Reports
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveLocations.map((location) => {
            const totalBusinesses = location.places.length;
            const includedBusinesses = location.places.filter(p => p.included).length;
            
            return (
              <Link key={location.id} href={`/outreach/${location.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">{location.postcode}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {location.report.name}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Businesses</span>
                        <Badge variant="secondary">
                          {includedBusinesses} / {totalBusinesses}
                        </Badge>
                      </div>
                      
                      {location.latitude && location.longitude && (
                        <div className="text-xs text-muted-foreground">
                          📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Live since {new Date(location.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
