import { pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { isAcceptablePassword } from "./password-policy";

const deriveKey = promisify(pbkdf2);

const ITERATIONS = 210_000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface Credentials {
  email: string;
  password: string;
}

export interface PasswordRecord {
  salt: string;
  hash: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length === 0 || email.length > MAX_EMAIL_LENGTH) return null;
  if (!EMAIL_PATTERN.test(email)) return null;
  return email;
}

export function parseCredentials(body: unknown): Credentials | null {
  if (!isRecord(body)) return null;
  const email = normalizeEmail(body.email);
  const password = body.password;
  if (email === null || !isAcceptablePassword(password)) return null;
  return { email, password };
}

export async function hashPassword(password: string): Promise<PasswordRecord> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await deriveKey(password, salt, ITERATIONS, KEY_LENGTH, "sha256");
  return { salt: salt.toString("hex"), hash: Buffer.from(derived).toString("hex") };
}

export async function verifyPassword(password: string, record: PasswordRecord): Promise<boolean> {
  const salt = Buffer.from(record.salt, "hex");
  const expected = Buffer.from(record.hash, "hex");
  if (salt.length !== SALT_LENGTH || expected.length !== KEY_LENGTH) return false;
  const derived = await deriveKey(password, salt, ITERATIONS, KEY_LENGTH, "sha256");
  return timingSafeEqual(Buffer.from(derived), expected);
}
