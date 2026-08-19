import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-1.5 sm:gap-2", className)}>
      <div
        aria-hidden
        className="h-6 w-6 shrink-0 rounded-md sm:h-7 sm:w-7"
        style={{
          background:
            "conic-gradient(from 200deg, #06b6d4, #7c3aed, #ec4899, #06b6d4)",
          boxShadow: "0 0 18px rgba(6,182,212,0.35)",
        }}
      />
      {/* Never truncate the brand. At text-lg the wordmark needs ~170px and
          at 375px the navbar simply has not got it, so the pill used to sit on
          top of the logo. The size steps down on small screens and the navbar
          CTA shortens its label to free the width — clipping "ProMarketing"
          to "ProMa…" is not an acceptable answer for a logo. */}
      <span className="font-display whitespace-nowrap text-[15px] font-bold tracking-tight max-[359px]:hidden sm:text-base md:text-lg">
        Pro<span className="text-holographic">Marketing</span>
      </span>
    </div>
  );
}
