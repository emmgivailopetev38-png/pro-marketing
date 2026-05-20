import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        aria-hidden
        className="h-7 w-7 rounded-md"
        style={{
          background:
            "conic-gradient(from 200deg, #06b6d4, #7c3aed, #ec4899, #06b6d4)",
          boxShadow: "0 0 18px rgba(6,182,212,0.35)",
        }}
      />
      <span className="font-display text-lg font-bold tracking-tight">
        Pro<span className="text-holographic">Marketing</span>
      </span>
    </div>
  );
}
