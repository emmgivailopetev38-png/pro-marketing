import { MATERIALS } from "@/lib/team/materials";
import { MaterialsList } from "@/components/ekip/MaterialsList";
import { TEAM_ROLE_SHORT } from "@/lib/team/types";

export const dynamic = "force-dynamic";

/** Всички обучителни материали — за Ивайло, с бележка за кого е всеки. */
export default function AdminMaterialiPage() {
  return (
    <div className="min-h-screen">
      <div className="cc-content space-y-6 p-5 md:p-10">
        <header className="cc-panel cc-panel-accent overflow-hidden p-6">
          <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Екип</p>
          <h1 className="cc-title mt-2 font-display text-4xl font-bold">Материали · обучение</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Всеки от екипа вижда своите в /ekip/materiali. Файловете са в <span className="font-mono">public/materiali/</span> — PDF за
            телефона и HTML за екрана. Нова версия = нов файл със същото име.
          </p>
        </header>
        <MaterialsList
          title="📚 Всички материали"
          items={MATERIALS.map((m) => ({ ...m, about: `${m.about} · за: ${m.roles.map((r) => TEAM_ROLE_SHORT[r]).join(", ")}` }))}
        />
      </div>
    </div>
  );
}
