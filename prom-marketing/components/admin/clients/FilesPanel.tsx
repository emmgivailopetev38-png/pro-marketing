"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface FileRow {
  id: string;
  filename: string;
  size_bytes: number;
  mime_type: string | null;
  category: string | null;
  description: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

const CATEGORIES = [
  { v: "oferta", label: "💎 Оферта" },
  { v: "dogovor", label: "📜 Договор" },
  { v: "invoice", label: "🧾 Фактура" },
  { v: "image", label: "🖼️ Снимка" },
  { v: "document", label: "📄 Документ" },
  { v: "other", label: "📎 Друго" },
];

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("bg-BG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FilesPanel({ contactId }: { contactId: string }) {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pendingCategory, setPendingCategory] = useState("other");
  const [pendingDescription, setPendingDescription] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/contacts/${contactId}/files`);
      const j = await r.json();
      setFiles(j.files ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // Live updates на файлове — ако друг tab/устройство качи или изтрие.
    const supabase = createClient();
    const ch = supabase
      .channel(`contact-${contactId}-files`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contact_files",
          filter: `contact_id=eq.${contactId}`,
        },
        () => {
          void reload();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  const handleFiles = async (filesIn: FileList | File[]) => {
    const arr = Array.from(filesIn);
    if (arr.length === 0) return;
    setUploading(true);
    try {
      for (const f of arr) {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("category", pendingCategory);
        if (pendingDescription) fd.append("description", pendingDescription);
        const r = await fetch(`/api/admin/contacts/${contactId}/files`, {
          method: "POST",
          body: fd,
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          console.error("Upload failed:", j.error);
        }
      }
      setPendingDescription("");
      await reload();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string, filename: string) => {
    if (!confirm(`Изтрий „${filename}"? Това действие е необратимо.`)) return;
    const r = await fetch(`/api/admin/contacts/${contactId}/files/${fileId}`, {
      method: "DELETE",
    });
    if (r.ok) {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } else {
      alert("Грешка при изтриване.");
    }
  };

  return (
    <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
          📎 Архив на клиента
        </h3>
        <span className="text-xs text-[var(--color-text-tertiary)]">
          {loading ? "…" : `${files.length} файла`}
        </span>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors"
        style={{
          borderColor: dragOver
            ? "var(--color-accent-cyan)"
            : "var(--color-border-default)",
          background: dragOver ? "rgba(0, 212, 255, 0.05)" : "transparent",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files);
          }}
        />
        <p className="text-sm text-[var(--color-text-secondary)]">
          {uploading
            ? "⏳ Качване…"
            : "📂 Drag & drop файлове тук, или кликни за избор"}
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
          Макс. 50 MB на файл · PDF, изображения, документи
        </p>
      </div>

      {/* Pending category + description */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <select
          value={pendingCategory}
          onChange={(e) => setPendingCategory(e.target.value)}
          disabled={uploading}
          className="rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-void)] px-3 py-2 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]"
        >
          {CATEGORIES.map((c) => (
            <option key={c.v} value={c.v}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Кратко описание (опц.)"
          value={pendingDescription}
          onChange={(e) => setPendingDescription(e.target.value)}
          disabled={uploading}
          className="rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-void)] px-3 py-2 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]"
        />
      </div>

      {/* Files list */}
      {files.length > 0 && (
        <div className="mt-6 divide-y divide-[var(--color-border-default)]">
          {files.map((f) => {
            const cat = CATEGORIES.find((c) => c.v === f.category);
            return (
              <div key={f.id} className="flex items-start gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      {cat?.label.split(" ")[0] ?? "📎"}
                    </span>
                    <a
                      href={`/api/admin/contacts/${contactId}/files/${f.id}`}
                      className="text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent-cyan)] underline-offset-2 hover:underline truncate"
                      title="Свали"
                    >
                      {f.filename}
                    </a>
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      ({formatBytes(f.size_bytes)})
                    </span>
                  </div>
                  {f.description && (
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      {f.description}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-[var(--color-text-tertiary)]">
                    {formatDate(f.uploaded_at)}
                    {f.uploaded_by && ` · ${f.uploaded_by}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(f.id, f.filename)}
                  className="text-xs text-[var(--color-text-tertiary)] hover:text-red-400"
                  title="Изтрий"
                >
                  🗑️
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!loading && files.length === 0 && (
        <p className="mt-6 text-center text-xs text-[var(--color-text-tertiary)]">
          Няма качени файлове за този клиент.
        </p>
      )}
    </div>
  );
}
