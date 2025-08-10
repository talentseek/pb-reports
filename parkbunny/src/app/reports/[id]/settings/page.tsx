"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { defaultSettings } from "@/lib/calculations";

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
      if (isMounted) {
        const incoming = (data.settings ?? {}) as Settings;
        setSettings({
          estimatedRevenuePerPostcode: incoming.estimatedRevenuePerPostcode ?? defaultSettings.estimatedRevenuePerPostcode,
          postcodesCount: incoming.postcodesCount ?? defaultSettings.postcodesCount,
          upliftPercentages: {
            restaurants: incoming.upliftPercentages?.restaurants ?? defaultSettings.upliftPercentages.restaurants,
            bars: incoming.upliftPercentages?.bars ?? defaultSettings.upliftPercentages.bars,
            hotels: incoming.upliftPercentages?.hotels ?? defaultSettings.upliftPercentages.hotels,
            coworking: incoming.upliftPercentages?.coworking ?? defaultSettings.upliftPercentages.coworking,
            gyms: incoming.upliftPercentages?.gyms ?? defaultSettings.upliftPercentages.gyms,
          },
          signUpRates: {
            restaurants: incoming.signUpRates?.restaurants ?? defaultSettings.signUpRates.restaurants,
            bars: incoming.signUpRates?.bars ?? defaultSettings.signUpRates.bars,
            hotels: incoming.signUpRates?.hotels ?? defaultSettings.signUpRates.hotels,
            coworking: incoming.signUpRates?.coworking ?? defaultSettings.signUpRates.coworking,
            gyms: incoming.signUpRates?.gyms ?? defaultSettings.signUpRates.gyms,
          },
        });
      }
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
        <h2 className="font-medium">Revenue</h2>
        <label className="block text-sm">Estimated revenue per postcode (£)</label>
        <input
          className="w-full rounded border px-3 py-2"
          type="number"
          value={settings.estimatedRevenuePerPostcode ?? defaultSettings.estimatedRevenuePerPostcode}
          onChange={(e) => setSettings((s) => ({ ...s, estimatedRevenuePerPostcode: Number(e.target.value) }))}
        />
        <label className="block text-sm">Postcodes count</label>
        <input
          className="w-full rounded border px-3 py-2"
          type="number"
          value={settings.postcodesCount ?? defaultSettings.postcodesCount}
          onChange={(e) => setSettings((s) => ({ ...s, postcodesCount: Number(e.target.value) }))}
        />
        <h2 className="font-medium mt-4">Uplift percentages</h2>
        {(['restaurants','bars','hotels','coworking','gyms'] as const).map((k) => (
          <div key={k} className="flex items-center gap-2">
            <label className="w-32 text-sm capitalize">{k}</label>
            <input
              className="flex-1 rounded border px-3 py-2"
              type="number"
              step={0.01}
              value={settings.upliftPercentages?.[k] ?? defaultSettings.upliftPercentages[k]}
              onChange={(e) => setSettings((s) => ({ ...s, upliftPercentages: { ...(s.upliftPercentages ?? {}), [k]: Number(e.target.value) } }))}
            />
          </div>
        ))}
        <h2 className="font-medium mt-4">Sign-up rates</h2>
        {(['restaurants','bars','hotels','coworking','gyms'] as const).map((k) => (
          <div key={k} className="flex items-center gap-2">
            <label className="w-32 text-sm capitalize">{k}</label>
            <input
              className="flex-1 rounded border px-3 py-2"
              type="number"
              step={0.01}
              value={settings.signUpRates?.[k] ?? defaultSettings.signUpRates[k]}
              onChange={(e) => setSettings((s) => ({ ...s, signUpRates: { ...(s.signUpRates ?? {}), [k]: Number(e.target.value) } }))}
            />
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button onClick={onSave} disabled={saving} className="rounded bg-black text-white px-4 py-2 disabled:opacity-60">{saving ? "Saving..." : "Save"}</button>
        <button onClick={() => router.push(`/reports/${params.id}`)} className="rounded border px-4 py-2">Cancel</button>
      </div>
    </main>
  );
}


