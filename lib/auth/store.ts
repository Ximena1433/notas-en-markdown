import { createHash, randomBytes } from "node:crypto";
import { getDb, NOTES_COLLECTION } from "@/lib/firebase/admin";
import { hashPassword, verifyPassword, type Credentials, type PasswordRecord } from "./credentials";

const USERS_COLLECTION = "users";
const SESSIONS_COLLECTION = "sessions";
const SYSTEM_COLLECTION = "system";
const CLAIM_DOC = "notes-owner-claim";

export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export interface SessionUser {
  id: string;
  email: string;
}

export type RegisterResult = { ok: true; user: SessionUser } | { ok: false; reason: "existing" | "error" };
export type LoginResult = { ok: true; user: SessionUser } | { ok: false };

interface UserRecord extends PasswordRecord, SessionUser {
  createdAt: string;
}

interface SessionRecord {
  userId: string;
  expiresAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function userIdForEmail(email: string): string {
  return sha256(email);
}

function parseUser(value: unknown): UserRecord | null {
  if (!isRecord(value)) return null;
  const { id, email, salt, hash, createdAt } = value;
  if (
    typeof id !== "string" ||
    typeof email !== "string" ||
    typeof salt !== "string" ||
    typeof hash !== "string" ||
    typeof createdAt !== "string"
  ) {
    return null;
  }
  return { id, email, salt, hash, createdAt };
}

function parseSession(value: unknown): SessionRecord | null {
  if (!isRecord(value)) return null;
  const { userId, expiresAt } = value;
  if (typeof userId !== "string" || typeof expiresAt !== "string") return null;
  if (!Number.isFinite(Date.parse(expiresAt))) return null;
  return { userId, expiresAt };
}

async function claimUnownedNotes(userId: string): Promise<void> {
  const db = getDb();
  const lock = db.collection(SYSTEM_COLLECTION).doc(CLAIM_DOC);
  try {
    await lock.create({ userId, createdAt: new Date().toISOString() });
  } catch {
    return;
  }

  try {
    const snapshot = await db.collection(NOTES_COLLECTION).get();
    const unowned = snapshot.docs.filter((doc) => {
      const data: unknown = doc.data();
      return isRecord(data) && (data.ownerId === undefined || data.ownerId === null);
    });
    for (let index = 0; index < unowned.length; index += 400) {
      const batch = db.batch();
      for (const doc of unowned.slice(index, index + 400)) {
        batch.update(doc.ref, { ownerId: userId });
      }
      await batch.commit();
    }
  } catch {
    await lock.delete().catch(() => undefined);
  }
}

export async function registerUser(credentials: Credentials): Promise<RegisterResult> {
  const db = getDb();
  const id = userIdForEmail(credentials.email);
  const ref = db.collection(USERS_COLLECTION).doc(id);
  const users = await db.collection(USERS_COLLECTION).limit(2).get();
  const isFirstUser = users.empty;
  const password = await hashPassword(credentials.password);
  const user: UserRecord = {
    id,
    email: credentials.email,
    salt: password.salt,
    hash: password.hash,
    createdAt: new Date().toISOString(),
  };

  try {
    await ref.create(user);
  } catch {
    return { ok: false, reason: "existing" };
  }

  if (isFirstUser) {
    await claimUnownedNotes(id);
  }
  return { ok: true, user: { id: user.id, email: user.email } };
}

export async function loginUser(credentials: Credentials): Promise<LoginResult> {
  const db = getDb();
  const ref = db.collection(USERS_COLLECTION).doc(userIdForEmail(credentials.email));
  const snapshot = await ref.get();
  if (!snapshot.exists) return { ok: false };
  const user = parseUser(snapshot.data());
  if (user === null) return { ok: false };
  const valid = await verifyPassword(credentials.password, { salt: user.salt, hash: user.hash });
  if (!valid) return { ok: false };
  return { ok: true, user: { id: user.id, email: user.email } };
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const createdAt = Date.now();
  await getDb()
    .collection(SESSIONS_COLLECTION)
    .doc(sha256(token))
    .set({
      userId,
      createdAt: new Date(createdAt).toISOString(),
      expiresAt: new Date(createdAt + SESSION_MAX_AGE_SECONDS * 1000).toISOString(),
    });
  return token;
}

export async function findSessionUser(token: string): Promise<SessionUser | null> {
  const ref = getDb().collection(SESSIONS_COLLECTION).doc(sha256(token));
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const session = parseSession(snapshot.data());
  if (session === null) return null;
  if (Date.parse(session.expiresAt) <= Date.now()) {
    await ref.delete().catch(() => undefined);
    return null;
  }
  const userSnapshot = await getDb().collection(USERS_COLLECTION).doc(session.userId).get();
  if (!userSnapshot.exists) return null;
  const user = parseUser(userSnapshot.data());
  return user === null ? null : { id: user.id, email: user.email };
}

export async function revokeSession(token: string): Promise<void> {
  await getDb().collection(SESSIONS_COLLECTION).doc(sha256(token)).delete().catch(() => undefined);
}
