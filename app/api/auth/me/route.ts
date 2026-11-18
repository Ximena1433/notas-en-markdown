import { NextResponse } from "next/server";
import { jsonError } from "@/lib/auth/http";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (user === null) return jsonError("No autenticado", 401);
    return NextResponse.json({ user });
  } catch {
    return jsonError("No se pudo consultar la sesión.", 500);
  }
}
