import { NextResponse } from "next/server";
import { getDb, NOTES_COLLECTION } from "@/lib/firebase/admin";
import { fromRecord, toRecord, type NoteRecord } from "@/lib/firebase/notes";
import {
  createNote,
  moveNoteToTrash,
  restoreNoteFromTrash,
  restoreNoteVersion,
  saveNoteVersion,
  updateNoteTags,
  updateNoteTitle,
  createNoteId,
  type Note,
} from "@/lib/notes";
import { notesFromMarkdown, notesToMarkdown } from "@/lib/storage";

function now(): string {
  return new Date().toISOString();
}

export async function listNotes(ownerId: string): Promise<NoteRecord[]> {
  const snap = await getDb().collection(NOTES_COLLECTION).where("ownerId", "==", ownerId).get();
  const notes: NoteRecord[] = [];
  for (const doc of snap.docs) {
    const rec = fromRecord(doc.data());
    if (rec && rec.ownerId === ownerId) notes.push(rec);
  }
  return notes;
}

export async function getNote(id: string, ownerId: string): Promise<NoteRecord | null> {
  const doc = await getDb().collection(NOTES_COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  const rec = fromRecord(doc.data());
  return rec && rec.ownerId === ownerId ? rec : null;
}

export async function putNote(note: Note, ownerId: string): Promise<void> {
  await getDb().collection(NOTES_COLLECTION).doc(note.id).set(toRecord(note, ownerId));
}

export async function putNewNote(note: Note, ownerId: string): Promise<Note> {
  const created: Note = { ...note, id: createNoteId() };
  await putNote(created, ownerId);
  return created;
}

export async function deleteNote(id: string, ownerId: string): Promise<void> {
  const note = await getNote(id, ownerId);
  if (note === null) return;
  await getDb().collection(NOTES_COLLECTION).doc(id).delete();
}

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string";
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound() {
  return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 });
}

export function ok(data: unknown, init?: number) {
  return NextResponse.json(data, { status: init ?? 200 });
}

export { now, createNote, moveNoteToTrash, restoreNoteFromTrash, restoreNoteVersion, saveNoteVersion, updateNoteTags, updateNoteTitle, notesFromMarkdown, notesToMarkdown };
