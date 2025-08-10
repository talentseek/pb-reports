import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your Reports</h1>
        <Link
          href="/reports/new"
          className="rounded bg-black text-white px-4 py-2 hover:opacity-90"
        >
          Create New Report
        </Link>
      </header>
      <p className="text-sm text-gray-600">Report list coming soon.</p>
    </main>
  );
}


