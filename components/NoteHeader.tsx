"use client";

import { useId, useState, type KeyboardEvent } from "react";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-300 dark:focus-visible:ring-offset-zinc-950";

export interface NoteHeaderProps {
  title: string;
  tags: readonly string[];
  onTitleCommit: (title: string) => void;
}

export default function NoteHeader({
  title,
  tags,
  onTitleCommit,
}: NoteHeaderProps) {
  const [draft, setDraft] = useState(title);
  const [syncedTitle, setSyncedTitle] = useState(title);
  const id = useId();

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
      <p className="mt-1 break-words text-sm text-zinc-700 dark:text-zinc-300">
        {tags.length > 0 ? tags.join(" · ") : "Sin etiquetas"}
      </p>
    </div>
  );
}
