import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-gray-600 text-sm">Per-report settings will be editable from each report in a later step.</p>
    </main>
  )
}


