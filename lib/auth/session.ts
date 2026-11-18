import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./constants";
import {
  findSessionUser,
  revokeSession,
  SESSION_MAX_AGE_SECONDS,
  type SessionUser,
} from "./store";

export { SESSION_COOKIE };

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

export async function setSessionCookie(token: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, COOKIE_OPTIONS);
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return findSessionUser(token);
}

export async function revokeCurrentSession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    await revokeSession(token);
  }
}
