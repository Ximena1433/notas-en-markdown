import { NextResponse } from "next/server";
import { getCurrentUser } from "./session";
import type { SessionUser } from "./store";

export type AuthorizedRequest = { ok: true; user: SessionUser } | { ok: false; response: NextResponse };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function readJsonBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await req.json();
    if (isRecord(value)) {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (origin === null) return true;
  try {
    return origin === new URL(req.url).origin;
  } catch {
    return false;
  }
}

export function requireSameOrigin(req: Request): NextResponse | null {
  if (isSameOrigin(req)) return null;
  return jsonError("Origen no permitido", 403);
}

export async function requireApiUser(req: Request): Promise<AuthorizedRequest> {
  const originError = requireSameOrigin(req);
  if (originError) return { ok: false, response: originError };
  const user = await getCurrentUser();
  if (user === null) return { ok: false, response: jsonError("No autenticado", 401) };
  return { ok: true, user };
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const candidate = forwarded?.split(",")[0]?.trim();
  return candidate && candidate.length <= 64 ? candidate : "local";
}
