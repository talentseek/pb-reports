import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CampaignsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Fetch all campaigns
  const campaigns = await prisma.campaign.findMany({
    include: {
      businesses: {
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
      <header>
        <div className="flex items-center gap-4">
          <Link 
            href="/outreach" 
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Outreach
          </Link>
        </div>
        <h1 className="text-3xl font-bold mt-2">Campaigns</h1>
        <p className="text-muted-foreground">
          Manage your outreach campaigns
        </p>
      </header>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No campaigns created yet. Start by selecting a live location and creating your first campaign.
              </p>
              <Link 
                href="/outreach" 
                className="inline-flex items-center justify-center rounded bg-primary text-primary-foreground px-4 py-2 hover:opacity-90"
              >
                Start Outreach
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/outreach/campaigns/${campaign.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {campaign.businessType}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Businesses</span>
                      <Badge variant="secondary">
                        {campaign.businesses.length}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      📍 {campaign.postcode}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Created {new Date(campaign.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
