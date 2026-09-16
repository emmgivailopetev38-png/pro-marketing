import { EkipLoginForm } from "@/components/ekip/EkipLoginForm";
import { AuroraBackground } from "@/components/effects/AuroraBackground";

export default async function EkipLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next && params.next.startsWith("/ekip") ? params.next : "/ekip";
  return (
    <main className="relative grid min-h-screen place-items-center px-6">
      <AuroraBackground intensity="subtle" />
      <div className="glass relative z-10 w-full max-w-sm rounded-2xl p-8">
        <EkipLoginForm next={next} />
      </div>
    </main>
  );
}
