import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CampaignSteps from "./CampaignSteps";

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

  // Prepare business data for step components
  const businessData = campaign.businesses.map(cb => ({
    id: cb.reportLocationPlace.place.id,
    name: cb.reportLocationPlace.place.name,
    website: cb.reportLocationPlace.place.website,
    email: cb.reportLocationPlace.place.email,
    phone: cb.reportLocationPlace.place.phone,
    socialLinks: cb.reportLocationPlace.place.socialLinks,
    enrichmentStatus: cb.reportLocationPlace.place.enrichmentStatus,
    allEmails: cb.reportLocationPlace.place.allEmails,
    allPhones: cb.reportLocationPlace.place.allPhones,
    contactPeople: cb.reportLocationPlace.place.contactPeople,
    businessDetails: cb.reportLocationPlace.place.businessDetails,
    siteData: cb.reportLocationPlace.place.siteData
  }));

  // Remove the old renderStepContent function as it's now handled by CampaignSteps

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
              <Badge variant="outline" className="capitalize">
                {campaign.status.toLowerCase().replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <CampaignSteps campaign={campaign} businessData={businessData} />
    </main>
  );
}
