import type { Metadata } from "next";
import { Tombola } from "@/components/admin/Tombola";
import "./tombola.css";

export const metadata: Metadata = {
  title: "Томбола на живо",
  robots: { index: false, follow: false },
};

/**
 * /admin/tombola — тегленето на тримата печеливши („30 минути лично с
 * Ивайло“) в края на обучението „Допълнителен доход с AI“. Цял екран —
 * за споделяне в Zoom. Логиката за имената и случайното число е в
 * lib/uebinar/tombola.ts.
 */
export default function Page() {
  return <Tombola />;
}
