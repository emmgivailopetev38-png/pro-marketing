/**
 * Съобщенията през CRM-а — чистите правила.
 *
 * Нишка = ключ: „general“ (целият екип), „direct:<a>|<b>“ (двама души, ключовете
 * подредени), „contact:<id>“ (по картон — вижда се и от клиента, ако е
 * отметнато), „project:<id>“, „task:<id>“. Участник = „owner“ или id на човек
 * от екипа. Непрочетено = има съобщение от друг след последното ми четене.
 */

export type ThreadKind = "general" | "direct" | "contact" | "project" | "task";

export interface MessageLite {
  id: string;
  thread_key: string;
  thread_kind: ThreadKind;
  thread_ref: string | null;
  author_key: string;
  author_name: string;
  body: string;
  mentions: string[];
  client_visible: boolean;
  from_client: boolean;
  created_at: string;
}

export function directKey(a: string, b: string): string {
  const [x, y] = [a, b].sort();
  return `direct:${x}|${y}`;
}

export function threadKeyFor(kind: ThreadKind, ref: string | null, participants?: [string, string]): string {
  switch (kind) {
    case "general":
      return "general";
    case "direct":
      if (!participants) throw new Error("direct thread needs two participants");
      return directKey(participants[0], participants[1]);
    default:
      if (!ref) throw new Error(`${kind} thread needs a ref`);
      return `${kind}:${ref}`;
  }
}

/** Разбива ключа обратно: „contact:abc“ → {kind, ref}. */
export function parseThreadKey(key: string): { kind: ThreadKind; ref: string | null; participants: string[] } {
  if (key === "general") return { kind: "general", ref: null, participants: [] };
  const i = key.indexOf(":");
  const kind = key.slice(0, i) as ThreadKind;
  const rest = key.slice(i + 1);
  if (kind === "direct") return { kind, ref: null, participants: rest.split("|") };
  return { kind, ref: rest, participants: [] };
}

/** Кои от участниците (освен автора) трябва да научат за съобщението. */
export function recipientsOf(
  msg: Pick<MessageLite, "thread_key" | "author_key" | "mentions">,
  allParticipantKeys: string[]
): string[] {
  const t = parseThreadKey(msg.thread_key);
  const set = new Set<string>();
  if (t.kind === "direct") for (const p of t.participants) set.add(p);
  else if (t.kind === "general") for (const p of allParticipantKeys) set.add(p);
  for (const m of msg.mentions) set.add(m);
  set.delete(msg.author_key);
  return [...set];
}

/**
 * Споменаванията: „@Иван“, „@ivan-tashev“, „@Ивайло“. Съвпада се по slug или по
 * първата дума от името, без значение на главни букви.
 */
export function parseMentions(
  body: string,
  people: Array<{ key: string; slug: string; name: string }>
): string[] {
  const found = new Set<string>();
  const re = /@([\p{L}\p{N}_-]+)/gu;
  for (const m of body.matchAll(re)) {
    const token = m[1].toLowerCase();
    for (const p of people) {
      const first = p.name.trim().split(/\s+/)[0]?.toLowerCase();
      if (token === p.slug.toLowerCase() || token === first || token === p.name.toLowerCase()) found.add(p.key);
    }
  }
  return [...found];
}

/** Непрочетени за участник: съобщения от други след последното му четене. */
export function unreadCount(
  messages: Array<Pick<MessageLite, "thread_key" | "author_key" | "created_at">>,
  participantKey: string,
  lastReadByThread: Map<string, string>
): number {
  let n = 0;
  for (const m of messages) {
    if (m.author_key === participantKey) continue;
    const last = lastReadByThread.get(m.thread_key);
    if (!last || m.created_at > last) n += 1;
  }
  return n;
}

export interface ThreadSummary {
  key: string;
  kind: ThreadKind;
  ref: string | null;
  title: string;
  last: MessageLite | null;
  unread: number;
  total: number;
}

/**
 * Списъкът с нишки за един човек: общата, личните с всеки, и нишките по
 * картон/проект/задача, в които има съобщения. Подредени по последно съобщение.
 */
export function summarizeThreads(
  messages: MessageLite[],
  participantKey: string,
  lastReadByThread: Map<string, string>,
  titleFor: (key: string) => string
): ThreadSummary[] {
  const by = new Map<string, MessageLite[]>();
  for (const m of messages) {
    const list = by.get(m.thread_key) ?? [];
    list.push(m);
    by.set(m.thread_key, list);
  }
  const out: ThreadSummary[] = [];
  for (const [key, list] of by) {
    list.sort((a, b) => a.created_at.localeCompare(b.created_at));
    const t = parseThreadKey(key);
    if (t.kind === "direct" && !t.participants.includes(participantKey)) continue;
    out.push({
      key,
      kind: t.kind,
      ref: t.ref,
      title: titleFor(key),
      last: list[list.length - 1] ?? null,
      unread: unreadCount(list, participantKey, lastReadByThread),
      total: list.length,
    });
  }
  return out.sort((a, b) => (b.last?.created_at ?? "").localeCompare(a.last?.created_at ?? ""));
}

export function isThreadKind(v: unknown): v is ThreadKind {
  return v === "general" || v === "direct" || v === "contact" || v === "project" || v === "task";
}
