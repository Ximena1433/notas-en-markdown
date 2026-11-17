"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useNotesState } from "../lib/useNotesState";

export default function VersionesClient() {
  const { notes, loading, error, patchNote } = useNotesState();

  const entries = useMemo(() => {
    const list: { noteId: string; noteTitle: string; index: number; timestamp: string; content: string }[] = [];
    for (const note of notes) {
      note.versions.forEach((v, index) => {
        list.push({ noteId: note.id, noteTitle: note.title, index, timestamp: v.timestamp, content: v.content });
      });
    }
    return list.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  }, [notes]);

  async function restore(noteId: string, index: number) {
    await patchNote(noteId, { action: "restore-version", versionIndex: index });
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-6 md:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Historial de versiones</h1>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">Listado global de versiones de todas las notas.</p>
      </header>
      {error ? <p className="text-sm text-red-700 dark:text-red-300">{error}</p> : null}
      {loading ? (
        <p className="text-sm">Cargando...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">No hay versiones guardadas.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => (
            <li key={`${e.noteId}-${e.index}-${e.timestamp}`} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold break-words">{e.noteTitle}</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{new Date(e.timestamp).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{e.content || "(sin contenido)"}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/notas/${encodeURIComponent(e.noteId)}`} className="inline-flex min-h-11 items-center rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">Abrir nota</Link>
                  <button type="button" onClick={() => restore(e.noteId, e.index)} className="inline-flex min-h-11 items-center rounded-lg border border-blue-700 bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800 dark:border-blue-400 dark:bg-blue-400 dark:text-zinc-950">Restaurar</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
