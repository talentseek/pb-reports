"use client";
import { useState } from "react";
import { validatePostcodes } from "@/lib/postcode";
import { MARKETS, DEFAULT_MARKET, type MarketCode } from "@/lib/market-config";

export default function ReportForm() {
  const [name, setName] = useState("");
  const [market, setMarket] = useState<MarketCode>(DEFAULT_MARKET);
  const [postcodes, setPostcodes] = useState("");
  const [estimatedRevenuePerPostcode, setEstimatedRevenuePerPostcode] = useState<number>(50000);
  const [radiusMiles, setRadiusMiles] = useState<number>(0.75);
  const [placesMaxPerType, setPlacesMaxPerType] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mc = MARKETS[market];
  const radiusLabel = mc.distanceUnit === 'km' ? 'Search radius (km)' : 'Search radius (miles)';
  const radiusHint = mc.distanceUnit === 'km'
    ? 'Default 1.2 km. You can adjust between 0.5 and 16 km.'
    : 'Default 0.75 miles. You can reduce to 0.5 or extend up to 10 miles.';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const parsed = validatePostcodes(postcodes, market);
      if (!parsed.valid) throw new Error(parsed.message ?? "Invalid postcodes");
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          postcodes: parsed.postcodes,
          estimatedRevenuePerPostcode,
          radiusMiles,
          placesMaxPerType,
          market,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const report = await res.json();
      window.location.href = `/reports/${report.id}`;
    } catch (err: any) {
      setError(err.message ?? "Failed to create report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Market</label>
        <div className="mt-1 flex gap-2">
          {(Object.keys(MARKETS) as MarketCode[]).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setMarket(code)}
              className={`flex items-center gap-2 rounded border px-4 py-2 text-sm font-medium transition-all ${
                market === code
                  ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{MARKETS[code].flag}</span>
              {MARKETS[code].label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Report Name</label>
        <input
          className="mt-1 w-full rounded border px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Max results per category (testing)</label>
        <input
          className="mt-1 w-full rounded border px-3 py-2"
          type="number"
          min={1}
          max={100}
          step={1}
          value={placesMaxPerType}
          onChange={(e) => setPlacesMaxPerType(Number(e.target.value))}
          required
        />
        <p className="text-xs text-gray-500 mt-1">Default 10. Lower this to reduce API calls and costs during testing. You can raise it up to 100 when needed.</p>
      </div>
      <div>
        <label className="block text-sm font-medium">{radiusLabel}</label>
        <input
          className="mt-1 w-full rounded border px-3 py-2"
          type="number"
          min={0.5}
          max={mc.distanceUnit === 'km' ? 16 : 10}
          step={0.25}
          value={radiusMiles}
          onChange={(e) => setRadiusMiles(Number(e.target.value))}
          required
        />
        <p className="text-xs text-gray-500 mt-1">{radiusHint}</p>
      </div>
      <div>
        <label className="block text-sm font-medium">Estimated carpark revenue per postcode ({mc.currencySymbol})</label>
        <input
          className="mt-1 w-full rounded border px-3 py-2"
          type="number"
          min={0}
          step={100}
          value={estimatedRevenuePerPostcode}
          onChange={(e) => setEstimatedRevenuePerPostcode(Number(e.target.value))}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Postcode(s)</label>
        <input
          className="mt-1 w-full rounded border px-3 py-2"
          placeholder={mc.postcodePlaceholder}
          value={postcodes}
          onChange={(e) => setPostcodes(e.target.value)}
          required
        />
        <p className="text-xs text-gray-500 mt-1">Comma-separated {mc.label} postcodes (e.g. {mc.postcodeFormat})</p>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        className="rounded bg-primary text-primary-foreground px-4 py-2 disabled:opacity-60 hover:opacity-90"
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Report"}
      </button>
    </form>
  );
}
