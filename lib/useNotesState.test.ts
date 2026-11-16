import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createNote } from "./notes";
import { STORAGE_KEY, loadNotes, saveNotes } from "./storage";
import { useNotesState } from "./useNotesState";

const T0 = "2026-11-14T09:00:00.000Z";

const INITIAL = [createNote({ id: "inicial", title: "Nota inicial" }, T0)];
const STORED = [createNote({ id: "guardada", title: "Nota guardada" }, T0)];

describe("useNotesState", () => {
  it("carga las notas guardadas y corrige la nota activa", async () => {
    saveNotes(STORED);

    const { result } = renderHook(() => useNotesState(INITIAL));

    await waitFor(() => {
      expect(result.current.notes).toEqual(STORED);
    });

    expect(result.current.activeNoteId).toBe("guardada");
  });

  it("guarda los cambios después de hidratar", async () => {
    const { result } = renderHook(() => useNotesState(INITIAL));

    await waitFor(() => {
      expect(loadNotes()).toEqual(INITIAL);
    });

    act(() => {
      result.current.setNotes((current) => [
        ...current,
        createNote({ id: "nueva", title: "Nueva" }, T0),
      ]);
    });

    await waitFor(() => {
      expect(loadNotes().some((note) => note.id === "nueva")).toBe(true);
    });
  });

  it("mantiene las notas iniciales si el almacenamiento está corrupto", async () => {
    window.localStorage.setItem(STORAGE_KEY, "{corrupto");

    const { result } = renderHook(() => useNotesState(INITIAL));

    await waitFor(() => {
      expect(result.current.notes).toEqual(INITIAL);
    });

    expect(result.current.activeNoteId).toBe("inicial");
  });
});
