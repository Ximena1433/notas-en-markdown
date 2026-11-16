"use client";

import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import ReactMarkdown from "react-markdown";

type EditorTab = "editor" | "preview";

interface TabDefinition {
  id: EditorTab;
  label: string;
}

const TABS: readonly TabDefinition[] = [
  { id: "editor", label: "Editor" },
  { id: "preview", label: "Vista previa" },
];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-300 dark:focus-visible:ring-offset-zinc-950";

export interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function MarkdownEditor({
  content,
  onChange,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>("editor");
  const id = useId();
  const tabRefs = useRef<Record<EditorTab, HTMLButtonElement | null>>({
    editor: null,
    preview: null,
  });

  const headingId = `${id}-heading`;
  const editorTabId = `${id}-editor-tab`;
  const previewTabId = `${id}-preview-tab`;
  const editorPanelId = `${id}-editor-panel`;
  const previewPanelId = `${id}-preview-panel`;
  const textareaId = `${id}-content`;
  const hintId = `${id}-ayuda`;

  function handleContentChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onChange(event.target.value);
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    let nextIndex: number;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % TABS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = TABS.length - 1;
    } else {
      return;
    }

    event.preventDefault();

    const nextTab = TABS[nextIndex];

    if (nextTab === undefined) {
      return;
    }

    setActiveTab(nextTab.id);
    tabRefs.current[nextTab.id]?.focus();
  }

  return (
    <section
      aria-labelledby={headingId}
      className="flex w-full min-w-0 flex-col gap-4"
    >
      <header className="flex flex-col gap-1">
        <h2
          id={headingId}
          className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
        >
          Editor de notas Markdown
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Escribe en Markdown y revisa el resultado en la vista previa.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Vistas del editor"
        className="grid grid-cols-2 gap-2 md:hidden"
      >
        {TABS.map((tab, index) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[tab.id] = element;
              }}
              id={tab.id === "editor" ? editorTabId : previewTabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={
                tab.id === "editor" ? editorPanelId : previewPanelId
              }
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={`flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${FOCUS_RING} ${
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
        data-testid="editor-layout"
        className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2"
      >
        <div
          id={editorPanelId}
          role="tabpanel"
          aria-labelledby={editorTabId}
          className={`min-w-0 ${
            activeTab === "editor" ? "block" : "hidden md:block"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor={textareaId}
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Contenido Markdown
            </label>
            <span
              id={hintId}
              className="text-xs text-zinc-700 dark:text-zinc-300"
            >
              {content.length} caracteres · La vista previa se actualiza al
              escribir
            </span>
          </div>
          <textarea
            id={textareaId}
            value={content}
            onChange={handleContentChange}
            aria-describedby={hintId}
            placeholder="# Escribe tu nota..."
            spellCheck
            className={`mt-2 min-h-[45vh] w-full min-w-0 resize-y rounded-xl border border-zinc-300 bg-white p-4 font-mono text-sm leading-6 text-zinc-950 shadow-sm placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-400 ${FOCUS_RING}`}
          />
        </div>

        <div
          id={previewPanelId}
          role="tabpanel"
          aria-labelledby={previewTabId}
          tabIndex={0}
          className={`min-w-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${FOCUS_RING} ${
            activeTab === "preview" ? "block" : "hidden md:block"
          }`}
        >
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Vista previa
          </h2>
          <div className="markdown-preview mt-3 min-w-0 text-zinc-950 dark:text-zinc-50">
            {content.trim() === "" ? (
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                La vista previa aparecerá aquí.
              </p>
            ) : (
              <ReactMarkdown>{content}</ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
