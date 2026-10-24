import "./admin.css";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminViewer } from "@/lib/admin/demo-access";
import { getTeamActor } from "@/lib/team/session";

/**
 * Собственикът вижда всичко. Човек от екипа с модул „Демо“ вижда само
 * JARVIS, Палубата и Гласовото демо (с измислени данни) — пътищата ги пази
 * middleware-ът, тук се проверява само дали изобщо има право.
 */
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getAdminViewer();
  if (!viewer) {
    // Влязъл човек от екипа без модул „Демо“ → в неговата зона; непознат → вход.
    redirect((await getTeamActor()) ? "/ekip" : "/admin/login");
  }

  return (
    <AdminShell email={viewer.name} demo={viewer.kind === "demo"}>
      {children}
    </AdminShell>
  );
}
