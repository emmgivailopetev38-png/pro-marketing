import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";

// TEMPORARY: auth bypassed at user's request to preview the dashboard. Will be
// re-enabled after the preview pass. While bypassed, anyone with the URL can
// view and edit. Re-enable by uncommenting the redirect block below.
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // const allowed = (process.env.ALLOWED_ADMIN_EMAILS ?? "")
  //   .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  // if (!user?.email || !allowed.includes(user.email.toLowerCase())) {
  //   redirect("/admin/login");
  // }

  return <AdminShell email={user?.email ?? "preview@promarketing.pw"}>{children}</AdminShell>;
}
