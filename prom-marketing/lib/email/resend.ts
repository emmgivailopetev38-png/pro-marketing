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

export interface SendAttachment {
  /** Filename to display in the email client. */
  filename: string;
  /** Base64-encoded file contents. */
  content: string;
  /** MIME type. Defaults to application/octet-stream. */
  contentType?: string;
}

export interface SendArgs {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  /** Where replies land. Defaults to EMAIL_REPLY_TO env or the From address. */
  replyTo?: string;
  attachments?: SendAttachment[];
}

export async function sendEmail(args: SendArgs): Promise<{ id: string | null; error: string | null }> {
  // Use || (not ??) so an empty-string env var also falls back to a valid sender.
  const from = process.env.EMAIL_FROM || "ProMarketing <onboarding@resend.dev>";
  const replyTo = args.replyTo || process.env.EMAIL_REPLY_TO || undefined;
  try {
    const client = getClient();
    const { data, error } = await client.emails.send({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      ...(replyTo ? { replyTo } : {}),
      ...(args.attachments && args.attachments.length > 0
        ? {
            attachments: args.attachments.map((a) => ({
              filename: a.filename,
              content: a.content,
              contentType: a.contentType,
            })),
          }
        : {}),
    });
    if (error) {
      return { id: null, error: error.message ?? String(error) };
    }
    return { id: data?.id ?? null, error: null };
  } catch (e) {
    return { id: null, error: e instanceof Error ? e.message : String(e) };
  }
}
