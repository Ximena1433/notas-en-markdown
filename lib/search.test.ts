import { describe, expect, it } from "vitest";
import { createNote } from "./notes";
import { searchNotes } from "./search";

const T1 = "2026-11-14T09:00:00.000Z";
const T2 = "2026-11-14T10:00:00.000Z";

describe("searchNotes", () => {
  it("excluye notas en papelera por defecto", () => {
    const notes = [
      createNote({ id: "a", title: "A", content: "x" }, T1),
      { ...createNote({ id: "b", title: "B", content: "x" }, T2), deletedAt: T2 },
    ];
    expect(searchNotes(notes).map((n) => n.id)).toEqual(["a"]);
  });

  it("puede mostrar solo papelera", () => {
    const notes = [
      createNote({ id: "a", title: "A" }, T1),
      { ...createNote({ id: "b", title: "B" }, T2), deletedAt: T2 },
    ];
    expect(searchNotes(notes, { onlyTrashed: true }).map((n) => n.id)).toEqual(["b"]);
  });
});
