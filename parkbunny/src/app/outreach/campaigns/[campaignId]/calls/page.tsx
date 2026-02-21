import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CallLogPage({
    params,
}: {
    params: { campaignId: string };
}) {
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    const campaign = await prisma.campaign.findUnique({
        where: { id: params.campaignId },
        select: { id: true, name: true },
    });
    if (!campaign) notFound();

    const calls = await prisma.campaignBusiness.findMany({
        where: {
            campaignId: params.campaignId,
            callStatus: { notIn: ["PENDING", "CTPS_BLOCKED", "INVALID_NUMBER"] },
        },
        include: {
            reportLocationPlace: {
                include: { place: { select: { name: true, phone: true } } },
            },
        },
        orderBy: { lastCallAt: "desc" },
    });

    const statusColor: Record<string, string> = {
        QUEUED: "bg-blue-100 text-blue-700",
        IN_PROGRESS: "bg-yellow-100 text-yellow-700",
        LEAD_CAPTURED: "bg-green-100 text-green-700",
        CALLBACK_BOOKED: "bg-blue-100 text-blue-700",
        NOT_INTERESTED: "bg-red-100 text-red-700",
        VOICEMAIL: "bg-amber-100 text-amber-700",
        GATEKEEPER_BLOCKED: "bg-red-100 text-red-700",
        NO_ANSWER: "bg-gray-100 text-gray-700",
        FAILED: "bg-red-100 text-red-700",
    };

    return (
        <main className="mx-auto max-w-6xl p-6 space-y-6">
            <header>
                <Link
                    href={`/outreach/campaigns/${campaign.id}`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                >
                    ← Back to Campaign
                </Link>
                <h1 className="text-3xl font-bold mt-2">📋 Call Log</h1>
                <p className="text-muted-foreground">{campaign.name} · {calls.length} calls</p>
            </header>

            {calls.length === 0 ? (
                <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground py-12">
                        No calls have been made yet.
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="pt-4">
                        <div className="space-y-4">
                            {calls.map((call) => (
                                <div key={call.id} className="border rounded-lg p-4 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium">{call.reportLocationPlace.place.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {call.reportLocationPlace.place.phone}
                                                {call.callDuration && ` · ${formatDuration(call.callDuration)}`}
                                                {call.lastCallAt && ` · ${call.lastCallAt.toLocaleString("en-GB")}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                Attempt {call.callAttempts}
                                            </span>
                                            <span
                                                className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor[call.callStatus] ?? "bg-gray-100"}`}
                                            >
                                                {call.callStatus.toLowerCase().replace("_", " ")}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Extracted data */}
                                    {(call.extractedName || call.extractedEmail) && (
                                        <div className="bg-green-50 rounded p-2 text-sm flex gap-4">
                                            {call.extractedName && (
                                                <span>👤 {call.extractedName}</span>
                                            )}
                                            {call.extractedEmail && (
                                                <span>📧 {call.extractedEmail}</span>
                                            )}
                                            {call.callbackTime && (
                                                <span>📅 Callback: {call.callbackTime}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Call summary */}
                                    {call.callSummary && (
                                        <div className="text-sm">
                                            <strong>Summary:</strong> {call.callSummary}
                                        </div>
                                    )}

                                    {/* Transcript */}
                                    {call.transcript && (
                                        <details className="text-sm">
                                            <summary className="cursor-pointer text-blue-600 hover:underline">
                                                View transcript
                                            </summary>
                                            <pre className="mt-2 whitespace-pre-wrap text-xs bg-muted rounded p-3 max-h-60 overflow-y-auto">
                                                {call.transcript}
                                            </pre>
                                        </details>
                                    )}

                                    {/* Recording */}
                                    {call.recordingUrl && (
                                        <audio controls src={call.recordingUrl} className="w-full" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </main>
    );
}

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}
