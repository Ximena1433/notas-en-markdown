"use client";

import { searchNotes } from "../lib/search";
import { useNotesState } from "../lib/useNotesState";

export default function PapeleraClient() {
  const { notes, loading, error, patchNote, deleteNotePermanent } = useNotesState();
  const trashed = searchNotes(notes, { onlyTrashed: true });

  async function restore(id: string) {
    await patchNote(id, { action: "restore-trash" });
  }

  async function remove(id: string) {
    if (!confirm("Eliminar definitivamente esta nota?")) return;
    await deleteNotePermanent(id);
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-6 md:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Papelera</h1>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">Notas eliminadas. Puedes restaurarlas o borrarlas definitivamente.</p>
      </header>
      {error ? <p className="text-sm text-red-700 dark:text-red-300">{error}</p> : null}
      {loading ? (
        <p className="text-sm">Cargando...</p>
      ) : trashed.length === 0 ? (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">La papelera esta vacia.</p>
      ) : (
        <ul className="space-y-3">
          {trashed.map((note) => (
            <li key={note.id} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold break-words">{note.title}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{note.tags.join(" - ") || "Sin etiquetas"}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => restore(note.id)} className="inline-flex min-h-11 items-center rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">Restaurar</button>
                  <button type="button" onClick={() => remove(note.id)} className="inline-flex min-h-11 items-center rounded-lg border border-red-700 bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800">Eliminar definitivo</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
