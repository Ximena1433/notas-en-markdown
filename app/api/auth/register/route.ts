import { NextResponse } from "next/server";
import { parseCredentials } from "@/lib/auth/credentials";
import { isStrongPassword } from "@/lib/auth/password-policy";
import { clientIp, jsonError, readJsonBody, requireSameOrigin } from "@/lib/auth/http";
import { accountLimiter, ipLimiter } from "@/lib/auth/limits";
import { setSessionCookie } from "@/lib/auth/session";
import { createSession, registerUser } from "@/lib/auth/store";

export async function POST(req: Request) {
  const originError = requireSameOrigin(req);
  if (originError) return originError;

  const body = await readJsonBody(req);
  const credentials = parseCredentials(body);
  if (credentials === null || !isStrongPassword(credentials.password)) {
    return jsonError("Correo inválido o contraseña demasiado débil.", 400);
  }
  if (!ipLimiter.check(clientIp(req)) || !accountLimiter.check(credentials.email)) {
    return jsonError("Demasiados intentos. Inténtalo más tarde.", 429);
  }

  try {
    const result = await registerUser(credentials);
    if (!result.ok) {
      return jsonError("No se pudo crear la cuenta.", 400);
    }
    const token = await createSession(result.user.id);
    await setSessionCookie(token);
    return NextResponse.json({ user: result.user }, { status: 201 });
  } catch {
    return jsonError("No se pudo crear la cuenta.", 500);
  }
}
