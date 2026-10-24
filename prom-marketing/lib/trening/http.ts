import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin/session";
import { TrainingError } from "./repository";

export async function trainingAdminAuthorized() {
  const cookieStore = await cookies();
  return verifySession(cookieStore.get(ADMIN_COOKIE)?.value ?? null);
}

export function trainingRouteError(error: unknown) {
  if (error instanceof TrainingError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("[trening/api]", error);
  return NextResponse.json({ error: "Не успяхме да запазим тренировката. Опитайте отново." }, { status: 503 });
}
