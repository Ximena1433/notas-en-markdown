"use client";

import { useId, useState, type KeyboardEvent } from "react";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-300 dark:focus-visible:ring-offset-zinc-950";

export interface NoteHeaderProps {
  title: string;
  tags: readonly string[];
  onTitleCommit: (title: string) => void;
  onTagsChange: (tags: string[]) => void;
}

export default function NoteHeader({
  title,
  tags,
  onTitleCommit,
  onTagsChange,
}: NoteHeaderProps) {
  const [draft, setDraft] = useState(title);
  const [syncedTitle, setSyncedTitle] = useState(title);
  const [tagDraft, setTagDraft] = useState("");
  const id = useId();
  const tagsId = `${id}-tags`;

  if (title !== syncedTitle) {
    setSyncedTitle(title);
    setDraft(title);
  }

  function commitTitle() {
    const nextTitle = draft.trim();
    if (nextTitle === "" || nextTitle === title) {
      setDraft(title);
      return;
    }
    onTitleCommit(nextTitle);
    setDraft(nextTitle);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      setDraft(title);
    }
  }

  function addTag() {
    const value = tagDraft.trim();
    if (!value) return;
    if (!tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      onTagsChange([...tags, value]);
    }
    setTagDraft("");
  }

  function removeTag(tag: string) {
    onTagsChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100"
      >
        Título de la nota
      </label>
      <input
        id={id}
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitTitle}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        spellCheck
        className={`mt-1 h-11 w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 text-xl font-semibold text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 ${FOCUS_RING}`}
      />

      <div className="mt-3">
        <label
          htmlFor={tagsId}
          className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100"
        >
          Etiquetas
        </label>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-zinc-100 px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Quitar etiqueta ${tag}`}
                className={`ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 ${FOCUS_RING}`}
              >
                x
              </button>
            </span>
          ))}
          <input
            id={tagsId}
            type="text"
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Nueva etiqueta"
            className={`h-9 min-w-[10rem] rounded-lg border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 ${FOCUS_RING}`}
          />
          <button
            type="button"
            onClick={addTag}
            className={`inline-flex h-9 items-center rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 ${FOCUS_RING}`}
          >
            Anadir
          </button>
        </div>
        {tags.length === 0 ? (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Sin etiquetas</p>
        ) : null}
      </div>
    </div>
  );
}
