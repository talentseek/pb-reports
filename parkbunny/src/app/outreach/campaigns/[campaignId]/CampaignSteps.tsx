"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/components/ui/step-indicator";
import type { CampaignStats } from "@/lib/voice-queue";

interface CampaignStepsProps {
  campaign: {
    id: string;
    status: string;
    carparkName: string;
    locationStatus: string;
  };
  businessData: Array<{
    id: string;
    name: string;
    phone: string | null;
    callStatus: string;
    callAttempts: number;
    lastCallAt: Date | null;
    extractedEmail: string | null;
    extractedName: string | null;
    callSummary: string | null;
    transcript: string | null;
    recordingUrl: string | null;
    callbackTime: string | null;
    callDuration: number | null;
  }>;
  stats: CampaignStats;
}

const STEPS = [
  { id: "review", title: "Review Businesses", description: "Phone coverage overview" },
  { id: "ctps", title: "CTPS Screening", description: "Compliance check" },
  { id: "calling", title: "Launch Calling", description: "Start AI voice agent" },
  { id: "results", title: "Monitor & Results", description: "Live call tracking" },
  { id: "followup", title: "Follow-up", description: "Export and engage leads" },
];

export default function CampaignSteps({ campaign, businessData, stats }: CampaignStepsProps) {
  const [currentStep, setCurrentStep] = useState(() => {
    if (campaign.status === "COMPLETED") return 5;
    if (campaign.status === "CALLING" || campaign.status === "PAUSED") return 4;
    return 1;
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const voiceAction = async (action: string) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/outreach/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, campaignId: campaign.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ ${action}: ${JSON.stringify(data)}`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch {
      setMessage("❌ Network error");
    }
    setLoading(false);
  };

  const withPhone = businessData.filter((b) => b.phone).length;
  const withoutPhone = businessData.length - withPhone;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Review Businesses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-muted rounded p-3">
                  <p className="text-2xl font-bold">{businessData.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="bg-green-50 rounded p-3">
                  <p className="text-2xl font-bold text-green-600">{withPhone}</p>
                  <p className="text-xs text-muted-foreground">📞 With Phone</p>
                </div>
                <div className="bg-red-50 rounded p-3">
                  <p className="text-2xl font-bold text-red-600">{withoutPhone}</p>
                  <p className="text-xs text-muted-foreground">❌ No Phone</p>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-1 border rounded p-2">
                {businessData.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between py-1 px-2 text-sm border-b last:border-0"
                  >
                    <span className="font-medium">{b.name}</span>
                    <span className={b.phone ? "text-green-600" : "text-red-400"}>
                      {b.phone ?? "No phone"}
                    </span>
                  </div>
                ))}
              </div>
              <Button onClick={() => setCurrentStep(2)} className="w-full">
                Next: CTPS Screening →
              </Button>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>CTPS Screening</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Screen business phone numbers against the CTPS register. Numbers on the register
                must not be called (legal requirement for UK B2B cold calling).
              </p>
              {stats.ctpsBlocked > 0 && (
                <div className="bg-red-50 rounded p-3 text-sm">
                  <strong className="text-red-600">{stats.ctpsBlocked}</strong> businesses marked as
                  CTPS blocked
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={() => voiceAction("screen")} disabled={loading}>
                  {loading ? "Screening..." : "Run CTPS Screen"}
                </Button>
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  Skip / Next →
                </Button>
              </div>
              {message && <p className="text-sm">{message}</p>}
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Launch Calling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded p-3 text-sm space-y-1">
                <p><strong>Car park name:</strong> {campaign.carparkName}</p>
                <p><strong>Location status:</strong> {campaign.locationStatus}</p>
                <p><strong>Callable businesses:</strong> {withPhone}</p>
                <p><strong>Already blocked:</strong> {stats.ctpsBlocked + stats.invalidNumber}</p>
              </div>
              {campaign.locationStatus !== "LIVE" && (
                <div className="bg-red-50 rounded p-3 text-sm text-red-600">
                  ⚠️ Location is not LIVE — calling is disabled.
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => voiceAction("start")}
                  disabled={loading || campaign.locationStatus !== "LIVE"}
                >
                  {loading ? "Starting..." : "🚀 Start Calling"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => voiceAction("call-next")}
                  disabled={loading}
                >
                  🐛 Call Next (Debug)
                </Button>
              </div>
              {message && <p className="text-sm">{message}</p>}
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Monitor & Results</CardTitle>
                <div className="flex gap-2">
                  {campaign.status === "CALLING" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => voiceAction("pause")}
                      disabled={loading}
                    >
                      ⏸ Pause
                    </Button>
                  ) : campaign.status === "PAUSED" ? (
                    <Button
                      size="sm"
                      onClick={() => voiceAction("resume")}
                      disabled={loading}
                    >
                      ▶️ Resume
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => voiceAction("call-next")}
                    disabled={loading}
                  >
                    📞 Call Next
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Business results table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 px-2">Business</th>
                      <th className="py-2 px-2">Phone</th>
                      <th className="py-2 px-2">Status</th>
                      <th className="py-2 px-2">#</th>
                      <th className="py-2 px-2">Email Found</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businessData.map((b) => (
                      <BusinessRow key={b.id} business={b} />
                    ))}
                  </tbody>
                </table>
              </div>
              {message && <p className="text-sm">{message}</p>}
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Follow-up</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-green-50 rounded p-3">
                  <p className="text-2xl font-bold text-green-600">{stats.leadsCaptured}</p>
                  <p className="text-xs">Leads Captured</p>
                </div>
                <div className="bg-blue-50 rounded p-3">
                  <p className="text-2xl font-bold text-blue-600">{stats.callbacksBooked}</p>
                  <p className="text-xs">Callbacks Booked</p>
                </div>
              </div>
              {stats.leadsCaptured > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Captured Emails</h3>
                  <div className="bg-muted rounded p-3 space-y-1 text-sm">
                    {businessData
                      .filter((b) => b.extractedEmail)
                      .map((b) => (
                        <div key={b.id} className="flex justify-between">
                          <span>{b.extractedName || b.name}</span>
                          <span className="text-blue-600">{b.extractedEmail}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const rows = businessData
                    .filter((b) => b.extractedEmail)
                    .map((b) => `${b.name},${b.extractedName ?? ""},${b.extractedEmail},${b.callbackTime ?? ""}`)
                    .join("\n");
                  const csv = `Business,Contact Name,Email,Callback Time\n${rows}`;
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `leads-${campaign.id}.csv`;
                  a.click();
                }}
              >
                📥 Export Leads CSV
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  const clickableSteps = (() => {
    const steps = [1, 2];
    if (campaign.status !== "CREATED") steps.push(3);
    if (["CALLING", "PAUSED", "COMPLETED"].includes(campaign.status)) steps.push(4);
    if (campaign.status === "COMPLETED") steps.push(5);
    return steps;
  })();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <StepIndicator
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={(n) => clickableSteps.includes(n) && setCurrentStep(n)}
            clickableSteps={clickableSteps}
          />
        </CardContent>
      </Card>
      {renderStep()}
    </div>
  );
}

function BusinessRow({
  business,
}: {
  business: CampaignStepsProps["businessData"][number];
}) {
  const [expanded, setExpanded] = useState(false);

  const statusColor: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-700",
    QUEUED: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700",
    LEAD_CAPTURED: "bg-green-100 text-green-700",
    CALLBACK_BOOKED: "bg-blue-100 text-blue-700",
    NOT_INTERESTED: "bg-red-100 text-red-700",
    VOICEMAIL: "bg-amber-100 text-amber-700",
    GATEKEEPER_BLOCKED: "bg-red-100 text-red-700",
    NO_ANSWER: "bg-gray-100 text-gray-700",
    INVALID_NUMBER: "bg-red-50 text-red-500",
    FAILED: "bg-red-100 text-red-700",
    CTPS_BLOCKED: "bg-red-200 text-red-800",
  };

  return (
    <>
      <tr
        className="border-b hover:bg-muted/50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-2 px-2 font-medium">{business.name}</td>
        <td className="py-2 px-2 text-muted-foreground">{business.phone ?? "—"}</td>
        <td className="py-2 px-2">
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor[business.callStatus] ?? ""}`}
          >
            {business.callStatus.toLowerCase().replace("_", " ")}
          </span>
        </td>
        <td className="py-2 px-2 text-center">{business.callAttempts}</td>
        <td className="py-2 px-2 text-green-600">{business.extractedEmail ?? "—"}</td>
      </tr>
      {expanded && (business.callSummary || business.transcript || business.recordingUrl) && (
        <tr>
          <td colSpan={5} className="bg-muted/30 px-4 py-3 text-sm space-y-2">
            {business.callSummary && (
              <div>
                <strong>Summary:</strong> {business.callSummary}
              </div>
            )}
            {business.transcript && (
              <div>
                <strong>Transcript:</strong>
                <pre className="mt-1 whitespace-pre-wrap text-xs bg-white rounded p-2 max-h-40 overflow-y-auto">
                  {business.transcript}
                </pre>
              </div>
            )}
            {business.recordingUrl && (
              <div>
                <strong>Recording:</strong>
                <audio controls src={business.recordingUrl} className="mt-1 w-full" />
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
