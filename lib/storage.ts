import type { Note, NoteVersion } from "./notes";

export const STORAGE_KEY = "notas-en-markdown:v1";

const SCHEMA_VERSION = 1;
const FRONT_MATTER_DELIMITER = "---";
const NOTE_BLOCK_PREFIX = "<!-- nota:";
const NOTE_BLOCK_SUFFIX = " -->";

export type StorageErrorCode = "corrupt" | "read-failed" | "write-failed";

export class StorageError extends Error {
  readonly code: StorageErrorCode;

  constructor(code: StorageErrorCode, message: string) {
    super(message);
    this.name = "StorageError";
    this.code = code;
  }
}

export class MarkdownError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MarkdownError";
  }
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

type NoteMetadata = Omit<Note, "content">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item: unknown) => typeof item === "string")
  );
}

function isNoteVersion(value: unknown): value is NoteVersion {
  return (
    isRecord(value) &&
    typeof value.timestamp === "string" &&
    typeof value.content === "string"
  );
}

function isNoteVersionArray(value: unknown): value is NoteVersion[] {
  return (
    Array.isArray(value) &&
    value.every((item: unknown) => isNoteVersion(item))
  );
}

function isNoteMetadata(value: unknown): value is NoteMetadata {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.updatedAt === "string" &&
    isStringArray(value.tags) &&
    isNoteVersionArray(value.versions)
  );
}

function isNote(value: unknown): value is Note {
  if (!isRecord(value)) {
    return false;
  }

  const deletedAtOk = value.deletedAt === undefined || value.deletedAt === null || typeof value.deletedAt === "string";

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.content === "string" &&
    typeof value.updatedAt === "string" &&
    isStringArray(value.tags) &&
    isNoteVersionArray(value.versions) &&
    deletedAtOk
  );
}

function toNoteMetadata(note: Note): NoteMetadata {
  return {
    id: note.id,
    title: note.title,
    tags: [...note.tags],
    updatedAt: note.updatedAt,
    deletedAt: note.deletedAt ?? null,
    versions: note.versions.map((version) => ({
      timestamp: version.timestamp,
      content: version.content,
    })),
  };
}

function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function resolveStorage(storage?: StorageLike | null): StorageLike | null {
  return storage === undefined ? getBrowserStorage() : storage;
}

function parseStoredNotes(raw: string): Note[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new StorageError("corrupt", "El JSON guardado está corrupto");
  }

  if (!isRecord(parsed) || parsed.version !== SCHEMA_VERSION) {
    throw new StorageError("corrupt", "El esquema guardado no es válido");
  }

  const notesValue: unknown = parsed.notes;

  if (!Array.isArray(notesValue)) {
    throw new StorageError("corrupt", "El esquema guardado no es válido");
  }

  return notesValue.map((item: unknown): Note => {
    if (!isNote(item)) {
      throw new StorageError("corrupt", "Una nota guardada no es válida");
    }

    return item;
  });
}

export function loadNotes(storage?: StorageLike | null): Note[] {
  const target = resolveStorage(storage);

  if (target === null) {
    return [];
  }

  let raw: string | null;

  try {
    raw = target.getItem(STORAGE_KEY);
  } catch {
    throw new StorageError("read-failed", "No se pudieron cargar las notas");
  }

  if (raw === null) {
    return [];
  }

  return parseStoredNotes(raw);
}

export function saveNotes(
  notes: readonly Note[],
  storage?: StorageLike | null,
): boolean {
  const target = resolveStorage(storage);

  if (target === null) {
    return false;
  }

  try {
    target.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: SCHEMA_VERSION, notes }),
    );
  } catch {
    throw new StorageError("write-failed", "No se pudieron guardar las notas");
  }

  return true;
}

function parseFrontMatter(markdown: string): {
  metadata: string;
  content: string;
} {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  if (lines[0] !== FRONT_MATTER_DELIMITER) {
    throw new MarkdownError("Falta el front matter de la nota");
  }

  const closingIndex = lines.indexOf(FRONT_MATTER_DELIMITER, 1);

  if (closingIndex === -1) {
    throw new MarkdownError("El front matter de la nota no está cerrado");
  }

  const contentLines = lines.slice(closingIndex + 1);

  if (contentLines[0] === "") {
    contentLines.shift();
  }

  return {
    metadata: lines.slice(1, closingIndex).join("\n"),
    content: contentLines.join("\n"),
  };
}

function parseNoteMetadata(metadata: string): NoteMetadata {
  let parsed: unknown;

  try {
    parsed = JSON.parse(metadata);
  } catch {
    throw new MarkdownError("El front matter no contiene JSON válido");
  }

  if (!isNoteMetadata(parsed)) {
    throw new MarkdownError("El front matter no describe una nota válida");
  }

  return parsed;
}

export function noteToMarkdown(note: Note): string {
  return `---\n${JSON.stringify(toNoteMetadata(note))}\n---\n\n${note.content}`;
}

export function noteFromMarkdown(markdown: string): Note {
  const { metadata, content } = parseFrontMatter(markdown);

  return { ...parseNoteMetadata(metadata), content };
}

function skipWhitespace(value: string, start: number): number {
  let index = start;

  while (index < value.length && /\s/.test(value.charAt(index))) {
    index += 1;
  }

  return index;
}

export function notesToMarkdown(notes: readonly Note[]): string {
  return notes
    .map((note) => {
      const markdown = noteToMarkdown(note);

      return `${NOTE_BLOCK_PREFIX}${markdown.length}${NOTE_BLOCK_SUFFIX}\n${markdown}`;
    })
    .join("\n\n");
}

interface ParsedNoteBlock {
  note: Note;
  nextIndex: number;
}

function parseNoteBlock(markdown: string, start: number): ParsedNoteBlock {
  const headerStart = markdown.indexOf(NOTE_BLOCK_PREFIX, start);

  if (headerStart !== start) {
    throw new MarkdownError("Cabecera de nota no reconocida");
  }

  const headerEnd = markdown.indexOf(
    NOTE_BLOCK_SUFFIX,
    headerStart + NOTE_BLOCK_PREFIX.length,
  );

  if (headerEnd === -1) {
    throw new MarkdownError("Cabecera de nota incompleta");
  }

  const lengthText = markdown.slice(
    headerStart + NOTE_BLOCK_PREFIX.length,
    headerEnd,
  );
  const documentLength = Number(lengthText);

  if (!Number.isInteger(documentLength) || documentLength < 0) {
    throw new MarkdownError("Longitud de nota inválida");
  }

  const headerEndWithSuffix = headerEnd + NOTE_BLOCK_SUFFIX.length;

  if (markdown.charAt(headerEndWithSuffix) !== "\n") {
    throw new MarkdownError("Falta el salto de línea tras la cabecera");
  }

  const documentStart = headerEndWithSuffix + 1;
  const documentEnd = documentStart + documentLength;

  if (documentEnd > markdown.length) {
    throw new MarkdownError("La nota excede el contenido disponible");
  }

  return {
    note: noteFromMarkdown(markdown.slice(documentStart, documentEnd)),
    nextIndex: documentEnd,
  };
}

export function notesFromMarkdown(markdown: string): Note[] {
  const normalized = markdown.replace(/\r\n/g, "\n");

  if (normalized.trim() === "") {
    return [];
  }

  const notes: Note[] = [];
  let index = 0;

  while (index < normalized.length) {
    index = skipWhitespace(normalized, index);

    if (index >= normalized.length) {
      break;
    }

    const block = parseNoteBlock(normalized, index);
    notes.push(block.note);
    index = block.nextIndex;
  }

  return notes;
}
