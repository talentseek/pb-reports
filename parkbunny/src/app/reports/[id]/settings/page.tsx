"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Settings = {
  upliftPercentages?: Record<string, number>
  signUpRates?: Record<string, number>
  estimatedRevenuePerPostcode?: number
  postcodesCount?: number
}

export default function ReportSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const res = await fetch(`/api/reports/${params.id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (isMounted) setSettings(data.settings ?? {});
    })();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${params.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push(`/reports/${params.id}`);
    } catch (e: any) {
      setError(e.message ?? "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Report Settings</h1>
      <div className="space-y-3">
        <label className="block text-sm">Estimated revenue per postcode (£)</label>
        <input
          className="w-full rounded border px-3 py-2"
          type="number"
          value={settings.estimatedRevenuePerPostcode ?? 50000}
          onChange={(e) => setSettings((s) => ({ ...s, estimatedRevenuePerPostcode: Number(e.target.value) }))}
        />
        <label className="block text-sm">Postcodes count</label>
        <input
          className="w-full rounded border px-3 py-2"
          type="number"
          value={settings.postcodesCount ?? 1}
          onChange={(e) => setSettings((s) => ({ ...s, postcodesCount: Number(e.target.value) }))}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button onClick={onSave} disabled={saving} className="rounded bg-black text-white px-4 py-2 disabled:opacity-60">{saving ? "Saving..." : "Save"}</button>
        <button onClick={() => router.push(`/reports/${params.id}`)} className="rounded border px-4 py-2">Cancel</button>
      </div>
    </main>
  );
}


