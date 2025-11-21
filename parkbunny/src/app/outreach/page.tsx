import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Mock data generator for demo purposes
function getMockProgress(locationId: string, totalBusinesses: number) {
  // Use locationId to generate consistent "random" values
  const seed = locationId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const enrichmentProgress = Math.min(100, (seed % 40) + 60); // 60-100%
  const contacted = Math.floor(totalBusinesses * (0.5 + (seed % 50) / 100)); // 50-100%
  const responseRate = Math.min(100, (seed % 30) + 15); // 15-45%

  const statuses = ['Not Started', 'In Progress', 'Complete'];
  const status = totalBusinesses > 0 ? statuses[seed % 3] : 'Not Started';

  return { enrichmentProgress, contacted, responseRate, status };
}

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
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI-Powered Outreach</h1>
          <p className="text-muted-foreground mt-2">
            Automated business discovery, enrichment, and personalized outreach
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
            const mockData = getMockProgress(location.id, includedBusinesses);

            return (
              <Link key={location.id} href={`/outreach/${location.id}`}>
                <Card className="hover:shadow-lg transition-all cursor-pointer border-primary/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{location.postcode}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {location.report.name}
                        </p>
                      </div>
                      <Badge
                        variant={mockData.status === 'Complete' ? 'default' : mockData.status === 'In Progress' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {mockData.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Businesses Found */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">🔍 Businesses Found</span>
                        <Badge variant="secondary">
                          {includedBusinesses}
                        </Badge>
                      </div>

                      {/* Enrichment Progress */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">🤖 AI Enrichment</span>
                          <span className="text-muted-foreground">{mockData.enrichmentProgress}%</span>
                        </div>
                        <Progress value={mockData.enrichmentProgress} className="h-2" />
                      </div>

                      {/* Outreach Progress */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">📧 Contacted</span>
                        <span className="text-muted-foreground">{mockData.contacted} / {includedBusinesses}</span>
                      </div>

                      {/* Response Rate */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">💬 Response Rate</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {mockData.responseRate}%
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground pt-2 border-t">
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
