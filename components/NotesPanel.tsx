"use client";

import { useId } from "react";
import type { Note } from "../lib/notes";
import { searchNotes } from "../lib/search";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-300 dark:focus-visible:ring-offset-zinc-950";

const NOTE_BUTTON_BASE = `w-full min-h-11 min-w-0 break-words rounded-lg border px-3 py-2 text-left transition-colors ${FOCUS_RING}`;

const TAG_BASE = `inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-3 py-1 text-sm font-medium transition-colors ${FOCUS_RING}`;

const CREATE_BUTTON = `inline-flex min-h-11 min-w-11 w-full items-center justify-center rounded-lg border border-blue-700 bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 dark:border-blue-400 dark:bg-blue-400 dark:text-zinc-950 dark:hover:bg-blue-300 sm:w-auto ${FOCUS_RING}`;

export interface NotesPanelProps {
  notes: readonly Note[];
  activeNoteId: string | null;
  query: string;
  selectedTags: readonly string[];
  panelId: string;
  tabId: string;
  isVisible: boolean;
  onQueryChange: (query: string) => void;
  onToggleTag: (tag: string) => void;
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
}

export default function NotesPanel({
  notes,
  activeNoteId,
  query,
  selectedTags,
  panelId,
  tabId,
  isVisible,
  onQueryChange,
  onToggleTag,
  onSelectNote,
  onCreateNote,
}: NotesPanelProps) {
  const id = useId();
  const headingId = `${id}-heading`;
  const searchId = `${id}-search`;
  const tagsLabelId = `${id}-tags-label`;
  const visibleNotes = searchNotes(notes, {
    text: query,
    tags: [...selectedTags],
  });
  const availableTags = Array.from(
    new Set(notes.flatMap((note) => note.tags)),
  ).sort((first, second) => first.localeCompare(second, "es"));

  return (
    <section
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      data-testid="notes-panel"
      className={`min-w-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${
        isVisible ? "block" : "hidden lg:block"
      }`}
    >
      <h2
        id={headingId}
        className="text-base font-semibold text-zinc-950 dark:text-zinc-50"
      >
        Notas
      </h2>

      <button
        type="button"
        onClick={onCreateNote}
        className={`mt-3 ${CREATE_BUTTON}`}
      >
        Nueva nota
      </button>

      <form
        role="search"
        onSubmit={(event) => event.preventDefault()}
        className="mt-3"
      >
        <label
          htmlFor={searchId}
          className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100"
        >
          Buscar notas
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Título o contenido..."
          className={`mt-1 h-11 w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-400 ${FOCUS_RING}`}
        />
      </form>

      {availableTags.length > 0 ? (
        <div role="group" aria-labelledby={tagsLabelId} className="mt-3">
          <p
            id={tagsLabelId}
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
          >
            Filtrar por etiquetas
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);

              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onToggleTag(tag)}
                  className={`${TAG_BASE} ${
                    isSelected
                      ? "border-blue-700 bg-blue-700 text-white dark:border-blue-400 dark:bg-blue-400 dark:text-zinc-950"
                      : "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <h3 className="sr-only">Resultados</h3>
        {visibleNotes.length === 0 ? (
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            No hay notas que coincidan con la búsqueda.
          </p>
        ) : (
          <ul
            data-testid="note-list"
            aria-labelledby={headingId}
            className="space-y-2"
          >
            {visibleNotes.map((note) => {
              const isActive = note.id === activeNoteId;

              return (
                <li key={note.id} className="min-w-0">
                  <button
                    type="button"
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => onSelectNote(note.id)}
                    className={`${NOTE_BUTTON_BASE} ${
                      isActive
                        ? "border-blue-700 bg-blue-50 dark:border-blue-400 dark:bg-blue-950"
                        : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="block break-words text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                      {note.title}
                    </span>
                    <span className="mt-1 block break-words text-xs text-zinc-700 dark:text-zinc-300">
                      {note.tags.length > 0
                        ? note.tags.join(" · ")
                        : "Sin etiquetas"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
