import { describe, expect, it } from "vitest";
import { createNote } from "./notes";
import { MarkdownError, noteFromMarkdown, noteToMarkdown, notesFromMarkdown, notesToMarkdown } from "./storage";

const T0 = "2026-11-14T09:00:00.000Z";

describe("markdown lote", () => {
  it("exporta e importa un lote completo", () => {
    const notes = [
      createNote({ id: "a", title: "A", content: "uno", tags: ["t"] }, T0),
      createNote({ id: "b", title: "B", content: "dos" }, T0),
    ];
    const md = notesToMarkdown(notes);
    expect(notesFromMarkdown(md)).toEqual(notes);
  });

  it("roundtrip de una nota", () => {
    const note = createNote({ id: "a", title: "A", content: "c" }, T0);
    expect(noteFromMarkdown(noteToMarkdown(note))).toEqual(note);
  });

  it("lanza con markdown inválido", () => {
    expect(() => noteFromMarkdown("invalido")).toThrow(MarkdownError);
  });

  it("devuelve vacío para lote vacío", () => {
    expect(notesToMarkdown([])).toBe("");
    expect(notesFromMarkdown("")).toEqual([]);
  });
});
