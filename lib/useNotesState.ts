"use client";

import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Note } from "./notes";
import { searchNotes } from "./search";
import { loadNotes, saveNotes } from "./storage";

export interface UseNotesStateResult {
  notes: Note[];
  setNotes: Dispatch<SetStateAction<Note[]>>;
  activeNoteId: string | null;
  setActiveNoteId: Dispatch<SetStateAction<string | null>>;
}

export function useNotesState(
  initialNotes: readonly Note[],
): UseNotesStateResult {
  const [notes, setNotes] = useState<Note[]>(() => [...initialNotes]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(
    () => searchNotes(initialNotes)[0]?.id ?? null,
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hidratación inicial desde localStorage */
    try {
      const storedNotes = loadNotes();

      if (storedNotes.length > 0) {
        setNotes(storedNotes);
        setActiveNoteId((current) => {
          const stillExists = storedNotes.some((note) => note.id === current);

          return stillExists
            ? current
            : (searchNotes(storedNotes)[0]?.id ?? null);
        });
      }
    } catch {
      // Si el almacenamiento está corrupto, se mantienen las notas iniciales.
    } finally {
      setIsHydrated(true);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      saveNotes(notes);
    } catch {
      // Un fallo de escritura no debe interrumpir la edición.
    }
  }, [notes, isHydrated]);

  return { notes, setNotes, activeNoteId, setActiveNoteId };
}
