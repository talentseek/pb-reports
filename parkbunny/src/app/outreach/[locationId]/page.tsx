import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CreateVoiceCampaign from "./CreateVoiceCampaign";

export default async function OutreachLocationPage({
  params,
}: {
  params: { locationId: string };
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const location = await prisma.reportLocation.findUnique({
    where: { id: params.locationId, status: "LIVE" },
    include: {
      report: { select: { id: true, name: true } },
      places: {
        where: { included: true },
        include: {
          place: {
            select: {
              id: true,
              name: true,
              phone: true,
              website: true,
              address: true,
              types: true,
            },
          },
        },
      },
      campaigns: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          status: true,
          businessType: true,
          createdAt: true,
        },
      },
    },
  });

  if (!location) notFound();

  // Group businesses by category
  type CategoryGroup = {
    category: string;
    businesses: Array<{
      rlpId: string;
      placeId: string;
      name: string;
      phone: string | null;
      website: string | null;
      address: string | null;
    }>;
    withPhone: number;
    total: number;
  };

  const categoryMap = new Map<string, CategoryGroup>();
  for (const rlp of location.places) {
    const cat = rlp.groupedCategory || "Other";
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, { category: cat, businesses: [], withPhone: 0, total: 0 });
    }
    const group = categoryMap.get(cat)!;
    group.businesses.push({
      rlpId: rlp.id,
      placeId: rlp.place.id,
      name: rlp.place.name,
      phone: rlp.place.phone,
      website: rlp.place.website,
      address: rlp.place.address,
    });
    group.total++;
    if (rlp.place.phone) group.withPhone++;
  }

  const categories = Array.from(categoryMap.values()).sort(
    (a, b) => b.withPhone - a.withPhone
  );

  const totalBusinesses = location.places.length;
  const totalWithPhone = location.places.filter((p) => p.place.phone).length;

  // Check for existing campaigns to avoid duplicates
  const existingCampaignCategories = location.campaigns.map((c) => c.businessType);

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <header>
        <Link
          href="/outreach"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Campaign Monitor
        </Link>
        <h1 className="text-3xl font-bold mt-2">{location.postcode}</h1>
        <p className="text-muted-foreground">
          {location.report.name} · {totalBusinesses} businesses · {totalWithPhone}{" "}
          with phone ({totalBusinesses > 0 ? Math.round((totalWithPhone / totalBusinesses) * 100) : 0}%)
        </p>
      </header>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{totalBusinesses}</p>
            <p className="text-xs text-muted-foreground">Total Businesses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-600">{totalWithPhone}</p>
            <p className="text-xs text-muted-foreground">📞 Callable</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-red-500">
              {totalBusinesses - totalWithPhone}
            </p>
            <p className="text-xs text-muted-foreground">❌ No Phone</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{categories.length}</p>
            <p className="text-xs text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Existing campaigns for this location */}
      {location.campaigns.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Existing Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {location.campaigns.map((c) => (
                <Link
                  key={c.id}
                  href={`/outreach/campaigns/${c.id}`}
                  className="flex items-center justify-between p-3 rounded border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <span className="font-medium text-sm">{c.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge
                    variant={
                      c.status === "COMPLETED"
                        ? "default"
                        : c.status === "CALLING"
                          ? "secondary"
                          : "outline"
                    }
                    className="capitalize text-xs"
                  >
                    {c.status.toLowerCase().replace("_", " ")}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category breakdown with campaign creation */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Create Voice Campaign</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Select a business category to create a voice outreach campaign. Sarah will
          call each business with a phone number and pitch discounted parking.
        </p>

        <CreateVoiceCampaign
          locationId={location.id}
          postcode={location.postcode}
          categories={categories.map((c) => ({
            category: c.category,
            total: c.total,
            withPhone: c.withPhone,
            hasExistingCampaign: existingCampaignCategories.includes(c.category),
            businesses: c.businesses,
          }))}
        />
      </section>
    </main>
  );
}
