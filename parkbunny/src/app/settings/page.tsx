import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import EmailConnectionCard from "@/components/support/EmailConnectionCard";

export default async function SettingsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform-wide configuration for ParkBunny staff.
        </p>
      </div>

      {/* Email Support Integration */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Email Support Integration</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Connect the Park Bunny support mailbox to enable AI-powered email triage and auto-replies.
            The AI uses the same FAQ knowledge base as the voice agent to answer customer queries automatically.
          </p>
        </div>
        <EmailConnectionCard />
        <div className="rounded-lg border border-dashed px-4 py-3 text-xs text-muted-foreground space-y-1">
          <p><span className="font-medium">Auto-reply:</span> Emails the AI can resolve are replied to automatically from support@parkbunny.app.</p>
          <p><span className="font-medium">Needs review:</span> Complex queries, complaints, and PCN appeals are flagged in the Support dashboard for manual handling.</p>
          <p><span className="font-medium">All emails:</span> Every interaction is logged with category, sentiment, and a resolution status — visible in the Support analytics dashboard.</p>
        </div>
      </section>

      <hr />

      {/* Placeholder for future settings sections */}
      <section className="space-y-3 opacity-40 pointer-events-none select-none">
        <div>
          <h2 className="text-base font-semibold">Voice Agent Settings</h2>
          <p className="text-sm text-muted-foreground">
            Voice agent configuration is managed per-report. Use the report Settings page.
          </p>
        </div>
      </section>
    </main>
  );
}
