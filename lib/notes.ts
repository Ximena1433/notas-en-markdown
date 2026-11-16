export const DEFAULT_NOTE_TITLE = "Nota sin título";

export interface NoteVersion {
  timestamp: string;
  content: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
  versions: NoteVersion[];
}

export interface CreateNoteInput {
  id: string;
  title: string;
  content?: string;
  tags?: string[];
}

export function createNoteId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `nota-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createNote(input: CreateNoteInput, timestamp: string): Note {
  return {
    id: input.id,
    title: input.title,
    content: input.content ?? "",
    tags: [...(input.tags ?? [])],
    updatedAt: timestamp,
    versions: [],
  };
}

export function updateNoteTitle(note: Note, title: string): Note {
  const normalized = title.trim();

  if (normalized === "" || normalized === note.title) {
    return note;
  }

  return { ...note, title: normalized };
}

export function updateNoteContent(
  note: Note,
  content: string,
  timestamp: string,
): Note {
  if (note.content === content) {
    return note;
  }

  return {
    ...note,
    content,
    updatedAt: timestamp,
    versions: [...note.versions, { timestamp, content: note.content }],
  };
}

export function saveNoteVersion(note: Note, timestamp: string): Note {
  return {
    ...note,
    versions: [...note.versions, { timestamp, content: note.content }],
  };
}

export function restoreNoteVersion(
  note: Note,
  versionIndex: number,
  timestamp: string,
): Note {
  const version = note.versions[versionIndex];

  if (version === undefined) {
    throw new RangeError(`La versión ${versionIndex} no existe`);
  }

  if (version.content === note.content) {
    return note;
  }

  return {
    ...note,
    content: version.content,
    updatedAt: timestamp,
    versions: [...note.versions, { timestamp, content: note.content }],
  };
}
