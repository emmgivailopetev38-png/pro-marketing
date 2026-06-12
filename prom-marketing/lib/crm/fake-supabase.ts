/**
 * Minimal in-memory stand-in for the supabase-js query builder — just enough
 * of the surface that lib/crm/repository.ts uses, so idempotency and matching
 * can be tested without a database. NOT a general Supabase mock.
 *
 * Supported chains:
 *   from(t).select(cols).eq(c,v)[.eq()...][.contains(c,obj)].maybeSingle()/.single()
 *   from(t).insert(row).select(cols).single()      (also bare: await insert(row))
 *   from(t).update(patch).eq(c,v)                  (awaited)
 *   from(t).delete().eq(c,v)                       (awaited)
 */

type Row = Record<string, unknown>;

let idCounter = 0;
function genId(): string {
  idCounter += 1;
  return `id_${idCounter}`;
}

class Query implements PromiseLike<{ data: unknown; error: unknown }> {
  private filters: Array<(r: Row) => boolean> = [];
  private mode: "select" | "update" | "insert" | "delete" | "none" = "none";
  private patch?: Row;
  private inserted?: Row;

  constructor(
    private store: Record<string, Row[]>,
    private table: string
  ) {}

  private rows(): Row[] {
    if (!this.store[this.table]) this.store[this.table] = [];
    return this.store[this.table];
  }

  private matched(): Row[] {
    return this.rows().filter((r) => this.filters.every((f) => f(r)));
  }

  select(): this {
    if (this.mode === "none") this.mode = "select";
    return this;
  }

  eq(col: string, val: unknown): this {
    this.filters.push((r) => r[col] === val);
    return this;
  }

  in(col: string, vals: unknown[]): this {
    this.filters.push((r) => vals.includes(r[col]));
    return this;
  }

  is(col: string, val: unknown): this {
    this.filters.push((r) =>
      val === null ? r[col] === null || r[col] === undefined : r[col] === val
    );
    return this;
  }

  contains(col: string, obj: Row): this {
    this.filters.push((r) => {
      const v = r[col];
      if (!v || typeof v !== "object") return false;
      return Object.entries(obj).every(([k, val]) => (v as Row)[k] === val);
    });
    return this;
  }

  order(): this {
    return this;
  }
  limit(): this {
    return this;
  }

  insert(row: Row): this {
    const r: Row = { id: row.id ?? genId(), ...row };
    this.rows().push(r);
    this.inserted = r;
    this.mode = "insert";
    return this;
  }

  update(patch: Row): this {
    this.mode = "update";
    this.patch = patch;
    return this;
  }

  delete(): this {
    this.mode = "delete";
    return this;
  }

  async maybeSingle(): Promise<{ data: Row | null; error: null }> {
    if (this.mode === "insert") return { data: this.inserted ?? null, error: null };
    return { data: this.matched()[0] ?? null, error: null };
  }

  async single(): Promise<{ data: Row | null; error: { code: string; message: string } | null }> {
    if (this.mode === "insert") return { data: this.inserted ?? null, error: null };
    const m = this.matched()[0] ?? null;
    return { data: m, error: m ? null : { code: "PGRST116", message: "no rows" } };
  }

  then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    let result: { data: unknown; error: unknown };
    if (this.mode === "update") {
      for (const r of this.matched()) Object.assign(r, this.patch);
      result = { data: null, error: null };
    } else if (this.mode === "delete") {
      const keep = this.rows().filter((r) => !this.filters.every((f) => f(r)));
      this.store[this.table] = keep;
      result = { data: null, error: null };
    } else if (this.mode === "insert") {
      result = { data: this.inserted, error: null };
    } else {
      result = { data: this.matched(), error: null };
    }
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }
}

export interface FakeSupabase {
  store: Record<string, Row[]>;
  from(table: string): Query;
}

export function createFakeSupabase(seed?: Record<string, Row[]>): FakeSupabase {
  const store: Record<string, Row[]> = {};
  if (seed) {
    for (const [k, v] of Object.entries(seed)) store[k] = v.map((x) => ({ ...x }));
  }
  return {
    store,
    from(table: string) {
      return new Query(store, table);
    },
  };
}

/** Reset the shared id counter so test ids are deterministic per file. */
export function resetFakeIds(): void {
  idCounter = 0;
}
