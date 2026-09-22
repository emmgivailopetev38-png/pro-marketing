import "server-only";
import { randomBytes } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { contactMessages, postMessage } from "@/lib/team/messages";
import type { MessageLite } from "@/lib/team/messages-rules";
import { createTask } from "@/lib/team/tasks";
import { nextWorkingDayAt } from "@/lib/contacts/followup";
import { cleanClientText, isValidToken, type PortalProject, type PortalTask } from "./rules";

/**
 * Порталът на клиента — данните и действията. Правилата са в rules.ts.
 * Достъпът е само токенът в адреса: дълъг, случаен, без вход. Страницата е
 * noindex. Всичко, което клиентът прави, влиза в CRM-а с неговото име.
 */

export interface PortalData {
  contact: { id: string; full_name: string | null; company: string | null; email: string | null; phone: string | null; owner_id: string | null };
  projects: PortalProject[];
  /** обновления от нас, отбелязани като видими */
  updates: Array<{ id: string; title: string; body: string | null; at: string; by: string | null }>;
  messages: MessageLite[];
  next_meeting: { at: string; url: string | null } | null;
  open_invoices: Array<{ number: string | null; amount: number; due: string | null; status: string }>;
  /** кой е човекът за връзка от наша страна */
  contact_person: { name: string; phone: string | null; email: string | null };
}

export async function ensurePortalToken(contactId: string): Promise<{ token: string | null; error: string | null }> {
  const sb = createServiceClient();
  const { data: c } = await sb.from("contacts").select("id, portal_token").eq("id", contactId).maybeSingle();
  if (!c) return { token: null, error: "Картонът не е намерен" };
  if (c.portal_token) {
    await sb.from("contacts").update({ portal_enabled: true }).eq("id", contactId);
    return { token: c.portal_token as string, error: null };
  }
  const token = randomBytes(16).toString("hex");
  const { error } = await sb.from("contacts").update({ portal_token: token, portal_enabled: true }).eq("id", contactId);
  return { token: error ? null : token, error: error?.message ?? null };
}

export async function setPortalEnabled(contactId: string, enabled: boolean): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { error } = await sb.from("contacts").update({ portal_enabled: enabled }).eq("id", contactId);
  return { error: error?.message ?? null };
}

export async function loadPortal(token: string): Promise<PortalData | null> {
  if (!isValidToken(token)) return null;
  const sb = createServiceClient();
  const { data: c } = await sb
    .from("contacts")
    .select("id, full_name, company, email, phone, owner_id, portal_enabled")
    .eq("portal_token", token)
    .maybeSingle();
  if (!c || !c.portal_enabled) return null;
  const contact = c as PortalData["contact"] & { portal_enabled: boolean };

  const [{ data: projects }, { data: tasks }, { data: updates }, messages, { data: bookings }, { data: invoices }, { data: payments }, owner] = await Promise.all([
    sb.from("projects").select("id, title, status, service_type, portal_summary, due_date, started_at").eq("contact_id", contact.id).neq("status", "cancelled").order("created_at", { ascending: false }),
    sb.from("project_tasks").select("id, project_id, contact_id, title, status, due_date, client_visible, client_done_at, kind, sort_order").eq("contact_id", contact.id).order("sort_order"),
    sb
      .from("contact_activities")
      .select("id, title, body, occurred_at, created_by, metadata")
      .eq("contact_id", contact.id)
      .in("activity_type", ["project_update", "task_done", "client_update"])
      .order("occurred_at", { ascending: false })
      .limit(60),
    contactMessages(contact.id, { clientOnly: true }),
    sb
      .from("bookings")
      .select("scheduled_at, meeting_url, status, attendee_email, attendee_phone")
      .gte("scheduled_at", new Date().toISOString())
      .not("status", "in", "(cancelled,rejected)")
      .order("scheduled_at", { ascending: true })
      .limit(50),
    sb.from("invoices").select("invoice_number, amount_gross, due_date, status, invoice_type").eq("contact_id", contact.id).in("status", ["sent", "partially_paid", "overdue"]).limit(20),
    sb.from("payments").select("invoice_id, amount").eq("contact_id", contact.id),
    contact.owner_id ? sb.from("team_members").select("full_name, phone, email").eq("id", contact.owner_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  // Задачите по проектите — второ четене, защото PostgREST няма подзаявки.
  const projectRows = (projects ?? []) as Array<{ id: string; title: string; status: string; service_type: string | null; portal_summary: string | null; due_date: string | null; started_at: string | null }>;
  const projectIds = projectRows.map((p) => p.id);
  const { data: tasks2 } = projectIds.length
    ? await sb.from("project_tasks").select("id, project_id, contact_id, title, status, due_date, client_visible, client_done_at, kind, sort_order").in("project_id", projectIds).order("sort_order")
    : { data: [] };
  const allTasks = new Map<string, PortalTask>();
  for (const t of [...((tasks ?? []) as PortalTask[]), ...((tasks2 ?? []) as PortalTask[])]) allTasks.set(t.id, t);
  const taskList = [...allTasks.values()].filter((t) => t.client_visible || t.kind === "client_request");

  const visibleUpdates = ((updates ?? []) as Array<{ id: string; title: string; body: string | null; occurred_at: string; created_by: string | null; metadata: Record<string, unknown> | null }>)
    .filter((u) => u.metadata?.client_visible === true)
    .map((u) => ({ id: u.id, title: u.title, body: u.body, at: u.occurred_at, by: u.created_by }));

  const emailLc = contact.email?.toLowerCase() ?? null;
  const phone9 = contact.phone?.replace(/\D/g, "").slice(-9) ?? null;
  const meeting = ((bookings ?? []) as Array<{ scheduled_at: string; meeting_url: string | null; attendee_email: string | null; attendee_phone: string | null }>).find(
    (b) => (emailLc && b.attendee_email?.toLowerCase() === emailLc) || (phone9 && b.attendee_phone?.replace(/\D/g, "").slice(-9) === phone9)
  );

  const paidBy = new Map<string, number>();
  for (const p of (payments ?? []) as Array<{ invoice_id: string | null; amount: number }>) {
    if (p.invoice_id) paidBy.set(p.invoice_id, (paidBy.get(p.invoice_id) ?? 0) + Number(p.amount));
  }
  const openInvoices = ((invoices ?? []) as Array<{ invoice_number: string | null; amount_gross: number; due_date: string | null; status: string; invoice_type: string }>)
    .filter((i) => i.invoice_type !== "credit_note")
    .map((i) => ({ number: i.invoice_number, amount: Number(i.amount_gross), due: i.due_date, status: i.status }));

  const ownerRow = (owner as { data: { full_name: string; phone: string | null; email: string | null } | null } | null)?.data ?? null;
  const contactPerson = ownerRow
    ? { name: ownerRow.full_name, phone: ownerRow.phone, email: ownerRow.email }
    : { name: "Ивайло Петев", phone: "+359 877 399 963", email: "ivailo@promarketing.pw" };

  return {
    contact: { id: contact.id, full_name: contact.full_name, company: contact.company, email: contact.email, phone: contact.phone, owner_id: contact.owner_id },
    projects: projectRows.map((p) => ({ ...p, tasks: taskList.filter((t) => t.project_id === p.id) })),
    updates: visibleUpdates,
    messages,
    next_meeting: meeting ? { at: meeting.scheduled_at, url: meeting.meeting_url } : null,
    open_invoices: openInvoices,
    contact_person: contactPerson,
  };
}

export async function touchPortal(contactId: string): Promise<void> {
  const sb = createServiceClient();
  const { data } = await sb.from("contacts").select("portal_views").eq("id", contactId).maybeSingle();
  await sb
    .from("contacts")
    .update({ portal_last_seen_at: new Date().toISOString(), portal_views: (Number(data?.portal_views) || 0) + 1 })
    .eq("id", contactId)
    .then(() => null, () => null);
}

function clientName(c: { full_name: string | null; company: string | null }): string {
  return c.full_name?.trim() || c.company?.trim() || "Клиент";
}

/** Клиентът пише — влиза в нишката на картона като „от клиента“. */
export async function portalMessage(data: PortalData, text: string): Promise<{ ok: boolean; error: string | null }> {
  const body = cleanClientText(text);
  if (!body) return { ok: false, error: "Празно съобщение" };
  const res = await postMessage({
    key: `contact:${data.contact.id}`,
    authorKey: `client:${data.contact.id}`,
    authorName: clientName(data.contact),
    body,
    clientVisible: true,
    fromClient: true,
  });
  return { ok: !res.error, error: res.error };
}

/** Клиентът отмята стъпка от своя страна. */
export async function portalApprove(data: PortalData, taskId: string, comment: string): Promise<{ ok: boolean; error: string | null; title: string | null }> {
  const sb = createServiceClient();
  const task = data.projects.flatMap((p) => p.tasks).find((t) => t.id === taskId && t.client_visible);
  if (!task) return { ok: false, error: "Стъпката не е намерена", title: null };
  const now = new Date().toISOString();
  const { error } = await sb.from("project_tasks").update({ client_done_at: now, updated_at: now }).eq("id", taskId);
  if (error) return { ok: false, error: error.message, title: null };
  const note = cleanClientText(comment, 1000);
  await sb
    .from("contact_activities")
    .insert({
      contact_id: data.contact.id,
      activity_type: "client_approved",
      title: `✅ Клиентът отметна: ${task.title}`,
      body: note || null,
      occurred_at: now,
      metadata: { task_id: taskId, project_id: task.project_id, from_client: true, client_visible: true },
      created_by: clientName(data.contact),
    })
    .then(() => null, () => null);
  return { ok: true, error: null, title: task.title };
}

/** Клиентът иска нещо — става задача-заявка към отговорника. */
export async function portalRequest(data: PortalData, text: string): Promise<{ ok: boolean; error: string | null }> {
  const title = cleanClientText(text, 300);
  if (!title) return { ok: false, error: "Напишете какво Ви трябва" };
  const sb = createServiceClient();
  const firstProject = data.projects.find((p) => p.status !== "done");
  let assignee: string | null = data.contact.owner_id;
  if (firstProject) {
    const { data: p } = await sb.from("projects").select("owner_id").eq("id", firstProject.id).maybeSingle();
    assignee = (p?.owner_id as string | null) ?? assignee;
  }
  const res = await createTask({
    title: `Заявка от клиента: ${title}`,
    description: cleanClientText(text),
    project_id: firstProject?.id ?? null,
    contact_id: firstProject ? null : data.contact.id,
    assignee_id: assignee,
    priority: "high",
    kind: "client_request",
    client_visible: true,
    due_date: nextWorkingDayAt(new Date(), 10).toISOString().slice(0, 10),
    created_by: clientName(data.contact),
  });
  if (res.error) return { ok: false, error: res.error };
  await sb
    .from("contact_activities")
    .insert({
      contact_id: data.contact.id,
      activity_type: "client_request",
      title: `📩 Клиентът поиска: ${title.slice(0, 80)}`,
      body: cleanClientText(text),
      occurred_at: new Date().toISOString(),
      metadata: { task_id: res.id, from_client: true, client_visible: true },
      created_by: clientName(data.contact),
    })
    .then(() => null, () => null);
  return { ok: true, error: null };
}

/** Клиентът иска разговор — Ивайло/отговорникът го получава в списъка си за утре 10:00. */
export async function portalCall(data: PortalData, text: string): Promise<{ ok: boolean; error: string | null; whenIso: string }> {
  const sb = createServiceClient();
  const whenIso = nextWorkingDayAt(new Date(), 10).toISOString();
  const { error } = await sb
    .from("contacts")
    .update({ followup_status: "needs_call", next_followup_at: whenIso })
    .eq("id", data.contact.id);
  if (error) return { ok: false, error: error.message, whenIso };
  await sb
    .from("contact_activities")
    .insert({
      contact_id: data.contact.id,
      activity_type: "call_requested",
      title: "📞 Клиентът иска да се чуем",
      body: cleanClientText(text, 1000) || null,
      occurred_at: new Date().toISOString(),
      metadata: { from_client: true, retry_at: whenIso },
      created_by: clientName(data.contact),
    })
    .then(() => null, () => null);
  return { ok: true, error: null, whenIso };
}
