import { NextResponse } from "next/server";
import { readJsonBody, requireApiUser } from "@/lib/auth/http";
import {
  badRequest,
  deleteNote,
  getNote,
  moveNoteToTrash,
  notFound,
  now,
  ok,
  putNote,
  restoreNoteFromTrash,
  restoreNoteVersion,
  saveNoteVersion,
  updateNoteTags,
  updateNoteTitle,
} from "@/lib/firebase/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await ctx.params;
    const note = await getNote(id, auth.user.id);
    if (!note) return notFound();
    return ok(note);
  } catch {
    return NextResponse.json({ error: "Error al leer nota" }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await ctx.params;
    const note = await getNote(id, auth.user.id);
    if (!note) return notFound();
    const b = await readJsonBody(req);
    if (b === null) return badRequest("Solicitud inválida");
    let updated = note;

    if (b.action === "trash") {
      updated = moveNoteToTrash(updated, now());
    } else if (b.action === "restore-trash") {
      updated = restoreNoteFromTrash(updated, now());
    } else if (b.action === "save-version") {
      updated = saveNoteVersion(updated, now());
    } else if (b.action === "restore-version") {
      if (typeof b.versionIndex !== "number") return badRequest("Índice inválido");
      try {
        updated = restoreNoteVersion(updated, b.versionIndex, now());
      } catch {
        return badRequest("Versión no encontrada");
      }
    } else {
      if (typeof b.title === "string") {
        updated = updateNoteTitle(updated, b.title);
      }
      if (Array.isArray(b.tags)) {
        updated = updateNoteTags(updated, b.tags.filter((t): t is string => typeof t === "string"));
      }
      if (typeof b.content === "string") {
        updated = { ...updated, content: b.content, updatedAt: now() };
      }
    }

    await putNote(updated, auth.user.id);
    return ok(updated);
  } catch {
    return NextResponse.json({ error: "Error al actualizar nota" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const auth = await requireApiUser(req);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await ctx.params;
    await deleteNote(id, auth.user.id);
    return ok({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar nota" }, { status: 500 });
  }
}
