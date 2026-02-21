"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VoiceConfigState {
    configured: boolean;
    callingEnabled: boolean;
    maxConcurrent: number;
    maxAttempts: number;
    hasTwilio: boolean;
    hasVapi: boolean;
    hasWebhookSecret: boolean;
}

interface FormState {
    twilioSid: string;
    twilioAuthToken: string;
    vapiApiKey: string;
    vapiAssistantId: string;
    vapiPhoneNumId: string;
    callingEnabled: boolean;
    maxConcurrent: number;
    maxAttempts: number;
    webhookSecret: string;
}

export default function VoiceConfigPage() {
    const [config, setConfig] = useState<VoiceConfigState | null>(null);
    const [form, setForm] = useState<FormState>({
        twilioSid: "",
        twilioAuthToken: "",
        vapiApiKey: "",
        vapiAssistantId: "",
        vapiPhoneNumId: "",
        callingEnabled: false,
        maxConcurrent: 1,
        maxAttempts: 3,
        webhookSecret: "",
    });
    const [saving, setSaving] = useState(false);
    const [testPhone, setTestPhone] = useState("");
    const [testStatus, setTestStatus] = useState("");

    const fetchConfig = useCallback(async () => {
        const res = await fetch("/api/outreach/voice/config");
        if (res.ok) setConfig(await res.json());
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const saveConfig = async () => {
        setSaving(true);
        const res = await fetch("/api/outreach/voice/config", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        if (res.ok) {
            await fetchConfig();
        }
        setSaving(false);
    };

    const testCall = async () => {
        if (!testPhone) return;
        setTestStatus("Calling...");
        const res = await fetch("/api/outreach/voice/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "test-call", phoneNumber: testPhone }),
        });
        const data = await res.json();
        setTestStatus(res.ok ? `✅ Call initiated (ID: ${data.callId})` : `❌ ${data.error}`);
    };

    const setField = (key: keyof FormState, value: any) => {
        setForm((p) => ({ ...p, [key]: value }));
    };

    return (
        <main className="mx-auto max-w-3xl p-6 space-y-6">
            <header>
                <Link href="/outreach" className="text-sm text-muted-foreground hover:text-foreground">
                    ← Back to Outreach
                </Link>
                <h1 className="text-3xl font-bold mt-2">⚙️ Voice Settings</h1>
                <p className="text-muted-foreground">Configure Twilio, Vapi, and calling behaviour</p>
            </header>

            {/* Connection Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Connection Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Badge variant={config?.hasTwilio ? "default" : "destructive"}>
                            {config?.hasTwilio ? "🟢 Twilio" : "🔴 Twilio"}
                        </Badge>
                        <Badge variant={config?.hasVapi ? "default" : "destructive"}>
                            {config?.hasVapi ? "🟢 Vapi" : "🔴 Vapi"}
                        </Badge>
                        <Badge variant={config?.hasWebhookSecret ? "default" : "outline"}>
                            {config?.hasWebhookSecret ? "🔒 Webhook Secret" : "⚠️ No Secret"}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Credentials */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Credentials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium block mb-1">Twilio Account SID</label>
                            <input
                                type="text"
                                value={form.twilioSid}
                                onChange={(e) => setField("twilioSid", e.target.value)}
                                placeholder="AC..."
                                className="w-full border rounded px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Twilio Auth Token</label>
                            <input
                                type="password"
                                value={form.twilioAuthToken}
                                onChange={(e) => setField("twilioAuthToken", e.target.value)}
                                placeholder="••••••••"
                                className="w-full border rounded px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Vapi API Key</label>
                            <input
                                type="password"
                                value={form.vapiApiKey}
                                onChange={(e) => setField("vapiApiKey", e.target.value)}
                                placeholder="••••••••"
                                className="w-full border rounded px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Vapi Assistant ID</label>
                            <input
                                type="text"
                                value={form.vapiAssistantId}
                                onChange={(e) => setField("vapiAssistantId", e.target.value)}
                                placeholder="asst_..."
                                className="w-full border rounded px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Vapi Phone Number ID</label>
                            <input
                                type="text"
                                value={form.vapiPhoneNumId}
                                onChange={(e) => setField("vapiPhoneNumId", e.target.value)}
                                placeholder="pn_..."
                                className="w-full border rounded px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Webhook Secret</label>
                            <input
                                type="text"
                                value={form.webhookSecret}
                                onChange={(e) => setField("webhookSecret", e.target.value)}
                                placeholder="Optional — validates Vapi webhooks"
                                className="w-full border rounded px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Calling Config */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Calling Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="callingEnabled"
                            checked={form.callingEnabled}
                            onChange={(e) => setField("callingEnabled", e.target.checked)}
                            className="h-4 w-4"
                        />
                        <label htmlFor="callingEnabled" className="text-sm font-medium">
                            Enable calling
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium block mb-1">
                                Max concurrent calls: {form.maxConcurrent}
                            </label>
                            <input
                                type="range"
                                min={1}
                                max={5}
                                value={form.maxConcurrent}
                                onChange={(e) => setField("maxConcurrent", parseInt(e.target.value))}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">
                                Max retry attempts: {form.maxAttempts}
                            </label>
                            <input
                                type="range"
                                min={1}
                                max={5}
                                value={form.maxAttempts}
                                onChange={(e) => setField("maxAttempts", parseInt(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="text-sm text-muted-foreground bg-muted rounded p-3">
                        <strong>Calling windows (UK time):</strong> Mon–Fri, 10:00–11:30 + 14:30–16:30
                    </div>

                    <Button onClick={saveConfig} disabled={saving} className="w-full">
                        {saving ? "Saving..." : "Save Configuration"}
                    </Button>
                </CardContent>
            </Card>

            {/* Test Call */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Test Call</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Enter your phone number to test Sarah&apos;s call script.
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="tel"
                            value={testPhone}
                            onChange={(e) => setTestPhone(e.target.value)}
                            placeholder="07700 900000"
                            className="flex-1 border rounded px-3 py-2 text-sm"
                        />
                        <Button onClick={testCall} disabled={!testPhone || !config?.configured}>
                            📞 Call Me
                        </Button>
                    </div>
                    {testStatus && (
                        <p className="text-sm">{testStatus}</p>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
