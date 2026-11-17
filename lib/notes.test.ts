import { describe, expect, it } from "vitest";
import {
  createNote,
  moveNoteToTrash,
  restoreNoteFromTrash,
  restoreNoteVersion,
  saveNoteVersion,
  updateNoteTags,
  updateNoteTitle,
} from "./notes";

const T0 = "2026-11-14T09:00:00.000Z";
const T1 = "2026-11-14T10:00:00.000Z";
const T2 = "2026-11-14T11:00:00.000Z";

describe("createNote", () => {
  it("crea una nota con valores normalizados", () => {
    const note = createNote(
      {
        id: "nota-1",
        title: "Primera nota",
        content: "# Hola",
        tags: ["ideas", " Ideas ", "", "markdown"],
      },
      T0,
    );

    expect(note).toEqual({
      id: "nota-1",
      title: "Primera nota",
      content: "# Hola",
      tags: ["ideas", "markdown"],
      updatedAt: T0,
      versions: [],
      deletedAt: null,
    });
  });
});

describe("updateNoteTitle", () => {
  it("actualiza el título recortando espacios", () => {
    const note = createNote({ id: "n1", title: "Antiguo" }, T0);
    const updated = updateNoteTitle(note, "  Nuevo  ");
    expect(updated.title).toBe("Nuevo");
  });

  it("mantiene el título si queda vacío", () => {
    const note = createNote({ id: "n1", title: "Antiguo" }, T0);
    expect(updateNoteTitle(note, "   ")).toBe(note);
  });
});

describe("updateNoteTags", () => {
  it("normaliza, recorta y elimina duplicados", () => {
    const note = createNote({ id: "n1", title: "N", tags: ["a"] }, T0);
    const updated = updateNoteTags(note, [" React ", "react", "Docs", ""]);
    expect(updated.tags).toEqual(["React", "Docs"]);
  });

  it("no cambia si las etiquetas son equivalentes", () => {
    const note = createNote({ id: "n1", title: "N", tags: ["a", "b"] }, T0);
    expect(updateNoteTags(note, ["a", "b"])).toBe(note);
  });
});

describe("saveNoteVersion", () => {
  it("guarda el contenido actual como versión sin cambiar updatedAt", () => {
    const note = createNote({ id: "n1", title: "N", content: "v1" }, T0);
    const saved = saveNoteVersion(note, T1);
    expect(saved.content).toBe("v1");
    expect(saved.updatedAt).toBe(T0);
    expect(saved.versions).toEqual([{ timestamp: T1, content: "v1" }]);
  });
});

describe("restoreNoteVersion", () => {
  it("guarda el actual y crea versión del restaurado", () => {
    const base = createNote({ id: "n1", title: "N", content: "v1" }, T0);
    const current = { ...base, content: "v2", versions: [{ timestamp: T0, content: "v1" }] };
    const restored = restoreNoteVersion(current, 0, T2);

    expect(restored.content).toBe("v1");
    expect(restored.updatedAt).toBe(T2);
    expect(restored.versions).toEqual([
      { timestamp: T0, content: "v1" },
      { timestamp: T2, content: "v2" },
      { timestamp: T2, content: "v1" },
    ]);
  });

  it("crea versiones incluso si el contenido coincide con el actual", () => {
    const note = createNote({ id: "n1", title: "N", content: "igual" }, T0);
    const withVersion = saveNoteVersion(note, T1);
    const restored = restoreNoteVersion(withVersion, 0, T2);
    expect(restored.content).toBe("igual");
    expect(restored.versions).toHaveLength(3);
  });

  it("lanza si el índice no existe", () => {
    const note = createNote({ id: "n1", title: "N", content: "v1" }, T0);
    expect(() => restoreNoteVersion(note, 0, T1)).toThrow(RangeError);
  });
});

describe("papelera", () => {
  it("mueve y restaura notas", () => {
    const note = createNote({ id: "n1", title: "N" }, T0);
    const trashed = moveNoteToTrash(note, T1);
    expect(trashed.deletedAt).toBe(T1);
    const restored = restoreNoteFromTrash(trashed, T2);
    expect(restored.deletedAt).toBeNull();
  });
});
