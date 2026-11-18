import { NextResponse } from "next/server";
import { jsonError, requireSameOrigin } from "@/lib/auth/http";
import { clearSessionCookie, revokeCurrentSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  const originError = requireSameOrigin(req);
  if (originError) return originError;

  try {
    await revokeCurrentSession();
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("No se pudo cerrar la sesión.", 500);
  }
}
