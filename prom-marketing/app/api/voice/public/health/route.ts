import { NextResponse } from "next/server";
import { checkAgentCredits } from "@/lib/voice/credits";

const DEFAULT_AGENT_ID = "agent_4401m0fym8eqfeebgfqx4jnwqreg";

/**
 * Жив ли е гласовият агент — за проверките (задачите, Ивайло), без да се
 * отваря разговор и без лийд в CRM-а. Връща само състояние, нищо тайно.
 * `unknown` = ключът няма право или ElevenLabs не отговори.
 */
export async function GET() {
  const agentId = process.env.ELEVENLABS_PUBLIC_AGENT_ID ?? DEFAULT_AGENT_ID;
  const { state } = await checkAgentCredits(agentId);
  return NextResponse.json({ credits: state }, { headers: { "Cache-Control": "no-store" } });
}
