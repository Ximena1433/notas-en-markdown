"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import MarkdownEditor from "./MarkdownEditor";
import NoteHeader from "./NoteHeader";
import NotesPanel from "./NotesPanel";
import VersionHistory from "./VersionHistory";
import { useNotesState } from "../lib/useNotesState";

type MobileView = "notes" | "editor";

interface MobileTab {
  id: MobileView;
  label: string;
}

const MOBILE_TABS: readonly MobileTab[] = [
  { id: "notes", label: "Notas" },
  { id: "editor", label: "Edicion" },
];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-300 dark:focus-visible:ring-offset-zinc-950";
const TAB_BASE = `flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${FOCUS_RING}`;

export default function NotesClient({ activeId }: { activeId?: string }) {
  const router = useRouter();
  const {
    notes,
    loading,
    error,
    createNote,
    patchNote,
    importMarkdown,
    exportMarkdown,
    pendingDraft,
    setDraft,
    clearDraft,
    dirty,
    markClean,
    markDirty,
  } = useNotesState();

  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mobileView, setMobileView] = useState<MobileView>("notes");
  const [announcement, setAnnouncement] = useState("");
  const [editorState, setEditorState] = useState<{ noteId: string; title: string; content: string; tags: string[] } | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");
  const recoveredRef = useRef<string | null>(null);

  const id = useId();
  const tabRefs = useRef<Record<MobileView, HTMLButtonElement | null>>({ notes: null, editor: null });
  const editorPanelRef = useRef<HTMLElement | null>(null);

  const notesTabId = `${id}-notes-tab`;
  const editorTabId = `${id}-editor-tab`;
  const notesPanelId = `${id}-notes-panel`;
  const editorPanelId = `${id}-editor-panel`;

  const activeNotes = notes.filter((n) => !n.deletedAt);
  const activeNote = (activeId ? activeNotes.find((n) => n.id === activeId) : activeNotes[0]) ?? null;

  const draftForActive = pendingDraft && activeNote && pendingDraft.noteId === activeNote.id ? pendingDraft : null;
  const effectiveEditorState = useMemo(
    () =>
      activeNote
        ? editorState && editorState.noteId === activeNote.id
          ? editorState
          : {
              noteId: activeNote.id,
              title: draftForActive ? draftForActive.title : activeNote.title,
              content: draftForActive ? draftForActive.content : activeNote.content,
              tags: draftForActive ? draftForActive.tags : [...activeNote.tags],
            }
        : null,
    [activeNote, editorState, draftForActive],
  );

  useEffect(() => {
    if (!activeNote || !draftForActive) return;
    if (recoveredRef.current === activeNote.id) return;
    recoveredRef.current = activeNote.id;
    setAnnouncement("Se recupero un borrador no guardado.");
    markDirty();
  }, [activeNote, draftForActive, markDirty]);

  useEffect(() => {
    if (!activeNote) return;
    lastSavedRef.current = JSON.stringify({ title: activeNote.title, content: activeNote.content, tags: activeNote.tags });
    markClean();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNote?.id]);

  useEffect(() => {
    if (!effectiveEditorState || !activeNote) return;
    const snapshot = JSON.stringify({ title: effectiveEditorState.title, content: effectiveEditorState.content, tags: effectiveEditorState.tags });
    if (snapshot === lastSavedRef.current) return;

    markDirty();
    setDraft({ noteId: effectiveEditorState.noteId, title: effectiveEditorState.title, content: effectiveEditorState.content, tags: effectiveEditorState.tags, savedAt: new Date().toISOString() });

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const res = await patchNote(activeNote.id, {
        title: effectiveEditorState.title,
        content: effectiveEditorState.content,
        tags: effectiveEditorState.tags,
      });
      if (res) {
        lastSavedRef.current = JSON.stringify({ title: res.title, content: res.content, tags: res.tags });
        clearDraft();
        markClean();
      }
    }, 800);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [effectiveEditorState, activeNote, patchNote, setDraft, clearDraft, markClean, markDirty]);

  function updateEditor(patch: Partial<{ title: string; content: string; tags: string[] }>) {
    if (!activeNote) return;
    setEditorState((current) => {
      const base = current && current.noteId === activeNote.id
        ? current
        : {
            noteId: activeNote.id,
            title: activeNote.title,
            content: activeNote.content,
            tags: [...activeNote.tags],
          };
      return { ...base, ...patch };
    });
  }

  function selectNote(noteId: string) {
    setMobileView("editor");
    router.push(`/notas/${encodeURIComponent(noteId)}`);
  }

  async function handleCreateNote() {
    const note = await createNote({ title: "Nota sin titulo", content: "", tags: [] });
    if (!note) return;
    setMobileView("editor");
    setQuery("");
    setSelectedTags([]);
    setAnnouncement(`Se creo la nota "${note.title}" y se abrio en el editor.`);
    router.push(`/notas/${encodeURIComponent(note.id)}`);
  }

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    );
  }

  async function handleSaveVersion() {
    if (!activeNote) return;
    await patchNote(activeNote.id, { action: "save-version" });
    setAnnouncement("Se guardo la version actual de la nota.");
  }

  async function handleRestoreVersion(versionIndex: number) {
    if (!activeNote) return;
    await patchNote(activeNote.id, { action: "restore-version", versionIndex });
    setAnnouncement("Se restauro la version seleccionada.");
  }

  async function handleTrash() {
    if (!activeNote) return;
    await patchNote(activeNote.id, { action: "trash" });
    setAnnouncement("La nota se movio a la papelera.");
    router.push("/notas");
  }

  async function handleExport() {
    try {
      const markdown = await exportMarkdown();
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "notas.md";
      a.click();
      URL.revokeObjectURL(url);
      setAnnouncement("Se exportaron las notas.");
    } catch {
      setAnnouncement("No se pudo exportar.");
    }
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text();
      const count = await importMarkdown(text);
      setAnnouncement(`Se importaron ${count} notas.`);
    } catch {
      setAnnouncement("No se pudo importar el archivo.");
    }
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    let nextIndex: number;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % MOBILE_TABS.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + MOBILE_TABS.length) % MOBILE_TABS.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = MOBILE_TABS.length - 1;
    else return;
    event.preventDefault();
    const nextTab = MOBILE_TABS[nextIndex];
    if (!nextTab) return;
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
          Edita, etiqueta, busca y gestiona versiones de tus notas.
        </p>
      </header>

      {error ? <p className="text-sm text-red-700 dark:text-red-300">{error}</p> : null}

      <p role="status" aria-live="polite" aria-atomic="true" data-testid="note-announcement" className="min-h-5 break-words text-sm text-blue-800 dark:text-blue-200">
        {announcement}{dirty ? " (cambios pendientes)" : ""}
      </p>

      <div role="tablist" aria-label="Vistas de la aplicacion" className="grid grid-cols-2 gap-2 lg:hidden">
        {MOBILE_TABS.map((tab, index) => {
          const isActive = mobileView === tab.id;
          return (
            <button
              key={tab.id}
              ref={(element) => { tabRefs.current[tab.id] = element; }}
              id={tab.id === "notes" ? notesTabId : editorTabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={tab.id === "notes" ? notesPanelId : editorPanelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setMobileView(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={`${TAB_BASE} ${isActive ? "border-blue-700 bg-blue-700 text-white dark:border-blue-400 dark:bg-blue-400 dark:text-zinc-950" : "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div data-testid="note-app-layout" className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] lg:items-start">
        <NotesPanel
          notes={activeNotes}
          activeNoteId={activeNote?.id ?? null}
          query={query}
          selectedTags={selectedTags}
          panelId={notesPanelId}
          tabId={notesTabId}
          isVisible={mobileView === "notes"}
          onQueryChange={setQuery}
          onToggleTag={toggleTag}
          onSelectNote={selectNote}
          onCreateNote={handleCreateNote}
          onExport={handleExport}
          onImport={handleImport}
        />

        <section
          ref={editorPanelRef}
          id={editorPanelId}
          role="tabpanel"
          aria-labelledby={editorTabId}
          tabIndex={-1}
          data-testid="editor-panel"
          className={`min-w-0 ${mobileView === "editor" ? "block" : "hidden lg:block"}`}
        >
          {loading ? (
            <p className="text-sm text-zinc-700 dark:text-zinc-300">Cargando notas...</p>
          ) : activeNote && effectiveEditorState ? (
            <div className="flex min-w-0 flex-col gap-5">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleTrash}
                  className={`inline-flex min-h-11 items-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-red-950 ${FOCUS_RING}`}
                >
                  Mover a papelera
                </button>
              </div>
              <NoteHeader
                title={effectiveEditorState.title}
                tags={effectiveEditorState.tags}
                onTitleCommit={(title) => updateEditor({ title })}
                onTagsChange={(tags) => updateEditor({ tags })}
              />
              <MarkdownEditor
                content={effectiveEditorState.content}
                onChange={(content) => updateEditor({ content })}
              />
              <VersionHistory
                versions={activeNote.versions}
                noteTitle={activeNote.title}
                onSaveVersion={handleSaveVersion}
                onRestore={handleRestoreVersion}
              />
            </div>
          ) : (
            <p className="text-sm text-zinc-700 dark:text-zinc-300">Selecciona o crea una nota para editarla.</p>
          )}
        </section>
      </div>
    </main>
  );
}
