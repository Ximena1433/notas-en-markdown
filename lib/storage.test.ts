import { afterEach, describe, expect, it, vi } from "vitest";
import { createNote, updateNoteContent } from "./notes";
import {
  MarkdownError,
  STORAGE_KEY,
  StorageError,
  loadNotes,
  noteFromMarkdown,
  noteToMarkdown,
  notesFromMarkdown,
  notesToMarkdown,
  saveNotes,
  type StorageErrorCode,
} from "./storage";

const T0 = "2026-11-14T09:00:00.000Z";
const T1 = "2026-11-14T10:00:00.000Z";
const T2 = "2026-11-14T11:00:00.000Z";

function createMemoryStorage() {
  const values = new Map<string, string>();

  return {
    values,
    storage: {
      getItem(key: string): string | null {
        return values.get(key) ?? null;
      },
      setItem(key: string, value: string): void {
        values.set(key, value);
      },
    },
  };
}

function readStorageErrorCode(action: () => void): StorageErrorCode {
  try {
    action();
  } catch (error) {
    if (error instanceof StorageError) {
      return error.code;
    }

    throw error;
  }

  throw new Error("Se esperaba un StorageError");
}

const note = updateNoteContent(
  createNote(
    {
      id: "nota-1",
      title: "Primera nota",
      content: "v1",
      tags: ["ideas", "markdown"],
    },
    T0,
  ),
  "v2",
  T1,
);

const secondNote = createNote(
  {
    id: "nota-2",
    title: "Segunda nota",
    content: "# Contenido",
    tags: ["docs"],
  },
  T2,
);

const trickyNote = createNote(
  {
    id: "nota-3",
    title: "Nota con separadores",
    content: "Inicio\n---\n<!-- nota:5 -->\nFinal",
    tags: ["pruebas"],
  },
  T2,
);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("persistencia localStorage", () => {
  it("devuelve una lista vacía al cargar sin window (SSR)", () => {
    vi.stubGlobal("window", undefined);

    expect(loadNotes()).toEqual([]);
  });

  it("devuelve false al guardar sin window (SSR)", () => {
    vi.stubGlobal("window", undefined);

    expect(saveNotes([note])).toBe(false);
  });

  it("usa window.localStorage por defecto cuando existe window", () => {
    const { storage } = createMemoryStorage();
    vi.stubGlobal("window", { localStorage: storage });

    expect(saveNotes([note])).toBe(true);
    expect(loadNotes()).toEqual([note]);
  });

  it("guarda y recupera notas con su historial de versiones", () => {
    const { storage, values } = createMemoryStorage();

    expect(saveNotes([note, secondNote], storage)).toBe(true);

    expect(values.has(STORAGE_KEY)).toBe(true);
    expect(loadNotes(storage)).toEqual([note, secondNote]);
  });

  it("devuelve una lista vacía si no hay datos guardados", () => {
    const { storage } = createMemoryStorage();

    expect(loadNotes(storage)).toEqual([]);
  });

  it("lanza StorageError si el JSON guardado está corrupto", () => {
    const { storage } = createMemoryStorage();
    storage.setItem(STORAGE_KEY, "{esto no es json");

    expect(readStorageErrorCode(() => loadNotes(storage))).toBe("corrupt");
  });

  it("lanza StorageError si el esquema guardado no es válido", () => {
    const { storage } = createMemoryStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, notes: [{ id: 1 }] }),
    );

    expect(readStorageErrorCode(() => loadNotes(storage))).toBe("corrupt");
  });

  it("lanza StorageError si la versión del esquema no está soportada", () => {
    const { storage } = createMemoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, notes: [] }));

    expect(readStorageErrorCode(() => loadNotes(storage))).toBe("corrupt");
  });

  it("lanza StorageError si falla la lectura del almacenamiento", () => {
    const failingStorage = {
      getItem(): string | null {
        throw new Error("lectura bloqueada");
      },
      setItem(): void {},
    };

    expect(readStorageErrorCode(() => loadNotes(failingStorage))).toBe(
      "read-failed",
    );
  });

  it("lanza StorageError si falla la escritura del almacenamiento", () => {
    const failingStorage = {
      getItem(): string | null {
        return null;
      },
      setItem(): void {
        throw new Error("cuota superada");
      },
    };

    expect(readStorageErrorCode(() => saveNotes([note], failingStorage))).toBe(
      "write-failed",
    );
  });

  it("no muta las notas al guardarlas", () => {
    const { storage } = createMemoryStorage();
    const notes = [note, secondNote];
    const before = structuredClone(notes);

    saveNotes(notes, storage);

    expect(notes).toEqual(before);
  });
});

describe("exportar e importar Markdown", () => {
  it("exporta e importa una nota completa", () => {
    const markdown = noteToMarkdown(note);

    expect(markdown).toContain("Primera nota");
    expect(markdown).toContain("v2");
    expect(noteFromMarkdown(markdown)).toEqual(note);
  });

  it("conserva contenido con separadores y front matter aparente", () => {
    const markdown = noteToMarkdown(trickyNote);

    expect(noteFromMarkdown(markdown)).toEqual(trickyNote);
  });

  it("exporta e importa un lote de notas", () => {
    const markdown = notesToMarkdown([note, secondNote, trickyNote]);

    expect(notesFromMarkdown(markdown)).toEqual([
      note,
      secondNote,
      trickyNote,
    ]);
  });

  it("devuelve una lista vacía para un lote vacío", () => {
    expect(notesToMarkdown([])).toBe("");
    expect(notesFromMarkdown("")).toEqual([]);
    expect(notesFromMarkdown("   \n  ")).toEqual([]);
  });

  it("lanza MarkdownError si falta el front matter", () => {
    expect(() => noteFromMarkdown("# Solo contenido")).toThrow(MarkdownError);
  });

  it("lanza MarkdownError si el front matter está corrupto", () => {
    expect(() => noteFromMarkdown("---\n{no-json}\n---\n\nContenido")).toThrow(
      MarkdownError,
    );
  });

  it("lanza MarkdownError si los metadatos no describen una nota", () => {
    expect(() => noteFromMarkdown("---\n{}\n---\n\nContenido")).toThrow(
      MarkdownError,
    );
  });

  it("lanza MarkdownError si el lote no tiene cabeceras válidas", () => {
    expect(() => notesFromMarkdown("texto sin cabecera")).toThrow(MarkdownError);
    expect(() => notesFromMarkdown("<!-- nota:12 -->\n---\n{}\n---\n")).toThrow(
      MarkdownError,
    );
  });
});
