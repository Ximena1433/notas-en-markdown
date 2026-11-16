import { describe, expect, it } from "vitest";
import {
  createNote,
  restoreNoteVersion,
  saveNoteVersion,
  updateNoteContent,
  updateNoteTitle,
} from "./notes";

const T0 = "2026-11-14T09:00:00.000Z";
const T1 = "2026-11-14T10:00:00.000Z";
const T2 = "2026-11-14T11:00:00.000Z";
const T3 = "2026-11-14T12:00:00.000Z";

describe("createNote", () => {
  it("crea una nota con id, título, contenido, etiquetas y sin versiones", () => {
    const note = createNote(
      {
        id: "nota-1",
        title: "Primera nota",
        content: "# Hola",
        tags: ["ideas", "markdown"],
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
    });
  });

  it("usa contenido vacío y etiquetas vacías por defecto", () => {
    const note = createNote({ id: "nota-2", title: "Sin contenido" }, T0);

    expect(note.content).toBe("");
    expect(note.tags).toEqual([]);
    expect(note.updatedAt).toBe(T0);
    expect(note.versions).toEqual([]);
  });
});

describe("updateNoteTitle", () => {
  it("actualiza el título recortando espacios y conserva el resto", () => {
    const note = createNote(
      {
        id: "nota-1",
        title: "Antiguo",
        content: "v1",
        tags: ["ideas"],
      },
      T0,
    );

    const updated = updateNoteTitle(note, "  Nuevo título  ");

    expect(updated.title).toBe("Nuevo título");
    expect(updated.content).toBe("v1");
    expect(updated.tags).toEqual(["ideas"]);
    expect(updated.updatedAt).toBe(T0);
    expect(updated.versions).toEqual(note.versions);
    expect(note.title).toBe("Antiguo");
  });

  it("mantiene el título anterior si el nuevo está vacío", () => {
    const note = createNote({ id: "nota-1", title: "Antiguo" }, T0);

    expect(updateNoteTitle(note, "   ")).toBe(note);
  });

  it("devuelve la misma nota si el título no cambió", () => {
    const note = createNote({ id: "nota-1", title: "Igual" }, T0);

    expect(updateNoteTitle(note, " Igual ")).toBe(note);
  });
});

describe("updateNoteContent", () => {
  it("conserva el contenido anterior como una versión", () => {
    const note = createNote({ id: "nota-1", title: "Nota", content: "v1" }, T0);

    const updated = updateNoteContent(note, "v2", T1);

    expect(updated.content).toBe("v2");
    expect(updated.updatedAt).toBe(T1);
    expect(updated.versions).toEqual([{ timestamp: T1, content: "v1" }]);
  });

  it("acumula las versiones en orden de actualización", () => {
    const note = createNote({ id: "nota-1", title: "Nota", content: "v1" }, T0);

    const withV2 = updateNoteContent(note, "v2", T1);
    const withV3 = updateNoteContent(withV2, "v3", T2);

    expect(withV3.content).toBe("v3");
    expect(withV3.updatedAt).toBe(T2);
    expect(withV3.versions).toEqual([
      { timestamp: T1, content: "v1" },
      { timestamp: T2, content: "v2" },
    ]);
  });

  it("no crea una versión si el contenido no cambió", () => {
    const note = createNote({ id: "nota-1", title: "Nota", content: "v1" }, T0);

    const updated = updateNoteContent(note, "v1", T1);

    expect(updated).toBe(note);
    expect(updated.updatedAt).toBe(T0);
  });

  it("no muta la nota original", () => {
    const note = createNote({ id: "nota-1", title: "Nota", content: "v1" }, T0);

    updateNoteContent(note, "v2", T1);

    expect(note.content).toBe("v1");
    expect(note.versions).toEqual([]);
  });
});

describe("saveNoteVersion", () => {
  it("registra el contenido actual como una versión nueva", () => {
    const note = createNote(
      { id: "nota-1", title: "Nota", content: "v1" },
      T0,
    );

    const saved = saveNoteVersion(note, T1);

    expect(saved.content).toBe("v1");
    expect(saved.updatedAt).toBe(T0);
    expect(saved.versions).toEqual([{ timestamp: T1, content: "v1" }]);
  });

  it("acumula versiones explícitas en orden de guardado", () => {
    const note = createNote(
      { id: "nota-1", title: "Nota", content: "v1" },
      T0,
    );

    const firstSave = saveNoteVersion(note, T1);
    const withV2 = updateNoteContent(firstSave, "v2", T2);
    const secondSave = saveNoteVersion(withV2, T3);

    expect(secondSave.versions).toEqual([
      { timestamp: T1, content: "v1" },
      { timestamp: T2, content: "v1" },
      { timestamp: T3, content: "v2" },
    ]);
  });

  it("no muta la nota original al guardar", () => {
    const note = createNote(
      { id: "nota-1", title: "Nota", content: "v1" },
      T0,
    );

    saveNoteVersion(note, T1);

    expect(note.versions).toEqual([]);
  });
});

describe("restoreNoteVersion", () => {
  it("restaura el contenido de una versión previa", () => {
    const note = createNote({ id: "nota-1", title: "Nota", content: "v1" }, T0);
    const updated = updateNoteContent(note, "v2", T1);

    const restored = restoreNoteVersion(updated, 0, T2);

    expect(restored.content).toBe("v1");
    expect(restored.updatedAt).toBe(T2);
  });

  it("conserva el estado actual al restaurar para poder deshacerlo", () => {
    const note = createNote({ id: "nota-1", title: "Nota", content: "v1" }, T0);
    const updated = updateNoteContent(note, "v2", T1);

    const restored = restoreNoteVersion(updated, 0, T2);

    expect(restored.versions).toEqual([
      { timestamp: T1, content: "v1" },
      { timestamp: T2, content: "v2" },
    ]);
  });

  it("permite restaurar cualquier versión previa, no solo la última", () => {
    const note = createNote({ id: "nota-1", title: "Nota", content: "v1" }, T0);
    const withV2 = updateNoteContent(note, "v2", T1);
    const withV3 = updateNoteContent(withV2, "v3", T2);

    const restored = restoreNoteVersion(withV3, 1, T3);

    expect(restored.content).toBe("v2");
    expect(restored.versions).toEqual([
      { timestamp: T1, content: "v1" },
      { timestamp: T2, content: "v2" },
      { timestamp: T3, content: "v3" },
    ]);
  });

  it("no crea una versión si el contenido restaurado es el actual", () => {
    const note = createNote({ id: "nota-1", title: "Nota", content: "v1" }, T0);
    const updated = updateNoteContent(note, "v2", T1);
    const restored = restoreNoteVersion(updated, 0, T2);

    const restoredAgain = restoreNoteVersion(restored, 0, T3);

    expect(restoredAgain).toBe(restored);
  });

  it("lanza RangeError si la versión no existe", () => {
    const note = createNote({ id: "nota-1", title: "Nota", content: "v1" }, T0);

    expect(() => restoreNoteVersion(note, 0, T1)).toThrow(RangeError);
    expect(() => restoreNoteVersion(note, -1, T1)).toThrow(RangeError);
  });

  it("no muta la nota original al restaurar", () => {
    const note = createNote({ id: "nota-1", title: "Nota", content: "v1" }, T0);
    const updated = updateNoteContent(note, "v2", T1);

    restoreNoteVersion(updated, 0, T2);

    expect(updated.content).toBe("v2");
    expect(updated.versions).toEqual([{ timestamp: T1, content: "v1" }]);
  });
});
