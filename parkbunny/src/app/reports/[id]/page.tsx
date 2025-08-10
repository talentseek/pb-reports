import prisma from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import ReportView from "@/components/report/ReportView";
import Link from "next/link";

export default async function ReportViewPage({ params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) {
    notFound();
  }

  const report = await prisma.report.findFirst({
    where: { id: params.id, user: { clerkId: user!.id } },
    include: { businesses: true },
  });
  if (!report) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
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
        <Link href={`/reports/${report.id}/settings`} className="text-sm underline">Manage</Link>
      </div>
      <ReportView report={report} />
    </main>
  );
}


