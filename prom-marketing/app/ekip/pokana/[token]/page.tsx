import type { Metadata } from "next";
import Link from "next/link";
import { getInviteByToken } from "@/lib/team/invites";
import { INVITE_ROLE_HINT } from "@/lib/team/invite-rules";
import { TEAM_ROLE_SHORT } from "@/lib/team/types";
import { InviteForm } from "@/components/ekip/InviteForm";
import { AuroraBackground } from "@/components/effects/AuroraBackground";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Покана за екипа · ProMarketing", robots: { index: false, follow: false } };

/**
 * Поканата: човекът отваря личния си линк и сам въвежда името, имейла и паролата си.
 * Страницата е отворена (няма вход), но без валиден линк не показва нищо за екипа.
 */
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getInviteByToken(token);
  const open = invite?.state === "open";
  return (
    <main className="relative grid min-h-screen place-items-center px-5 py-10">
      <AuroraBackground intensity="subtle" />
      <div className="glass relative z-10 w-full max-w-md rounded-2xl p-7">
        {open && invite ? (
          <>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">ProMarketing · покана за екипа</p>
            <h1 className="mt-2 font-display text-2xl font-bold">
              {invite.full_name ? `${invite.full_name.split(" ")[0]}, ето твоя вход за екипа` : "Твоят вход за екипа"}
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Влизаш като <b className="text-[var(--color-text-primary)]">{invite.title ?? TEAM_ROLE_SHORT[invite.role]}</b>.{" "}
              {INVITE_ROLE_HINT[invite.role] ?? ""}
            </p>
            <InviteForm token={token} name={invite.full_name ?? ""} askMeet={invite.role === "sales"} />
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold">Поканата не важи</h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              {invite?.state === "used"
                ? "Вече е приета. Влез с имейла и паролата, които си избра."
                : "Линкът е изтекъл или е отменен. Поискай нов от Ивайло."}
            </p>
            <Link
              href="/ekip/login"
              className="mt-5 inline-flex rounded-full px-5 py-2.5 text-sm font-bold"
              style={{ background: "var(--color-accent-cyan)", color: "var(--color-bg-void)" }}
            >
              Към входа
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
