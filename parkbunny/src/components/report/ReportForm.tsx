"use client";
import { useState } from "react";
import { validateUkPostcodes } from "@/lib/postcode";

export default function ReportForm() {
  const [name, setName] = useState("");
  const [postcodes, setPostcodes] = useState("");
  const [estimatedRevenuePerPostcode, setEstimatedRevenuePerPostcode] = useState<number>(50000);
  const [radiusMiles, setRadiusMiles] = useState<number>(0.75);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const parsed = validateUkPostcodes(postcodes);
      if (!parsed.valid) throw new Error(parsed.message ?? "Invalid postcodes");
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, postcodes: parsed.postcodes, estimatedRevenuePerPostcode, radiusMiles }),
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
        <label className="block text-sm font-medium">Report Name</label>
        <input
          className="mt-1 w-full rounded border px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Search radius (miles)</label>
        <input
          className="mt-1 w-full rounded border px-3 py-2"
          type="number"
          min={0.5}
          max={10}
          step={0.25}
          value={radiusMiles}
          onChange={(e) => setRadiusMiles(Number(e.target.value))}
          required
        />
        <p className="text-xs text-gray-500 mt-1">Default 0.75 miles. You can reduce to 0.5 or extend up to 10 miles.</p>
      </div>
      <div>
        <label className="block text-sm font-medium">Estimated carpark revenue per postcode (£)</label>
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
          placeholder="SW1A 1AA, SW1A 2AA"
          value={postcodes}
          onChange={(e) => setPostcodes(e.target.value)}
          required
        />
        <p className="text-xs text-gray-500 mt-1">Comma-separated UK postcodes</p>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        className="rounded bg-black text-white px-4 py-2 disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Report"}
      </button>
    </form>
  );
}


