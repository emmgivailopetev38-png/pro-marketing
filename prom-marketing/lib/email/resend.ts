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

// ── Релей за чужда система (ccgroup-crm на Иво няма свой Resend ключ) ───────
export interface RelayArgs {
  /** пълният подател „Име <адрес>“ — адресът трябва да е на потвърдения ни домейн */
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
  /** Idempotency-Key към Resend — повторен опит със същия ключ не праща второ писмо */
  idempotencyKey?: string;
}

export interface RelayResult {
  id: string | null;
  error: string | null;
  /** HTTP статусът от Resend при грешка (429 = лимит, 5xx = техен проблем) */
  statusCode: number | null;
}

/**
 * Праща писмо от името на друга система през НАШИЯ Resend акаунт, без да
 * сменя подателя по подразбиране на sendEmail. Грешката носи и статуса, за да
 * може викащият да реши дали да опита пак.
 */
export async function sendRelayEmail(args: RelayArgs): Promise<RelayResult> {
  try {
    const client = getClient();
    const { data, error } = await client.emails.send(
      {
        from: args.from,
        to: args.to,
        subject: args.subject,
        html: args.html,
        ...(args.text ? { text: args.text } : {}),
        ...(args.replyTo ? { replyTo: args.replyTo } : {}),
        ...(args.headers && Object.keys(args.headers).length > 0 ? { headers: args.headers } : {}),
        ...(args.tags && args.tags.length > 0 ? { tags: args.tags } : {}),
      },
      args.idempotencyKey ? { idempotencyKey: args.idempotencyKey } : undefined
    );
    if (error) {
      return { id: null, error: `${error.name}: ${error.message}`, statusCode: error.statusCode ?? null };
    }
    return { id: data?.id ?? null, error: null, statusCode: null };
  } catch (e) {
    return { id: null, error: e instanceof Error ? e.message : String(e), statusCode: null };
  }
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
