import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/admin/login");
  }

  const allowed = (process.env.ALLOWED_ADMIN_EMAILS ?? "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

  if (!allowed.includes(user.email.toLowerCase())) {
    redirect("/admin/login?error=forbidden");
  }

  return <AdminShell email={user.email}>{children}</AdminShell>;
}
