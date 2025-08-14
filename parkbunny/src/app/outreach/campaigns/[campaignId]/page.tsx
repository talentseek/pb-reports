import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function CampaignPage({
  params
}: {
  params: { campaignId: string }
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Fetch the specific campaign
  const campaign = await prisma.campaign.findUnique({
    where: {
      id: params.campaignId
    },
    include: {
      businesses: {
        include: {
          reportLocationPlace: {
            include: {
              place: true
            }
          }
        }
      }
    }
  });

  if (!campaign) {
    notFound();
  }

  const getPriceLevelText = (level: number | null) => {
    if (level === null) return 'N/A';
    return '£'.repeat(level);
  };

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <header>
        <div className="flex items-center gap-4">
          <Link 
            href="/outreach/campaigns" 
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Campaigns
          </Link>
        </div>
        <h1 className="text-3xl font-bold mt-2">{campaign.name}</h1>
        <p className="text-muted-foreground">
          {campaign.businesses.length} businesses • Created {new Date(campaign.createdAt).toLocaleDateString()}
        </p>
      </header>

      {/* Campaign Info */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm font-medium">Business Type</span>
              <p className="text-sm text-muted-foreground">{campaign.businessType}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Location</span>
              <p className="text-sm text-muted-foreground">{campaign.postcode}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Status</span>
              <p className="text-sm text-muted-foreground">Ready for enrichment</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business List */}
      <Card>
        <CardHeader>
          <CardTitle>Businesses ({campaign.businesses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaign.businesses.map((business) => (
              <div key={business.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm">
                      {business.reportLocationPlace.place.name}
                    </h3>
                    {business.reportLocationPlace.place.address && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {business.reportLocationPlace.place.address}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {business.reportLocationPlace.place.rating && (
                      <Badge variant="outline" className="text-xs">
                        ⭐ {business.reportLocationPlace.place.rating}
                      </Badge>
                    )}
                    {business.reportLocationPlace.place.priceLevel !== null && (
                      <Badge variant="outline" className="text-xs">
                        {getPriceLevelText(business.reportLocationPlace.place.priceLevel)}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-2">
                  {business.reportLocationPlace.place.website && (
                    <a 
                      href={business.reportLocationPlace.place.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Website
                    </a>
                  )}
                  {business.reportLocationPlace.place.phone && (
                    <span className="text-xs text-muted-foreground">
                      📞 {business.reportLocationPlace.place.phone}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <Button className="bg-green-600 hover:bg-green-700">
          🚀 Start Enrichment (Simulated)
        </Button>
        <Button variant="outline">
          📊 Export Data
        </Button>
        <Button variant="outline">
          📧 Send Campaign
        </Button>
      </div>
    </main>
  );
}
