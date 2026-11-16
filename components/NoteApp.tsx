"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import MarkdownEditor from "./MarkdownEditor";
import NoteHeader from "./NoteHeader";
import NotesPanel from "./NotesPanel";
import VersionHistory from "./VersionHistory";
import {
  createNote,
  createNoteId,
  DEFAULT_NOTE_TITLE,
  restoreNoteVersion,
  saveNoteVersion,
  updateNoteTitle,
  type Note,
} from "../lib/notes";
import { useNotesState } from "../lib/useNotesState";

type MobileView = "notes" | "editor";

interface MobileTab {
  id: MobileView;
  label: string;
}

const MOBILE_TABS: readonly MobileTab[] = [
  { id: "notes", label: "Notas" },
  { id: "editor", label: "Edición" },
];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-300 dark:focus-visible:ring-offset-zinc-950";

const TAB_BASE = `flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${FOCUS_RING}`;

function currentTimestamp(): string {
  return new Date().toISOString();
}

export interface NoteAppProps {
  initialNotes: readonly Note[];
  now?: () => string;
}

export default function NoteApp({
  initialNotes,
  now = currentTimestamp,
}: NoteAppProps) {
  const { notes, setNotes, activeNoteId, setActiveNoteId } =
    useNotesState(initialNotes);
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mobileView, setMobileView] = useState<MobileView>("notes");
  const [announcement, setAnnouncement] = useState("");
  const id = useId();
  const tabRefs = useRef<Record<MobileView, HTMLButtonElement | null>>({
    notes: null,
    editor: null,
  });
  const editorPanelRef = useRef<HTMLElement | null>(null);
  const shouldFocusEditor = useRef(false);

  const notesTabId = `${id}-notes-tab`;
  const editorTabId = `${id}-editor-tab`;
  const notesPanelId = `${id}-notes-panel`;
  const editorPanelId = `${id}-editor-panel`;

  const activeNote =
    notes.find((note) => note.id === activeNoteId) ?? null;

  function selectNote(noteId: string) {
    setActiveNoteId(noteId);
    setMobileView("editor");
  }

  function handleCreateNote() {
    const note = createNote(
      { id: createNoteId(), title: DEFAULT_NOTE_TITLE },
      now(),
    );

    setNotes((current) => [note, ...current]);
    setActiveNoteId(note.id);
    setMobileView("editor");
    setQuery("");
    setSelectedTags([]);
    setAnnouncement(
      `Se creó la nota «${DEFAULT_NOTE_TITLE}» y se abrió en el editor.`,
    );
    shouldFocusEditor.current = true;
  }

  useEffect(() => {
    if (!shouldFocusEditor.current) {
      return;
    }

    shouldFocusEditor.current = false;
    editorPanelRef.current?.focus();
  }, [activeNoteId]);

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((selected) => selected !== tag)
        : [...current, tag],
    );
  }

  function updateActiveNote(update: (note: Note) => Note) {
    if (activeNoteId === null) {
      return;
    }

    setNotes((current) =>
      current.map((note) => (note.id === activeNoteId ? update(note) : note)),
    );
  }

  function updateActiveContent(content: string) {
    updateActiveNote((note) => ({ ...note, content }));
  }

  function updateActiveTitle(title: string) {
    updateActiveNote((note) => updateNoteTitle(note, title));
  }

  function saveActiveVersion() {
    if (activeNoteId === null) {
      return;
    }

    setNotes((current) =>
      current.map((note) =>
        note.id === activeNoteId ? saveNoteVersion(note, now()) : note,
      ),
    );
  }

  function restoreActiveVersion(versionIndex: number) {
    if (activeNoteId === null) {
      return;
    }

    setNotes((current) =>
      current.map((note) =>
        note.id === activeNoteId
          ? restoreNoteVersion(note, versionIndex, now())
          : note,
      ),
    );
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    let nextIndex: number;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % MOBILE_TABS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + MOBILE_TABS.length) % MOBILE_TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = MOBILE_TABS.length - 1;
    } else {
      return;
    }

    event.preventDefault();

    const nextTab = MOBILE_TABS[nextIndex];

    if (nextTab === undefined) {
      return;
    }

    setMobileView(nextTab.id);
    tabRefs.current[nextTab.id]?.focus();
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-6 md:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl dark:text-zinc-50">
          Notas en Markdown
        </h1>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Organiza tus notas, búscalas por texto o etiquetas y recupera
          versiones anteriores.
        </p>
      </header>

      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="note-announcement"
        className="min-h-5 break-words text-sm text-blue-800 dark:text-blue-200"
      >
        {announcement}
      </p>

      <div
        role="tablist"
        aria-label="Vistas de la aplicación"
        className="grid grid-cols-2 gap-2 lg:hidden"
      >
        {MOBILE_TABS.map((tab, index) => {
          const isActive = mobileView === tab.id;

          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[tab.id] = element;
              }}
              id={tab.id === "notes" ? notesTabId : editorTabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={tab.id === "notes" ? notesPanelId : editorPanelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setMobileView(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={`${TAB_BASE} ${
                isActive
                  ? "border-blue-700 bg-blue-700 text-white dark:border-blue-400 dark:bg-blue-400 dark:text-zinc-950"
                  : "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        data-testid="note-app-layout"
        className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] lg:items-start"
      >
        <NotesPanel
          notes={notes}
          activeNoteId={activeNoteId}
          query={query}
          selectedTags={selectedTags}
          panelId={notesPanelId}
          tabId={notesTabId}
          isVisible={mobileView === "notes"}
          onQueryChange={setQuery}
          onToggleTag={toggleTag}
          onSelectNote={selectNote}
          onCreateNote={handleCreateNote}
        />

        <section
          ref={editorPanelRef}
          id={editorPanelId}
          role="tabpanel"
          aria-labelledby={editorTabId}
          tabIndex={-1}
          data-testid="editor-panel"
          className={`min-w-0 ${
            mobileView === "editor" ? "block" : "hidden lg:block"
          }`}
        >
          {activeNote ? (
            <div className="flex min-w-0 flex-col gap-5">
              <NoteHeader
                title={activeNote.title}
                tags={activeNote.tags}
                onTitleCommit={updateActiveTitle}
              />

              <MarkdownEditor
                content={activeNote.content}
                onChange={updateActiveContent}
              />

              <VersionHistory
                versions={activeNote.versions}
                noteTitle={activeNote.title}
                onSaveVersion={saveActiveVersion}
                onRestore={restoreActiveVersion}
              />
            </div>
          ) : (
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Selecciona una nota para editarla.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
