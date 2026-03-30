import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getLocationStats, type LocationStats } from "@/lib/voice-queue";

export default async function OutreachPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // --- Email campaigns ---
  const emailCampaigns = await prisma.outreachCampaign.findMany({
    include: {
      report: { select: { name: true } },
      leads: {
        select: {
          id: true,
          reviewStatus: true,
          sentAt: true,
          repliedAt: true,
          confidence: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Email global stats
  const totalEmailCampaigns = emailCampaigns.length;
  const activeCampaigns = emailCampaigns.filter(c => c.status === "active").length;
  const totalLeadsPushed = emailCampaigns.reduce(
    (s, c) => s + c.leads.filter(l => l.reviewStatus === "auto_approved" || l.reviewStatus === "approved").length,
    0,
  );
  const totalReplies = emailCampaigns.reduce(
    (s, c) => s + c.leads.filter(l => l.repliedAt).length,
    0,
  );
  const totalInReview = emailCampaigns.reduce(
    (s, c) => s + c.leads.filter(l => l.reviewStatus === "pending_review").length,
    0,
  );

  // --- Voice campaigns ---
  const liveLocations = await prisma.reportLocation.findMany({
    where: { status: "LIVE" },
    include: {
      report: { select: { name: true } },
      places: {
        where: { included: true },
        include: { place: { select: { phone: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const voiceConfig = await prisma.voiceConfig.findFirst({
    select: { callingEnabled: true },
  });

  const locationStatsMap: Record<string, LocationStats> = {};
  for (const loc of liveLocations) {
    locationStatsMap[loc.id] = await getLocationStats(loc.id);
  }

  const globalCallable = Object.values(locationStatsMap).reduce((s, l) => s + l.withPhone, 0);
  const globalVoiceLeads = Object.values(locationStatsMap).reduce(
    (s, l) => s + (l.callStats?.leadsCaptured ?? 0), 0,
  );
  const globalCallbacks = Object.values(locationStatsMap).reduce(
    (s, l) => s + (l.callStats?.callbacksBooked ?? 0), 0,
  );

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📡 Campaign Monitor</h1>
          <p className="text-muted-foreground mt-1">
            All outreach campaigns — email &amp; voice
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/outreach/analytics"
            className="inline-flex items-center gap-2 rounded bg-primary text-primary-foreground px-4 py-2 hover:opacity-90"
          >
            📊 Voice Analytics
          </Link>
          <Link
            href="/outreach/voice-config"
            className="inline-flex items-center gap-2 rounded bg-secondary text-secondary-foreground px-4 py-2 hover:opacity-90"
          >
            ⚙️ Voice Settings
          </Link>
        </div>
      </header>

      {/* ═══════════════════════════════════════════ */}
      {/* EMAIL CAMPAIGNS SECTION                     */}
      {/* ═══════════════════════════════════════════ */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          📧 Email Campaigns
          <Badge variant="secondary" className="text-xs">{totalEmailCampaigns} total</Badge>
        </h2>

        {/* Email stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <Card>
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-2xl font-bold">{totalEmailCampaigns}</p>
              <p className="text-xs text-muted-foreground">Campaigns</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-2xl font-bold text-green-600">{activeCampaigns}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-2xl font-bold">{totalLeadsPushed}</p>
              <p className="text-xs text-muted-foreground">Leads Sent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{totalReplies}</p>
              <p className="text-xs text-muted-foreground">Replies</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{totalInReview}</p>
              <p className="text-xs text-muted-foreground">In Review</p>
            </CardContent>
          </Card>
        </div>

        {/* Email campaign cards */}
        {emailCampaigns.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-2">No email campaigns yet.</p>
                <p className="text-sm text-muted-foreground">
                  Open a report → enrich a sector → click &quot;Launch Email Outreach&quot; to create one.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {emailCampaigns.map((campaign) => {
              const approved = campaign.leads.filter(
                l => l.reviewStatus === "auto_approved" || l.reviewStatus === "approved"
              ).length;
              const inReview = campaign.leads.filter(l => l.reviewStatus === "pending_review").length;
              const replied = campaign.leads.filter(l => l.repliedAt).length;
              const sent = campaign.leads.filter(l => l.sentAt).length;

              const statusColor =
                campaign.status === "active" ? "bg-green-600"
                : campaign.status === "draft" ? "bg-gray-400"
                : campaign.status === "review" ? "bg-amber-500"
                : campaign.status === "paused" ? "bg-orange-500"
                : "bg-blue-600";

              return (
                <Card key={campaign.id} className="hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{campaign.report.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{campaign.sector}</p>
                      </div>
                      <Badge className={`text-xs text-white ${statusColor}`}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Lead breakdown */}
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div>
                        <p className="text-lg font-semibold">{approved}</p>
                        <p className="text-muted-foreground">Approved</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-amber-600">{inReview}</p>
                        <p className="text-muted-foreground">Review</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-blue-600">{sent}</p>
                        <p className="text-muted-foreground">Sent</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-green-600">{replied}</p>
                        <p className="text-muted-foreground">Replied</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {approved > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{replied} replies / {approved} sent</span>
                          <span>{approved > 0 ? Math.round((replied / approved) * 100) : 0}%</span>
                        </div>
                        <Progress value={approved > 0 ? (replied / approved) * 100 : 0} className="h-1.5" />
                      </div>
                    )}

                    {/* Discount & config */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
                      {campaign.discountLevel && (
                        <span>💰 {campaign.discountLevel} discount</span>
                      )}
                      <span>• 3 emails • Plain text</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* VOICE CAMPAIGNS SECTION                     */}
      {/* ═══════════════════════════════════════════ */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          📞 Voice Campaigns
          <Badge variant="secondary" className="text-xs">{liveLocations.length} locations</Badge>
        </h2>

        {/* Voice stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Card>
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-2xl font-bold">{globalCallable.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">📞 Callable</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-2xl font-bold text-green-600">{globalVoiceLeads}</p>
              <p className="text-xs text-muted-foreground">✅ Leads</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{globalCallbacks}</p>
              <p className="text-xs text-muted-foreground">📅 Callbacks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-2xl font-bold">
                {voiceConfig ? "✅" : "❌"}
              </p>
              <p className="text-xs text-muted-foreground">Configured</p>
            </CardContent>
          </Card>
        </div>

        {/* Voice Config Banner */}
        {!voiceConfig && (
          <Card className="border-amber-300 bg-amber-50 mb-4">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-medium">Voice outreach not configured</p>
                  <p className="text-sm text-muted-foreground">
                    Set up Twilio and Vapi credentials in{" "}
                    <Link href="/outreach/voice-config" className="underline text-blue-600">
                      Voice Settings
                    </Link>{" "}
                    to start calling.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Voice location cards */}
        {liveLocations.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-2">
                  No LIVE locations found.
                </p>
                <p className="text-sm text-muted-foreground">
                  Set location status to &quot;LIVE&quot; in your reports to start voice outreach.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {liveLocations.map((location) => {
              const stats = locationStatsMap[location.id];
              const totalBiz = stats?.totalBusinesses ?? 0;
              const withPhone = stats?.withPhone ?? 0;
              const callStats = stats?.callStats;
              const called =
                (callStats?.leadsCaptured ?? 0) +
                (callStats?.callbacksBooked ?? 0) +
                (callStats?.notInterested ?? 0) +
                (callStats?.voicemail ?? 0) +
                (callStats?.gatekeeperBlocked ?? 0) +
                (callStats?.noAnswer ?? 0);
              const progressPct = withPhone > 0 ? Math.round((called / withPhone) * 100) : 0;

              const statusLabel = stats?.campaignStatus ?? "Not Started";
              const statusVariant =
                statusLabel === "COMPLETED"
                  ? "default"
                  : statusLabel === "CALLING"
                    ? "secondary"
                    : statusLabel === "PAUSED"
                      ? "outline"
                      : "outline";

              return (
                <Card key={location.id} className="hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{location.postcode}</CardTitle>
                        <p className="text-sm text-muted-foreground">{location.report.name}</p>
                      </div>
                      <Badge variant={statusVariant} className="text-xs capitalize">
                        {statusLabel.toLowerCase().replace("_", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Contacted {called} / {withPhone} callable</span>
                        <span className="text-muted-foreground">{progressPct}%</span>
                      </div>
                      <Progress value={progressPct} className="h-1.5" />
                    </div>

                    {/* Funnel */}
                    <div className="text-xs text-muted-foreground">
                      📊 {totalBiz} businesses → {withPhone} callable
                      {(callStats?.ctpsBlocked ?? 0) > 0 && (
                        <span className="text-red-500 ml-2">
                          · {callStats?.ctpsBlocked} CTPS blocked
                        </span>
                      )}
                    </div>

                    {/* Outcome badges */}
                    {callStats && called > 0 && (
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        {callStats.leadsCaptured > 0 && (
                          <Badge variant="default" className="bg-green-600">
                            ✅ {callStats.leadsCaptured} leads
                          </Badge>
                        )}
                        {callStats.callbacksBooked > 0 && (
                          <Badge variant="secondary">📅 {callStats.callbacksBooked} callbacks</Badge>
                        )}
                        {callStats.notInterested > 0 && (
                          <Badge variant="outline">❌ {callStats.notInterested}</Badge>
                        )}
                        {callStats.voicemail > 0 && (
                          <Badge variant="outline">📞 {callStats.voicemail} VM</Badge>
                        )}
                        {(callStats.pending ?? 0) > 0 && (
                          <Badge variant="outline">⏳ {callStats.pending}</Badge>
                        )}
                      </div>
                    )}

                    {/* Recent activity */}
                    {stats?.lastActivity && (
                      <p className="text-xs text-muted-foreground border-t pt-2">
                        Last: {stats.lastActivity.businessName} —{" "}
                        {stats.lastActivity.status.toLowerCase().replace("_", " ")}{" "}
                        {formatTimeAgo(stats.lastActivity.at)}
                      </p>
                    )}

                    {/* Action button */}
                    <div className="pt-1">
                      {stats?.campaignId ? (
                        <Link
                          href={`/outreach/campaigns/${stats.campaignId}`}
                          className="inline-flex items-center rounded bg-primary text-primary-foreground px-4 py-2 text-sm hover:opacity-90 w-full justify-center"
                        >
                          View Campaign →
                        </Link>
                      ) : (
                        <Link
                          href={`/outreach/${location.id}`}
                          className="inline-flex items-center rounded bg-primary text-primary-foreground px-4 py-2 text-sm hover:opacity-90 w-full justify-center"
                        >
                          Start Outreach →
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
