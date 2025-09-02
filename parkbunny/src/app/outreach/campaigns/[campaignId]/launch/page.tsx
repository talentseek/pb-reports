import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import LaunchStep from "@/components/LaunchStep";

export default async function CampaignLaunchPage({
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

  // Prepare business data for LaunchStep component
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
    siteData: cb.reportLocationPlace.place.siteData,
    address: cb.reportLocationPlace.place.address
  }));

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <header>
        <div className="flex items-center gap-4">
          <Link 
            href={`/outreach/campaigns/${campaign.id}`} 
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Campaign
          </Link>
        </div>
        <h1 className="text-3xl font-bold mt-2">Launch Campaign</h1>
        <p className="text-muted-foreground">
          {campaign.name} • Ready to launch your outreach campaign
        </p>
      </header>

      <LaunchStep 
        campaignId={campaign.id} 
        businesses={businessData} 
        businessType={campaign.businessType}
      />
    </main>
  );
}
