"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type CategoryInfo = {
  category: string;
  total: number;
  withPhone: number;
  hasExistingCampaign: boolean;
  businesses: Array<{
    rlpId: string;
    placeId: string;
    name: string;
    phone: string | null;
    website: string | null;
    address: string | null;
  }>;
};

export default function CreateVoiceCampaign({
  locationId,
  postcode,
  categories,
}: {
  locationId: string;
  postcode: string;
  categories: CategoryInfo[];
}) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [carparkName, setCarparkName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = categories.find((c) => c.category === selectedCategory);

  const createCampaign = async () => {
    if (!selected || !carparkName.trim()) return;

    setCreating(true);
    setError(null);

    try {
      // Only include businesses with phone numbers
      const callableBusinesses = selected.businesses.filter((b) => b.phone);
      const businessIds = callableBusinesses.map((b) => b.rlpId);

      const res = await fetch("/api/outreach/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId,
          category: selected.category,
          postcode,
          businessIds,
          carparkName: carparkName.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create campaign");
      }

      const data = await res.json();
      router.push(`/outreach/campaigns/${data.campaignId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((cat) => {
          const coverage = cat.total > 0 ? Math.round((cat.withPhone / cat.total) * 100) : 0;
          const isSelected = selectedCategory === cat.category;

          return (
            <Card
              key={cat.category}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? "ring-2 ring-primary shadow-md"
                  : cat.hasExistingCampaign
                    ? "opacity-60"
                    : ""
              }`}
              onClick={() => {
                if (!cat.hasExistingCampaign) {
                  setSelectedCategory(isSelected ? null : cat.category);
                }
              }}
            >
              <CardContent className="pt-4 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">{cat.category}</h3>
                  {cat.hasExistingCampaign ? (
                    <Badge variant="outline" className="text-xs">
                      Campaign exists
                    </Badge>
                  ) : (
                    <Badge
                      variant={coverage >= 70 ? "default" : coverage >= 40 ? "secondary" : "outline"}
                      className={`text-xs ${coverage >= 70 ? "bg-green-600" : ""}`}
                    >
                      {coverage}% callable
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{cat.total} businesses</span>
                  <span className="text-green-600">📞 {cat.withPhone}</span>
                  {cat.total - cat.withPhone > 0 && (
                    <span className="text-red-400">❌ {cat.total - cat.withPhone}</span>
                  )}
                </div>

                {/* Mini progress bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${coverage}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Campaign Creation Panel */}
      {selected && (
        <Card className="border-primary/30">
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-semibold">
              Create Voice Campaign: {selected.category}
            </h3>

            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="bg-muted rounded p-3">
                <p className="text-xl font-bold">{selected.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="bg-green-50 rounded p-3">
                <p className="text-xl font-bold text-green-600">{selected.withPhone}</p>
                <p className="text-xs text-muted-foreground">📞 Callable</p>
              </div>
              <div className="bg-red-50 rounded p-3">
                <p className="text-xl font-bold text-red-500">
                  {selected.total - selected.withPhone}
                </p>
                <p className="text-xs text-muted-foreground">❌ No Phone</p>
              </div>
            </div>

            {/* Car park name input */}
            <div>
              <label className="text-sm font-medium block mb-1.5">
                Car Park Name
                <span className="text-muted-foreground font-normal ml-1">
                  (Sarah will mention this in her pitch)
                </span>
              </label>
              <input
                type="text"
                value={carparkName}
                onChange={(e) => setCarparkName(e.target.value)}
                placeholder="e.g. Leeds City Centre Car Park"
                className="w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Business preview */}
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Preview {selected.withPhone} callable businesses
              </summary>
              <div className="mt-2 max-h-48 overflow-y-auto space-y-1 border rounded p-2">
                {selected.businesses
                  .filter((b) => b.phone)
                  .map((b) => (
                    <div
                      key={b.rlpId}
                      className="flex items-center justify-between py-1 px-2 text-xs border-b last:border-0"
                    >
                      <span className="font-medium">{b.name}</span>
                      <span className="text-muted-foreground">{b.phone}</span>
                    </div>
                  ))}
              </div>
            </details>

            {/* Info banner */}
            <div className="bg-blue-50 rounded p-3 text-xs text-blue-700 space-y-1">
              <p>📞 Sarah will call during business hours: Mon-Fri, 10:00-11:30 & 14:30-16:30</p>
              <p>🔄 Voicemails and no-answers retry up to 3 times (24-48hr gaps)</p>
              <p>📋 CTPS screening runs automatically before first call</p>
              <p>📊 All calls are transcribed and analysed for decision-maker info</p>
            </div>

            {error && (
              <div className="bg-red-50 rounded p-3 text-sm text-red-600">{error}</div>
            )}

            <Button
              onClick={createCampaign}
              disabled={creating || !carparkName.trim() || selected.withPhone === 0}
              className="w-full"
            >
              {creating
                ? "Creating campaign..."
                : `🚀 Create Campaign (${selected.withPhone} businesses)`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
