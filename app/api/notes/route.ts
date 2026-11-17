import { NextResponse } from "next/server";
import {
  badRequest,
  createNote,
  listNotes,
  now,
  ok,
  putNote,
  notesFromMarkdown,
  notesToMarkdown,
} from "@/lib/firebase/api";

export async function GET() {
  try {
    const notes = await listNotes();
    return ok(notes);
  } catch {
    return NextResponse.json({ error: "Error al leer notas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    if (typeof body !== "object" || body === null) {
      return badRequest("Solicitud inválida");
    }
    const b = body as Record<string, unknown>;

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
        await putNote(n);
      }
      return ok({ imported: imported.length });
    }

    if (b.action === "export") {
      const notes = await listNotes();
      return ok({ markdown: notesToMarkdown(notes) });
    }

    const title = typeof b.title === "string" && b.title.trim() ? b.title.trim() : "Nota sin título";
    const content = typeof b.content === "string" ? b.content : "";
    const tags = Array.isArray(b.tags) ? b.tags.filter((t): t is string => typeof t === "string") : [];
    const id = typeof b.id === "string" && b.id ? b.id : crypto.randomUUID();
    const note = createNote({ id, title, content, tags }, now());
    await putNote(note);
    return ok(note, 201);
  } catch {
    return NextResponse.json({ error: "Error al crear nota" }, { status: 500 });
  }
}
