import prisma from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import ReportView from "@/components/report/ReportView";

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
      <ReportView report={report} />
    </main>
  );
}


