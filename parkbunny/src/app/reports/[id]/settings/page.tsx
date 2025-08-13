"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { defaultSettings } from "@/lib/calculations";

type Settings = {
  upliftPercentages?: Record<string, number>
  signUpRates?: Record<string, number>
  estimatedRevenuePerPostcode?: number
  postcodesCount?: number
  categoryUplift?: Record<string, number>
  categorySignUp?: Record<string, number>
  transactionFeePercent?: number
  convenienceFeePence?: number
  sharePasswordPlain?: string
}

export default function ReportSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareEnabled, setShareEnabled] = useState<boolean>(false);
  const [sharePassword, setSharePassword] = useState<string>("");
  const [categoryToggles, setCategoryToggles] = useState<{ category: string; included: boolean; total: number }[]>([])

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const res = await fetch(`/api/reports/${params.id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (isMounted) {
        const incoming = (data.settings ?? {}) as Settings;
        setShareEnabled(Boolean(data.shareEnabled));
        setShareUrl(data.shareCode ? `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/share/${data.shareCode}` : null);
        if (data.shareEnabled && data.shareCode && !data.sharePasswordHash) {
          // Show the default password hint once if no explicit password set
          setSharePassword(process.env.NEXT_PUBLIC_SHARE_DEFAULT_PASSWORD || 'parkbunny');
        }
        setSettings({
          estimatedRevenuePerPostcode: incoming.estimatedRevenuePerPostcode ?? defaultSettings.estimatedRevenuePerPostcode,
          postcodesCount: incoming.postcodesCount ?? defaultSettings.postcodesCount,
          categoryUplift: incoming.categoryUplift || {},
          categorySignUp: incoming.categorySignUp || {},
          transactionFeePercent: incoming.transactionFeePercent ?? 1.5,
          convenienceFeePence: incoming.convenienceFeePence ?? 25,
          sharePasswordPlain: incoming.sharePasswordPlain || undefined,
        });
      }
    })();
    // load category summary
    ;(async () => {
      const csr = await fetch(`/api/reports/${params.id}/categories`)
      if (csr.ok) {
        const data = await csr.json()
        setCategoryToggles(data.categories)
      }
    })()
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

  async function saveCategory(cat: string, included: boolean) {
    await fetch(`/api/reports/${params.id}/categories`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: cat, included }),
    })
  }

  async function updateShare(opts: { enable?: boolean; password?: string; regenerate?: boolean }) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${params.id}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opts),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setShareEnabled(Boolean(data.shareEnabled));
      setShareUrl(data.shareCode ? `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/share/${data.shareCode}` : null);
    } catch (e: any) {
      setError(e.message ?? "Failed to update share settings");
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
        <h2 className="font-medium mt-4">Categories</h2>
        <div className="rounded border divide-y">
          {categoryToggles.map((c) => (
            <label key={c.category} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="capitalize">{c.category}</span>
              <span className="flex items-center gap-3">
                <span className="text-gray-600">{c.included}/{c.total}</span>
                <input type="checkbox" checked={c.included} onChange={async (e) => {
                  const next = e.target.checked
                  setCategoryToggles((prev) => prev.map((x) => x.category === c.category ? { ...x, included: next } : x))
                  await saveCategory(c.category, next)
                }} />
              </span>
            </label>
          ))}
        </div>

        <h2 className="font-medium mt-4">Uplift percentages</h2>
        <div className="space-y-2">
          {categoryToggles.map((c) => (
            <div key={c.category} className="flex items-center gap-2">
              <label className="w-48 text-sm capitalize">{c.category}</label>
              <input
                className="flex-1 rounded border px-3 py-2"
                type="number"
                step={0.01}
                value={(settings.categoryUplift?.[c.category] ?? 0.06).toString()}
                onChange={(e) => setSettings((s) => ({ ...s, categoryUplift: { ...(s.categoryUplift ?? {}), [c.category]: Number(e.target.value) } }))}
              />
            </div>
          ))}
        </div>
        <h2 className="font-medium mt-4">Sign-up rates</h2>
        <div className="space-y-2">
          {categoryToggles.map((c) => (
            <div key={c.category} className="flex items-center gap-2">
              <label className="w-48 text-sm capitalize">{c.category}</label>
              <input
                className="flex-1 rounded border px-3 py-2"
                type="number"
                step={0.01}
                value={(settings.categorySignUp?.[c.category] ?? 0.05).toString()}
                onChange={(e) => setSettings((s) => ({ ...s, categorySignUp: { ...(s.categorySignUp ?? {}), [c.category]: Number(e.target.value) } }))}
              />
            </div>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button onClick={onSave} disabled={saving} className="rounded bg-primary text-primary-foreground px-4 py-2 disabled:opacity-60 hover:opacity-90">{saving ? "Saving..." : "Save"}</button>
        <button onClick={() => router.push(`/reports/${params.id}`)} className="rounded border px-4 py-2">Cancel</button>
      </div>

      <hr className="my-6" />
      <h2 className="text-xl font-semibold">Public link</h2>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-sm">Enable public link</label>
          <input type="checkbox" checked={shareEnabled} onChange={(e) => updateShare({ enable: e.target.checked })} />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <div className="flex gap-2">
            <input className="rounded border px-3 py-2 flex-1" type="text" value={sharePassword} onChange={(e) => setSharePassword(e.target.value)} />
            <button type="button" onClick={() => updateShare({ password: sharePassword })} className="rounded border px-3 py-2">Set</button>
          </div>
          {settings.sharePasswordPlain ? (
            <p className="text-xs text-gray-600 mt-1">Current password: <span className="font-medium">{settings.sharePasswordPlain}</span></p>
          ) : null}
        </div>
      <hr className="my-6" />
      <h2 className="text-xl font-semibold">Commercial Terms</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm">Transaction fee (%)</label>
          <input
            className="w-full rounded border px-3 py-2"
            type="number"
            step={0.1}
            value={settings.transactionFeePercent ?? 1.5}
            onChange={(e) => setSettings((s) => ({ ...s, transactionFeePercent: Number(e.target.value) }))}
          />
        </div>
        <div>
          <label className="block text-sm">Convenience fee (pence)</label>
          <input
            className="w-full rounded border px-3 py-2"
            type="number"
            step={1}
            value={settings.convenienceFeePence ?? 25}
            onChange={(e) => setSettings((s) => ({ ...s, convenienceFeePence: Number(e.target.value) }))}
          />
        </div>
      </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => updateShare({ regenerate: true })} className="rounded border px-3 py-2">Regenerate link</button>
          {shareUrl && <a href={shareUrl} target="_blank" className="text-sm underline">{shareUrl}</a>}
        </div>
      </div>
    </main>
  );
}


