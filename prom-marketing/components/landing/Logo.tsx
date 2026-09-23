import { cn } from "@/lib/utils";
import { PmMark } from "./PmMark";

export function Logo({ className, markId = "pm-logo" }: { className?: string; markId?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-1.5 sm:gap-2", className)}>
      <PmMark id={markId} className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
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
