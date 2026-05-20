import { LoginForm } from "@/components/admin/LoginForm";
import { Toaster } from "@/components/ui/sonner";
import { AuroraBackground } from "@/components/effects/AuroraBackground";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="relative grid min-h-screen place-items-center px-6">
      <AuroraBackground intensity="subtle" />
      <div className="relative z-10 glass rounded-2xl p-10">
        <LoginForm initialError={params.error} />
      </div>
      <Toaster theme="dark" position="top-right" />
    </main>
  );
}
