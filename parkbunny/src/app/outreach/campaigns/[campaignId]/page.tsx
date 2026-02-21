import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CampaignSteps from "./CampaignSteps";
import { getCampaignStats } from "@/lib/voice-queue";

export default async function CampaignPage({
  params,
}: {
  params: { campaignId: string };
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.campaignId },
    include: {
      location: { select: { status: true, postcode: true } },
      businesses: {
        include: {
          reportLocationPlace: {
            include: { place: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!campaign) notFound();

  const stats = await getCampaignStats(campaign.id);

  // Prepare business data with call info
  const businessData = campaign.businesses.map((cb) => ({
    id: cb.id,
    placeId: cb.reportLocationPlace.place.id,
    name: cb.reportLocationPlace.place.name,
    phone: cb.reportLocationPlace.place.phone,
    website: cb.reportLocationPlace.place.website,
    email: cb.reportLocationPlace.place.email,
    callStatus: cb.callStatus,
    callAttempts: cb.callAttempts,
    lastCallAt: cb.lastCallAt,
    callSummary: cb.callSummary,
    transcript: cb.transcript,
    recordingUrl: cb.recordingUrl,
    extractedName: cb.extractedName,
    extractedEmail: cb.extractedEmail,
    callbackTime: cb.callbackTime,
    callDuration: cb.callDuration,
  }));

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <header>
        <Link
          href="/outreach"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Outreach
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-3xl font-bold">{campaign.name}</h1>
          <Badge
            variant={
              campaign.status === "COMPLETED"
                ? "default"
                : campaign.status === "CALLING"
                  ? "secondary"
                  : "outline"
            }
            className="capitalize"
          >
            {campaign.status.toLowerCase().replace("_", " ")}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {campaign.carparkName} · {campaign.postcode} ·{" "}
          {campaign.businesses.length} businesses
        </p>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">
              {stats.total - stats.pending - stats.queued - stats.ctpsBlocked - stats.invalidNumber}
            </p>
            <p className="text-xs text-muted-foreground">📞 Calls Made</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.leadsCaptured}</p>
            <p className="text-xs text-muted-foreground">✅ Leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.callbacksBooked}</p>
            <p className="text-xs text-muted-foreground">📅 Callbacks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">⏳ Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Workflow */}
      <CampaignSteps
        campaign={{
          id: campaign.id,
          status: campaign.status,
          carparkName: campaign.carparkName,
          locationStatus: campaign.location?.status ?? "PENDING",
        }}
        businessData={businessData}
        stats={stats}
      />

      {/* Call Log Link */}
      <div className="text-center">
        <Link
          href={`/outreach/campaigns/${campaign.id}/calls`}
          className="text-sm text-blue-600 hover:underline"
        >
          View full call log →
        </Link>
      </div>
    </main>
  );
}
