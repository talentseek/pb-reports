"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { defaultSettings } from "@/lib/calculations";

type StreamType = 'LOCKER' | 'CAR_WASH' | 'EV_CHARGING' | 'FARMERS_MARKET'

type StreamConfig = {
  id?: string
  streamType: StreamType
  enabled: boolean
  ratePerSite: number | null
  rateMin: number | null
  rateMax: number | null
  excludedLocations: { locationId: string }[]
}

type LocationInfo = {
  id: string
  postcode: string
}

const STREAM_LABELS: Record<StreamType, string> = {
  LOCKER: 'Smart Lockers',
  CAR_WASH: 'Self-Service Car Wash',
  EV_CHARGING: 'EV Charging (RevShare)',
  FARMERS_MARKET: 'Farmers Markets',
}

const STREAM_DEFAULTS: Record<StreamType, { rate?: number; min?: number; max?: number; isTextOnly?: boolean; textDisplay?: string }> = {
  LOCKER: { rate: 900 },
  CAR_WASH: { min: 10000, max: 20000 },
  EV_CHARGING: { rate: 3600 },
  FARMERS_MARKET: { isTextOnly: true, textDisplay: '£1,000 – £2,500 per day' },
}

const ALL_STREAM_TYPES: StreamType[] = ['LOCKER', 'CAR_WASH', 'EV_CHARGING', 'FARMERS_MARKET']

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
  placesMaxPerType?: number
  useCustomCommercialTerms?: boolean
  customCommercialTermsText?: string
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
  const [reportName, setReportName] = useState<string>("");
  const [streams, setStreams] = useState<StreamConfig[]>([])
  const [locations, setLocations] = useState<LocationInfo[]>([])

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const res = await fetch(`/api/reports/${params.id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (isMounted) {
        // Check if report is archived
        if (data.archived) {
          router.push('/dashboard');
          return;
        }

        const incoming = (data.settings ?? {}) as Settings;
        setReportName(data.name || "");
        setShareEnabled(Boolean(data.shareEnabled));
        setShareUrl(data.shareCode ? `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/share/${data.shareCode}` : null);
        if (data.shareEnabled && data.shareCode && !data.sharePasswordHash) {
          // Show the default password hint once if no explicit password set
          setSharePassword(process.env.NEXT_PUBLIC_SHARE_DEFAULT_PASSWORD || 'parkbunny');
        }
        setSettings({
          estimatedRevenuePerPostcode: incoming.estimatedRevenuePerPostcode ?? defaultSettings.estimatedRevenuePerPostcode,
          postcodesCount: incoming.postcodesCount ?? defaultSettings.postcodesCount,
          placesMaxPerType: Math.max(1, Math.min(100, incoming.placesMaxPerType ?? 10)),
          categoryUplift: incoming.categoryUplift || {},
          categorySignUp: incoming.categorySignUp || {},
          transactionFeePercent: incoming.transactionFeePercent ?? 1.5,
          convenienceFeePence: incoming.convenienceFeePence ?? 25,
          sharePasswordPlain: incoming.sharePasswordPlain || undefined,
          useCustomCommercialTerms: incoming.useCustomCommercialTerms ?? false,
          customCommercialTermsText: incoming.customCommercialTermsText || '',
        });
      }
    })();
    // load category summary
    ; (async () => {
      const csr = await fetch(`/api/reports/${params.id}/categories`)
      if (csr.ok) {
        const data = await csr.json()
        setCategoryToggles(data.categories)
      }
    })()
      // load revenue streams
      ; (async () => {
        const sr = await fetch(`/api/reports/${params.id}/streams`)
        if (sr.ok) {
          const data = await sr.json()
          // Merge DB streams with defaults for all types
          const merged: StreamConfig[] = ALL_STREAM_TYPES.map((st) => {
            const existing = (data.streams || []).find((s: any) => s.streamType === st)
            if (existing) return { ...existing }
            const def = STREAM_DEFAULTS[st]
            return {
              streamType: st,
              enabled: false,
              ratePerSite: def.rate ?? null,
              rateMin: def.min ?? null,
              rateMax: def.max ?? null,
              excludedLocations: [],
            }
          })
          if (isMounted) setStreams(merged)
        }
      })()
      // load locations for per-site grid
      ; (async () => {
        const lr = await fetch(`/api/reports/${params.id}`)
        if (lr.ok) {
          const data = await lr.json()
          if (data.locations && isMounted) {
            setLocations(data.locations.map((l: any) => ({ id: l.id, postcode: l.postcode })))
          }
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
      const payload = {
        name: reportName.trim(),
        ...settings,
        placesMaxPerType: Math.max(1, Math.min(100, settings.placesMaxPerType ?? 10)),
      }
      const res = await fetch(`/api/reports/${params.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  async function toggleStream(streamType: StreamType, enabled: boolean) {
    const def = STREAM_DEFAULTS[streamType]
    const res = await fetch(`/api/reports/${params.id}/streams`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        streamType,
        enabled,
        ratePerSite: def.rate ?? null,
        rateMin: def.min ?? null,
        rateMax: def.max ?? null,
      }),
    })
    if (res.ok) {
      const updated = await res.json()
      setStreams((prev) =>
        prev.map((s) => s.streamType === streamType ? { ...updated } : s)
      )
    }
  }

  async function updateStreamRate(streamType: StreamType, field: 'ratePerSite' | 'rateMin' | 'rateMax', value: number) {
    const res = await fetch(`/api/reports/${params.id}/streams`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ streamType, [field]: value }),
    })
    if (res.ok) {
      setStreams((prev) =>
        prev.map((s) => s.streamType === streamType ? { ...s, [field]: value } : s)
      )
    }
  }

  async function toggleLocationExclusion(stream: StreamConfig, locationId: string, exclude: boolean) {
    if (!stream.id) return
    if (exclude) {
      await fetch(`/api/reports/${params.id}/streams/${stream.id}/exclusions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId }),
      })
    } else {
      await fetch(`/api/reports/${params.id}/streams/${stream.id}/exclusions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId }),
      })
    }
    setStreams((prev) =>
      prev.map((s) => {
        if (s.streamType !== stream.streamType) return s
        const excl = exclude
          ? [...s.excludedLocations, { locationId }]
          : s.excludedLocations.filter((e) => e.locationId !== locationId)
        return { ...s, excludedLocations: excl }
      })
    )
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
        <h2 className="font-medium">Report Information</h2>
        <label className="block text-sm">Report Name</label>
        <input
          className="w-full rounded border px-3 py-2"
          type="text"
          value={reportName}
          onChange={(e) => setReportName(e.target.value)}
          placeholder="Enter report name"
        />
        <h2 className="font-medium mt-4">Revenue</h2>
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
        <label className="block text-sm mt-3">Max results per category</label>
        <input
          className="w-full rounded border px-3 py-2"
          type="number"
          min={1}
          max={100}
          value={settings.placesMaxPerType ?? 10}
          onChange={(e) => {
            const next = Number(e.target.value)
            const clamped = Number.isFinite(next) ? Math.max(1, Math.min(100, next)) : 10
            setSettings((s) => ({ ...s, placesMaxPerType: clamped }))
          }}
        />
        <p className="text-xs text-gray-600 mt-1">Default 10. Raise up to 100 if you need deeper discovery; higher values consume more Google Places quota.</p>
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
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="useCustomCommercialTerms"
              checked={settings.useCustomCommercialTerms ?? false}
              onChange={(e) => setSettings((s) => ({ ...s, useCustomCommercialTerms: e.target.checked }))}
              className="h-4 w-4"
            />
            <label htmlFor="useCustomCommercialTerms" className="text-sm font-medium">
              Use custom commercial terms
            </label>
          </div>

          {settings.useCustomCommercialTerms ? (
            <div>
              <label className="block text-sm mb-2">Custom commercial terms (freeform)</label>
              <textarea
                className="w-full rounded border px-3 py-2 min-h-[150px] font-sans"
                placeholder="Enter your custom commercial terms here..."
                value={settings.customCommercialTermsText ?? ''}
                onChange={(e) => setSettings((s) => ({ ...s, customCommercialTermsText: e.target.value }))}
              />
              <p className="text-xs text-gray-600 mt-1">
                This will replace the standard transaction and convenience fee display in the report.
              </p>
            </div>
          ) : (
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
          )}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => updateShare({ regenerate: true })} className="rounded border px-3 py-2">Regenerate link</button>
          {shareUrl && <a href={shareUrl} target="_blank" className="text-sm underline">{shareUrl}</a>}
        </div>
      </div>

      <hr className="my-6" />
      <h2 className="text-xl font-semibold">Revenue Streams</h2>
      <p className="text-sm text-gray-600 mb-3">Toggle ancillary revenue streams to include in the public report. Amounts are per site per year unless noted.</p>
      <div className="space-y-4">
        {streams.map((stream) => {
          const def = STREAM_DEFAULTS[stream.streamType]
          const isEnabled = stream.enabled
          return (
            <div key={stream.streamType} className="rounded border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-medium flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => toggleStream(stream.streamType, e.target.checked)}
                    className="h-4 w-4"
                  />
                  {STREAM_LABELS[stream.streamType]}
                </label>
                {isEnabled && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                )}
              </div>

              {isEnabled && !def.isTextOnly && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {def.rate !== undefined && (
                    <div>
                      <label className="block text-sm text-gray-600">Rate per site/year (£)</label>
                      <input
                        className="w-full rounded border px-3 py-2"
                        type="number"
                        value={stream.ratePerSite ?? def.rate}
                        onChange={(e) => updateStreamRate(stream.streamType, 'ratePerSite', Number(e.target.value))}
                      />
                    </div>
                  )}
                  {def.min !== undefined && (
                    <div>
                      <label className="block text-sm text-gray-600">Min rate per site/year (£)</label>
                      <input
                        className="w-full rounded border px-3 py-2"
                        type="number"
                        value={stream.rateMin ?? def.min}
                        onChange={(e) => updateStreamRate(stream.streamType, 'rateMin', Number(e.target.value))}
                      />
                    </div>
                  )}
                  {def.max !== undefined && (
                    <div>
                      <label className="block text-sm text-gray-600">Max rate per site/year (£)</label>
                      <input
                        className="w-full rounded border px-3 py-2"
                        type="number"
                        value={stream.rateMax ?? def.max}
                        onChange={(e) => updateStreamRate(stream.streamType, 'rateMax', Number(e.target.value))}
                      />
                    </div>
                  )}
                </div>
              )}

              {isEnabled && def.isTextOnly && (
                <p className="text-sm text-gray-600">{def.textDisplay}</p>
              )}

              {/* Per-location exclusion grid */}
              {isEnabled && stream.id && locations.length > 1 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Per-location overrides (uncheck to exclude a site):</p>
                  <div className="flex flex-wrap gap-2">
                    {locations.map((loc) => {
                      const isExcluded = stream.excludedLocations.some((e) => e.locationId === loc.id)
                      return (
                        <label key={loc.id} className="flex items-center gap-1 text-sm border rounded px-2 py-1">
                          <input
                            type="checkbox"
                            checked={!isExcluded}
                            onChange={(e) => toggleLocationExclusion(stream, loc.id, !e.target.checked)}
                            className="h-3 w-3"
                          />
                          <span className="text-xs">{loc.postcode}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </main>
  );
}
