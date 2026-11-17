import type { Note, NoteVersion } from "../notes";

export type NoteRecord = Note & { deletedAt: string | null };

export function toRecord(note: Note): NoteRecord {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    tags: [...note.tags],
    updatedAt: note.updatedAt,
    deletedAt: note.deletedAt ?? null,
    versions: note.versions.map((v: NoteVersion) => ({
      timestamp: v.timestamp,
      content: v.content,
    })),
  };
}

export function fromRecord(data: unknown): NoteRecord | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const r = data as Record<string, unknown>;
  if (
    typeof r.id !== "string" ||
    typeof r.title !== "string" ||
    typeof r.content !== "string" ||
    typeof r.updatedAt !== "string" ||
    !Array.isArray(r.tags) ||
    !Array.isArray(r.versions)
  ) {
    return null;
  }

  const tags = r.tags.filter((t): t is string => typeof t === "string");
  const versions: NoteVersion[] = [];
  for (const v of r.versions) {
    if (
      typeof v === "object" &&
      v !== null &&
      typeof (v as Record<string, unknown>).timestamp === "string" &&
      typeof (v as Record<string, unknown>).content === "string"
    ) {
      versions.push({
        timestamp: (v as Record<string, unknown>).timestamp as string,
        content: (v as Record<string, unknown>).content as string,
      });
    }
  }

  const deletedAt =
    typeof r.deletedAt === "string" ? r.deletedAt : r.deletedAt === null ? null : null;

  return {
    id: r.id,
    title: r.title,
    content: r.content,
    tags,
    updatedAt: r.updatedAt,
    deletedAt,
    versions,
  };
}
