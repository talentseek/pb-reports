import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import AIOutreachClient from "@/components/outreach/AIOutreachClient";

export default async function OutreachLocationPage({
  params
}: {
  params: { locationId: string }
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Fetch the specific location
  const location = await prisma.reportLocation.findUnique({
    where: {
      id: params.locationId,
      status: 'LIVE'
    },
    include: {
      report: {
        select: {
          name: true
        }
      },
      places: {
        where: {
          included: true
        },
        include: {
          place: true
        }
      }
    }
  });

  if (!location) {
    notFound();
  }

  // Transform data for client component
  const businesses = location.places.map(p => ({
    id: p.place.placeId,
    name: p.place.name,
    category: p.groupedCategory || 'Other',
    address: p.place.address,
    website: p.place.website,
  }));

  return (
    <AIOutreachClient
      locationId={location.id}
      postcode={location.postcode}
      reportName={location.report.name}
      businesses={businesses}
    />
  );
}
