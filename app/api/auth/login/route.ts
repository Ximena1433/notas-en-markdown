import { NextResponse } from "next/server";
import { hashPassword, parseCredentials } from "@/lib/auth/credentials";
import { clientIp, jsonError, readJsonBody, requireSameOrigin } from "@/lib/auth/http";
import { accountLimiter, ipLimiter } from "@/lib/auth/limits";
import { setSessionCookie } from "@/lib/auth/session";
import { createSession, loginUser } from "@/lib/auth/store";

export async function POST(req: Request) {
  const originError = requireSameOrigin(req);
  if (originError) return originError;

  const body = await readJsonBody(req);
  const credentials = parseCredentials(body);
  if (credentials === null) {
    return jsonError("Correo o contraseña incorrectos.", 401);
  }
  if (!ipLimiter.check(clientIp(req)) || !accountLimiter.check(credentials.email)) {
    return jsonError("Demasiados intentos. Inténtalo más tarde.", 429);
  }

  try {
    const result = await loginUser(credentials);
    if (!result.ok) {
      await hashPassword(credentials.password);
      return jsonError("Correo o contraseña incorrectos.", 401);
    }
    const token = await createSession(result.user.id);
    await setSessionCookie(token);
    return NextResponse.json({ user: result.user });
  } catch {
    return jsonError("No se pudo iniciar sesión.", 500);
  }
}
