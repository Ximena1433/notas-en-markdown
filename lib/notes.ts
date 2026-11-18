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
  deletedAt: string | null;
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

function normalizeTags(tags: readonly string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const tag of tags) {
    const normalized = tag.trim();
    if (normalized === "") continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

export function createNote(input: CreateNoteInput, timestamp: string): Note {
  return {
    id: input.id,
    title: input.title,
    content: input.content ?? "",
    tags: normalizeTags(input.tags ?? []),
    updatedAt: timestamp,
    versions: [],
    deletedAt: null,
  };
}

export function updateNoteTitle<T extends Note>(note: T, title: string): T {
  const normalized = title.trim();
  if (normalized === "" || normalized === note.title) {
    return note;
  }
  return { ...note, title: normalized };
}

export function updateNoteTags<T extends Note>(note: T, tags: readonly string[]): T {
  const nextTags = normalizeTags(tags);
  if (
    nextTags.length === note.tags.length &&
    nextTags.every((tag, index) => tag === note.tags[index])
  ) {
    return note;
  }
  return { ...note, tags: nextTags };
}

export function saveNoteVersion<T extends Note>(note: T, timestamp: string): T {
  return {
    ...note,
    versions: [...note.versions, { timestamp, content: note.content }],
  };
}

export function restoreNoteVersion<T extends Note>(
  note: T,
  versionIndex: number,
  timestamp: string,
): T {
  const version = note.versions[versionIndex];
  if (version === undefined) {
    throw new RangeError(`La versión ${versionIndex} no existe`);
  }
  const restoredContent = version.content;
  return {
    ...note,
    content: restoredContent,
    updatedAt: timestamp,
    versions: [
      ...note.versions,
      { timestamp, content: note.content },
      { timestamp, content: restoredContent },
    ],
  };
}

export function moveNoteToTrash<T extends Note>(note: T, timestamp: string): T {
  if (note.deletedAt) {
    return note;
  }
  return { ...note, deletedAt: timestamp, updatedAt: timestamp };
}

export function restoreNoteFromTrash<T extends Note>(note: T, timestamp: string): T {
  if (!note.deletedAt) {
    return note;
  }
  return { ...note, deletedAt: null, updatedAt: timestamp };
}
