"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Note } from "./notes";

export const DRAFT_KEY = "notas-en-markdown:draft:v1";

export interface DraftState {
  noteId: string;
  title: string;
  content: string;
  tags: string[];
  savedAt: string;
}

function readDraft(): DraftState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;
    const d = parsed as Record<string, unknown>;
    if (typeof d.noteId !== "string" || typeof d.title !== "string" || typeof d.content !== "string" || !Array.isArray(d.tags)) {
      return null;
    }
    return {
      noteId: d.noteId,
      title: d.title,
      content: d.content,
      tags: d.tags.filter((t): t is string => typeof t === "string"),
      savedAt: typeof d.savedAt === "string" ? d.savedAt : "",
    };
  } catch {
    return null;
  }
}

function writeDraft(draft: DraftState | null) {
  if (typeof window === "undefined") return;
  try {
    if (!draft) {
      window.localStorage.removeItem(DRAFT_KEY);
    } else {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  } catch {
    // ignore
  }
}

class UnauthorizedError extends Error {
  constructor() {
    super("api_unauthorized");
    this.name = "UnauthorizedError";
  }
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (res.status === 401) {
    throw new UnauthorizedError();
  }
  if (!res.ok) {
    throw new Error("api_error");
  }
  return (await res.json()) as T;
}

export interface UseNotesResult {
  notes: Note[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createNote: (input?: { title?: string; content?: string; tags?: string[] }) => Promise<Note | null>;
  patchNote: (id: string, patch: Record<string, unknown>) => Promise<Note | null>;
  deleteNotePermanent: (id: string) => Promise<boolean>;
  importMarkdown: (markdown: string) => Promise<number>;
  exportMarkdown: () => Promise<string>;
  pendingDraft: DraftState | null;
  setDraft: (draft: DraftState | null) => void;
  clearDraft: () => void;
  dirty: boolean;
  markClean: () => void;
  markDirty: () => void;
}

export function useNotesState(): UseNotesResult {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<DraftState | null>(() => (typeof window === "undefined" ? null : readDraft()));
  const [dirty, setDirty] = useState(false);

  const markDirty = useCallback(() => setDirty(true), []);
  const markClean = useCallback(() => setDirty(false), []);

  const redirectToLogin = useCallback(() => {
    const next = `${window.location.pathname}${window.location.search}`;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
    router.refresh();
  }, [router]);

  const callApi = useCallback(
    async <T,>(work: () => Promise<T>): Promise<T> => {
      try {
        return await work();
      } catch (error) {
        if (error instanceof UnauthorizedError) redirectToLogin();
        throw error;
      }
    },
    [redirectToLogin],
  );

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const setDraft = useCallback((draft: DraftState | null) => {
    setPendingDraft(draft);
    writeDraft(draft);
  }, []);

  const clearDraft = useCallback(() => {
    setPendingDraft(null);
    writeDraft(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await callApi(() => api<Note[]>("/api/notes"));
      setNotes(data);
      setError(null);
    } catch {
      setError("No se pudieron cargar las notas.");
    } finally {
      setLoading(false);
    }
  }, [callApi]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await callApi(() => api<Note[]>("/api/notes"));
        if (!cancelled) {
          setNotes(data);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("No se pudieron cargar las notas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [callApi]);

  const createNote = useCallback(async (input?: { title?: string; content?: string; tags?: string[] }) => {
    try {
      const note = await callApi(() => api<Note>("/api/notes", { method: "POST", body: JSON.stringify(input ?? {}) }));
      setNotes((prev) => [note, ...prev]);
      return note;
    } catch {
      setError("No se pudo crear la nota.");
      return null;
    }
  }, [callApi]);

  const patchNote = useCallback(async (id: string, patch: Record<string, unknown>) => {
    try {
      const note = await callApi(() => api<Note>(`/api/notes/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) }));
      setNotes((prev) => prev.map((n) => (n.id === id ? note : n)));
      return note;
    } catch {
      setError("No se pudo guardar la nota.");
      return null;
    }
  }, [callApi]);

  const deleteNotePermanent = useCallback(async (id: string) => {
    try {
      await callApi(() => api(`/api/notes/${encodeURIComponent(id)}`, { method: "DELETE" }));
      setNotes((prev) => prev.filter((n) => n.id !== id));
      return true;
    } catch {
      setError("No se pudo eliminar la nota.");
      return false;
    }
  }, [callApi]);

  const importMarkdown = useCallback(async (markdown: string) => {
    const res = await callApi(() => api<{ imported: number }>("/api/notes", { method: "POST", body: JSON.stringify({ action: "import", markdown }) }));
    await refresh();
    return res.imported;
  }, [callApi, refresh]);

  const exportMarkdown = useCallback(async () => {
    const res = await callApi(() => api<{ markdown: string }>("/api/notes", { method: "POST", body: JSON.stringify({ action: "export" }) }));
    return res.markdown;
  }, [callApi]);

  return useMemo(() => ({
    notes,
    loading,
    error,
    refresh,
    createNote,
    patchNote,
    deleteNotePermanent,
    importMarkdown,
    exportMarkdown,
    pendingDraft,
    setDraft,
    clearDraft,
    dirty,
    markClean,
    markDirty,
  }), [notes, loading, error, refresh, createNote, patchNote, deleteNotePermanent, importMarkdown, exportMarkdown, pendingDraft, setDraft, clearDraft, dirty, markClean, markDirty]);
}
