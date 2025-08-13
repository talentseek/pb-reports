import prisma from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import ReportView from "@/components/report/ReportView";
import Link from "next/link";
import RefreshPlacesButton from "@/components/RefreshPlacesButton";
import { PLACE_CATEGORIES } from "@/lib/placesCategories";
import CopyLinkButton from "@/components/CopyLinkButton";

export default async function ReportViewPage({ params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) {
    notFound();
  }

  const report = await prisma.report.findFirst({
    where: { id: params.id },
    include: { businesses: true },
  });
  if (!report) {
    notFound();
  }

  const postcodesCount = String(report.postcodes).split(',').map((s) => s.trim()).filter(Boolean).length
  const settings = (report.settings ?? {}) as any
  const maxPerType = typeof settings.placesMaxPerType === 'number' ? settings.placesMaxPerType : 10
  const categoriesCount = PLACE_CATEGORIES.length

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      <div className="rounded border p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Public link</p>
          {report.shareEnabled && report.shareCode ? (
            <p className="text-sm">
              <a className="underline" href={`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/share/${report.shareCode}`} target="_blank">{`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/share/${report.shareCode}`}</a>
            </p>
          ) : (
            <p className="text-sm text-gray-500">Sharing disabled</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {report.shareEnabled && report.shareCode ? (
            <CopyLinkButton url={`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/share/${report.shareCode}`} label="Copy" />
          ) : null}
          <RefreshPlacesButton reportId={report.id} postcodesCount={postcodesCount} categoriesCount={categoriesCount} maxPerType={maxPerType} />
          <Link href={`/reports/${report.id}/settings`} className="text-sm underline">Manage</Link>
        </div>
      </div>
      <ReportView report={report} />
    </main>
  );
}


