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

  // Only fetch LIVE locations
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

  // Check voice config status
  const voiceConfig = await prisma.voiceConfig.findFirst({
    select: { callingEnabled: true },
  });

  // Get stats for each location
  const locationStatsMap: Record<string, LocationStats> = {};
  for (const loc of liveLocations) {
    locationStatsMap[loc.id] = await getLocationStats(loc.id);
  }

  // Global aggregates
  const globalCallable = Object.values(locationStatsMap).reduce((s, l) => s + l.withPhone, 0);
  const globalLeads = Object.values(locationStatsMap).reduce(
    (s, l) => s + (l.callStats?.leadsCaptured ?? 0),
    0,
  );
  const globalCallbacks = Object.values(locationStatsMap).reduce(
    (s, l) => s + (l.callStats?.callbacksBooked ?? 0),
    0,
  );
  const globalPending = Object.values(locationStatsMap).reduce(
    (s, l) => s + (l.callStats?.pending ?? 0),
    0,
  );

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🎯 Voice Outreach</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered calling across LIVE locations
          </p>
        </div>
        <Link
          href="/outreach/voice-config"
          className="inline-flex items-center gap-2 rounded bg-secondary text-secondary-foreground px-4 py-2 hover:opacity-90"
        >
          ⚙️ Voice Settings
        </Link>
      </header>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl font-bold">{globalCallable.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">📞 Callable</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl font-bold text-green-600">{globalLeads}</p>
            <p className="text-sm text-muted-foreground">✅ Leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{globalCallbacks}</p>
            <p className="text-sm text-muted-foreground">📅 Callbacks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{globalPending}</p>
            <p className="text-sm text-muted-foreground">⏳ Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Voice Config Banner */}
      {!voiceConfig && (
        <Card className="border-amber-300 bg-amber-50">
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

      {/* Per-Location Cards */}
      {liveLocations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No LIVE locations found. Set location status to &quot;LIVE&quot; in your reports to start outreach.
              </p>
              <Link
                href="/reports"
                className="inline-flex items-center rounded bg-primary text-primary-foreground px-4 py-2 hover:opacity-90"
              >
                View Reports
              </Link>
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
                      <CardTitle className="text-lg">{location.postcode}</CardTitle>
                      <p className="text-sm text-muted-foreground">{location.report.name}</p>
                    </div>
                    <Badge variant={statusVariant} className="text-xs capitalize">
                      {statusLabel.toLowerCase().replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Contacted {called} / {withPhone} callable</span>
                      <span className="text-muted-foreground">{progressPct}%</span>
                    </div>
                    <Progress value={progressPct} className="h-2" />
                  </div>

                  {/* Funnel */}
                  <div className="text-sm text-muted-foreground">
                    📊 {totalBiz} businesses → {withPhone} callable
                    {(callStats?.ctpsBlocked ?? 0) > 0 && (
                      <span className="text-red-500 ml-2">
                        · {callStats?.ctpsBlocked} CTPS blocked
                      </span>
                    )}
                  </div>

                  {/* Outcome badges */}
                  {callStats && called > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs">
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
                  <div className="pt-2">
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
