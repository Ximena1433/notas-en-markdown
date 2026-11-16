import type { Note } from "./notes";

export interface NoteSearchFilters {
  text?: string;
  tags?: string[];
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeTags(tags: readonly string[]): string[] {
  return tags.map(normalize).filter((tag) => tag !== "");
}

function matchesText(note: Note, normalizedQuery: string): boolean {
  if (normalizedQuery === "") {
    return true;
  }

  return (
    note.title.toLowerCase().includes(normalizedQuery) ||
    note.content.toLowerCase().includes(normalizedQuery)
  );
}

function matchesAllTags(note: Note, normalizedTags: readonly string[]): boolean {
  if (normalizedTags.length === 0) {
    return true;
  }

  const noteTags = note.tags.map(normalize);

  return normalizedTags.every((tag) => noteTags.includes(tag));
}

function compareByUpdatedAtDesc(first: Note, second: Note): number {
  return Date.parse(second.updatedAt) - Date.parse(first.updatedAt);
}

export function searchNotes(
  notes: readonly Note[],
  filters: NoteSearchFilters = {},
): Note[] {
  const query = normalize(filters.text ?? "");
  const selectedTags = normalizeTags(filters.tags ?? []);

  return notes
    .filter(
      (note) => matchesText(note, query) && matchesAllTags(note, selectedTags),
    )
    .sort(compareByUpdatedAtDesc);
}
