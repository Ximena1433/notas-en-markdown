import { NextResponse } from "next/server";
import { createNoteId } from "@/lib/notes";
import { readJsonBody, requireApiUser } from "@/lib/auth/http";
import {
  badRequest,
  createNote,
  listNotes,
  now,
  ok,
  putNewNote,
  notesFromMarkdown,
  notesToMarkdown,
} from "@/lib/firebase/api";

export async function GET(req: Request) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  try {
    const notes = await listNotes(auth.user.id);
    return ok(notes);
  } catch {
    return NextResponse.json({ error: "Error al leer notas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  try {
    const b = await readJsonBody(req);
    if (b === null) {
      return badRequest("Solicitud inválida");
    }

    if (b.action === "import") {
      if (typeof b.markdown !== "string") {
        return badRequest("Markdown inválido");
      }
      let imported;
      try {
        imported = notesFromMarkdown(b.markdown);
      } catch {
        return badRequest("No se pudo importar el Markdown");
      }
      for (const n of imported) {
        await putNewNote(n, auth.user.id);
      }
      return ok({ imported: imported.length });
    }

    if (b.action === "export") {
      const notes = await listNotes(auth.user.id);
      return ok({ markdown: notesToMarkdown(notes) });
    }

    const title = typeof b.title === "string" && b.title.trim() ? b.title.trim() : "Nota sin título";
    const content = typeof b.content === "string" ? b.content : "";
    const tags = Array.isArray(b.tags) ? b.tags.filter((t): t is string => typeof t === "string") : [];
    const note = createNote({ id: createNoteId(), title, content, tags }, now());
    const created = await putNewNote(note, auth.user.id);
    return ok(created, 201);
  } catch {
    return NextResponse.json({ error: "Error al crear nota" }, { status: 500 });
  }
}
