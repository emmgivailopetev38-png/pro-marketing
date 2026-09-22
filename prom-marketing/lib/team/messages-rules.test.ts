import { describe, expect, it } from "vitest";
import {
  directKey,
  parseMentions,
  parseThreadKey,
  recipientsOf,
  summarizeThreads,
  threadKeyFor,
  unreadCount,
  type MessageLite,
} from "./messages-rules";

const IVAN = "11111111-1111-1111-1111-111111111111";
const DIMITAR = "22222222-2222-2222-2222-222222222222";

function msg(p: Partial<MessageLite> & { id: string; thread_key: string; author_key: string; created_at: string }): MessageLite {
  return {
    thread_kind: parseThreadKey(p.thread_key).kind,
    thread_ref: parseThreadKey(p.thread_key).ref,
    author_name: p.author_key,
    body: "…",
    mentions: [],
    client_visible: false,
    from_client: false,
    ...p,
  };
}

describe("messages-rules", () => {
  it("личната нишка е една и съща, който и да пише пръв", () => {
    expect(directKey("owner", IVAN)).toBe(directKey(IVAN, "owner"));
    expect(threadKeyFor("direct", null, ["owner", IVAN])).toBe(`direct:${IVAN}|owner`);
    expect(threadKeyFor("contact", "abc")).toBe("contact:abc");
    expect(parseThreadKey("project:p1")).toEqual({ kind: "project", ref: "p1", participants: [] });
  });

  it("получателите: личната → другият; общата → всички без автора; споменатите винаги", () => {
    expect(recipientsOf({ thread_key: directKey("owner", IVAN), author_key: "owner", mentions: [] }, [])).toEqual([IVAN]);
    expect(recipientsOf({ thread_key: "general", author_key: IVAN, mentions: [] }, ["owner", IVAN, DIMITAR]).sort()).toEqual(
      ["owner", DIMITAR].sort()
    );
    expect(recipientsOf({ thread_key: "contact:c1", author_key: "owner", mentions: [DIMITAR] }, ["owner", IVAN, DIMITAR])).toEqual([
      DIMITAR,
    ]);
  });

  it("споменаванията хващат slug, първо име и пълно име, без значение на буквите", () => {
    const people = [
      { key: "owner", slug: "ivailo", name: "Ивайло" },
      { key: IVAN, slug: "ivan-tashev", name: "Ivan Tashev" },
      { key: DIMITAR, slug: "dimitar", name: "Димитър" },
    ];
    expect(parseMentions("@Ивайло виж @ivan-tashev и @димитър", people).sort()).toEqual(["owner", IVAN, DIMITAR].sort());
    expect(parseMentions("@Ivan какво стана", people)).toEqual([IVAN]);
    expect(parseMentions("без споменаване", people)).toEqual([]);
  });

  it("непрочетено = от друг, след последното ми четене", () => {
    const list = [
      msg({ id: "1", thread_key: "general", author_key: "owner", created_at: "2026-09-22T08:00:00Z" }),
      msg({ id: "2", thread_key: "general", author_key: IVAN, created_at: "2026-09-22T09:00:00Z" }),
      msg({ id: "3", thread_key: "general", author_key: DIMITAR, created_at: "2026-09-22T10:00:00Z" }),
    ];
    expect(unreadCount(list, IVAN, new Map())).toBe(2);
    expect(unreadCount(list, IVAN, new Map([["general", "2026-09-22T09:30:00Z"]]))).toBe(1);
    expect(unreadCount(list, "owner", new Map([["general", "2026-09-22T11:00:00Z"]]))).toBe(0);
  });

  it("списъкът с нишки крие чуждите лични и подрежда по последно съобщение", () => {
    const list = [
      msg({ id: "1", thread_key: directKey("owner", IVAN), author_key: "owner", created_at: "2026-09-22T08:00:00Z" }),
      msg({ id: "2", thread_key: directKey("owner", DIMITAR), author_key: "owner", created_at: "2026-09-22T09:00:00Z" }),
      msg({ id: "3", thread_key: "contact:c1", author_key: IVAN, created_at: "2026-09-22T10:00:00Z" }),
    ];
    const threads = summarizeThreads(list, IVAN, new Map(), (k) => k);
    expect(threads.map((t) => t.key)).toEqual(["contact:c1", directKey("owner", IVAN)]);
    expect(threads[1].unread).toBe(1);
  });
});
