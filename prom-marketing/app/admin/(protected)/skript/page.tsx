import type { Metadata } from "next";
import { SkriptTrainer } from "@/components/admin/skript/SkriptTrainer";

export const metadata: Metadata = {
  title: "Разговорът · тренажор",
};

export default function SkriptPage() {
  return <SkriptTrainer />;
}
