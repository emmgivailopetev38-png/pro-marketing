import "server-only";
import { Resend } from "resend";

let cached: Resend | null = null;

function getClient(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not configured");
  cached = new Resend(key);
  return cached;
}

export interface SendArgs {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(args: SendArgs): Promise<{ id: string | null; error: string | null }> {
  const from = process.env.EMAIL_FROM ?? "ProMarketing <onboarding@resend.dev>";
  try {
    const client = getClient();
    const { data, error } = await client.emails.send({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    if (error) {
      return { id: null, error: error.message ?? String(error) };
    }
    return { id: data?.id ?? null, error: null };
  } catch (e) {
    return { id: null, error: e instanceof Error ? e.message : String(e) };
  }
}
