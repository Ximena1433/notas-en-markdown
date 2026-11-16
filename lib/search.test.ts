import { describe, expect, it } from "vitest";
import type { Note } from "./notes";
import { searchNotes } from "./search";

const T1 = "2026-11-14T09:00:00.000Z";
const T2 = "2026-11-14T10:00:00.000Z";
const T3 = "2026-11-14T11:00:00.000Z";

interface NoteFixture {
  id: string;
  title: string;
  content?: string;
  tags?: string[];
  updatedAt: string;
}

function makeNote(fixture: NoteFixture): Note {
  return {
    id: fixture.id,
    title: fixture.title,
    content: fixture.content ?? "",
    tags: fixture.tags ?? [],
    updatedAt: fixture.updatedAt,
    versions: [],
  };
}

const reactNote = makeNote({
  id: "react",
  title: "Introducción a React",
  content: "Hooks y estado",
  tags: ["frontend", "react"],
  updatedAt: T2,
});

const markdownNote = makeNote({
  id: "markdown",
  title: "Guía Markdown",
  content: "Aprende a escribir contenido con REACT",
  tags: ["docs"],
  updatedAt: T3,
});

const ideasNote = makeNote({
  id: "ideas",
  title: "Ideas sueltas",
  content: "Notas para el futuro",
  tags: ["ideas", "react"],
  updatedAt: T1,
});

const notes = [reactNote, markdownNote, ideasNote];

describe("searchNotes", () => {
  it("busca en el título sin distinguir mayúsculas", () => {
    const result = searchNotes(notes, { text: "INTRODUCCIÓN" });

    expect(result.map((note) => note.id)).toEqual(["react"]);
  });

  it("busca en el contenido sin distinguir mayúsculas", () => {
    const result = searchNotes(notes, { text: "react" });

    expect(result.map((note) => note.id)).toEqual(["markdown", "react"]);
  });

  it("ignora espacios alrededor del texto de búsqueda", () => {
    const result = searchNotes(notes, { text: "  hooks  " });

    expect(result.map((note) => note.id)).toEqual(["react"]);
  });

  it("devuelve todas las notas si el texto está vacío", () => {
    const result = searchNotes(notes, { text: "   " });

    expect(result.map((note) => note.id)).toEqual(["markdown", "react", "ideas"]);
  });

  it("devuelve una lista vacía si el texto no coincide", () => {
    const result = searchNotes(notes, { text: "inexistente" });

    expect(result).toEqual([]);
  });

  it("filtra por una etiqueta", () => {
    const result = searchNotes(notes, { tags: ["docs"] });

    expect(result.map((note) => note.id)).toEqual(["markdown"]);
  });

  it("normaliza mayúsculas y espacios de las etiquetas", () => {
    const result = searchNotes(notes, { tags: [" REACT "] });

    expect(result.map((note) => note.id)).toEqual(["react", "ideas"]);
  });

  it("exige todas las etiquetas seleccionadas", () => {
    const result = searchNotes(notes, { tags: ["react", "frontend"] });

    expect(result.map((note) => note.id)).toEqual(["react"]);
  });

  it("trata una lista de etiquetas vacía como sin filtro", () => {
    const result = searchNotes(notes, { tags: [] });

    expect(result.map((note) => note.id)).toEqual(["markdown", "react", "ideas"]);
  });

  it("devuelve una lista vacía si la etiqueta no existe", () => {
    const result = searchNotes(notes, { tags: ["inexistente"] });

    expect(result).toEqual([]);
  });

  it("combina el filtro de texto y etiquetas", () => {
    const result = searchNotes(notes, { text: "react", tags: ["docs"] });

    expect(result.map((note) => note.id)).toEqual(["markdown"]);
  });

  it("ordena por fecha de actualización descendente sin filtros", () => {
    const result = searchNotes(notes);

    expect(result.map((note) => note.id)).toEqual(["markdown", "react", "ideas"]);
  });

  it("mantiene el orden original cuando las fechas empatan", () => {
    const first = makeNote({ id: "first", title: "A", updatedAt: T1 });
    const second = makeNote({ id: "second", title: "B", updatedAt: T1 });

    const result = searchNotes([first, second]);

    expect(result.map((note) => note.id)).toEqual(["first", "second"]);
  });

  it("devuelve una lista vacía si no hay notas", () => {
    const result = searchNotes([]);

    expect(result).toEqual([]);
  });

  it("no muta ni reordena el array original", () => {
    const original = [ideasNote, reactNote, markdownNote];
    const originalIds = original.map((note) => note.id);

    searchNotes(original, { text: "react" });

    expect(original.map((note) => note.id)).toEqual(originalIds);
  });
});
