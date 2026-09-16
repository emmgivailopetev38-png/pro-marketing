import { listMembers } from "@/lib/team/repository";
import { TeamManager } from "@/components/admin/TeamManager";

export const dynamic = "force-dynamic";

export default async function EkipAdminPage() {
  const members = await listMembers();
  return (
    <div className="min-h-screen">
      <div className="cc-content space-y-6 p-5 md:p-10">
        <header className="cc-panel cc-panel-accent overflow-hidden p-6">
          <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Екип</p>
          <h1 className="cc-title mt-2 font-display text-4xl font-bold">Хората с личен вход</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Всеки влиза през <span className="font-mono">/ekip</span> с имейл и своя парола и вижда само опашката за
            звънене. Всичко, което записва, стои в картона с неговото име.
          </p>
        </header>

        <TeamManager members={members} />
      </div>
    </div>
  );
}
