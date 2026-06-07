import { listSocialAccounts, listSocialPosts, hasPostformeKey } from "@/lib/social/postforme";
import { SocialComposer } from "@/components/admin/SocialComposer";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  published: "text-emerald-300",
  scheduled: "text-cyan-300",
  draft: "text-slate-300",
  processing: "text-amber-300",
  error: "text-red-300",
  failed: "text-red-300",
};

export default async function SocialPage() {
  const connected = hasPostformeKey();
  const [accounts, posts] = connected
    ? await Promise.all([listSocialAccounts(), listSocialPosts(15)])
    : [[], []];

  return (
    <div className="space-y-6 p-5 md:p-10">
      <header className="cc-panel cc-panel-accent overflow-hidden p-6">
        <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Канали</p>
        <h1 className="cc-title mt-2 font-display text-3xl font-bold md:text-4xl">Социални мрежи</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Композирай веднъж, публикувай в няколко канала наведнъж — през Post for Me.
        </p>
      </header>

      {!connected ? (
        <div className="cc-panel p-6 text-sm text-[var(--color-text-secondary)]">
          Post for Me не е свързан — липсва API ключ.
        </div>
      ) : accounts.length === 0 ? (
        <div className="cc-panel p-6 text-sm text-[var(--color-text-secondary)]">
          Няма свързани акаунти (или ключът е невалиден). Свържи канали в таблото на Post for Me.
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="cc-kpi p-4">
              <p className="hud">Свързани канала</p>
              <p className="mt-2 font-mono text-2xl font-bold text-[var(--color-accent-cyan)]">{accounts.length}</p>
            </div>
            <div className="cc-kpi p-4">
              <p className="hud">Постове (последни)</p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#a78bfa]">{posts.length}</p>
            </div>
            <div className="cc-kpi p-4">
              <p className="hud">Публикувани</p>
              <p className="mt-2 font-mono text-2xl font-bold text-emerald-300">
                {posts.filter((p) => p.status === "published").length}
              </p>
            </div>
            <div className="cc-kpi p-4">
              <p className="hud">Насрочени</p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#facc15]">
                {posts.filter((p) => p.status === "scheduled").length}
              </p>
            </div>
          </section>

          <SocialComposer accounts={accounts} />

          <section className="cc-panel p-5">
            <h3 className="mb-4 font-display text-base font-semibold">Последни постове</h3>
            {posts.length === 0 ? (
              <p className="text-sm text-[var(--color-text-tertiary)]">Още няма постове. Композирай първия горе.</p>
            ) : (
              <div className="space-y-2">
                {posts.map((p) => (
                  <div key={p.id} className="flex items-start gap-3 rounded-lg border border-[var(--color-border-default)] bg-black/20 p-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-[var(--color-text-primary)]">{p.caption || "(без текст)"}</span>
                      <span className="block text-[11px] text-[var(--color-text-tertiary)]">
                        {p.social_accounts.length} канал(а)
                        {p.created_at ? ` · ${new Date(p.created_at).toLocaleString("bg-BG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}
                      </span>
                    </span>
                    {p.status && (
                      <span className={`font-mono text-[10px] uppercase tracking-wider ${STATUS_TONE[p.status] ?? "text-[var(--color-text-tertiary)]"}`}>
                        {p.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
