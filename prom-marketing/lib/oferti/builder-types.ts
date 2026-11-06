/** Общото между билдъра на оферти (клиент) и сървърните действия в админа и /ekip. */
export type BuilderState = {
  ok: boolean;
  error?: string;
  id?: string;
  url?: string;
  pdf_url?: string;
  number?: string;
  title?: string;
  summary?: string;
  sent?: { to: string };
  template_key?: string;
} | null;

export type BuilderAction = (prev: BuilderState, formData: FormData) => Promise<BuilderState>;

export type ContactLite = { id: string; full_name: string | null; email: string | null; company: string | null };
