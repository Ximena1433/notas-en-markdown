"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isStrongPassword, MIN_PASSWORD_LENGTH } from "@/lib/auth/password-policy";
import { DRAFT_KEY } from "@/lib/useNotesState";

interface AuthFormProps {
  mode: "login" | "register";
  nextPath: string;
}

const FIELD_CLASS =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:ring-blue-300";
const LABEL_CLASS = "block text-sm font-medium text-zinc-800 dark:text-zinc-200";
const BUTTON_CLASS =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-blue-700 bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-400 dark:bg-blue-400 dark:text-zinc-950 dark:hover:bg-blue-300";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clearLocalDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    return;
  }
}

async function readError(res: Response): Promise<string> {
  try {
    const data: unknown = await res.json();
    if (isRecord(data) && typeof data.error === "string") return data.error;
  } catch {
    return "No se pudo completar la solicitud.";
  }
  return "No se pudo completar la solicitud.";
}

export default function AuthForm({ mode, nextPath }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (isRegister && password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (isRegister && !isStrongPassword(password)) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres, con letras y números.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(isRegister ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError(await readError(res));
        return;
      }
      clearLocalDraft();
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 md:px-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {isRegister ? "Crear cuenta" : "Iniciar sesión"}
        </h1>
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
          {isRegister
            ? "Tus notas quedarán asociadas a tu cuenta."
            : "Accede a tus notas, etiquetas y versiones."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="email" className={LABEL_CLASS}>
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label htmlFor="password" className={LABEL_CLASS}>
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              maxLength={128}
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={FIELD_CLASS}
            />
            {isRegister ? (
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Mínimo {MIN_PASSWORD_LENGTH} caracteres, con letras y números.
              </p>
            ) : null}
          </div>
          {isRegister ? (
            <div>
              <label htmlFor="confirmation" className={LABEL_CLASS}>
                Confirmar contraseña
              </label>
              <input
                id="confirmation"
                name="confirmation"
                type="password"
                required
                maxLength={128}
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className={FIELD_CLASS}
              />
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={submitting} className={BUTTON_CLASS}>
            {submitting ? "Un momento..." : isRegister ? "Crear cuenta" : "Entrar"}
          </button>
        </form>

        <p className="mt-5 text-sm text-zinc-700 dark:text-zinc-300">
          {isRegister ? "¿Ya tienes cuenta?" : "¿Aún no tienes cuenta?"}{" "}
          <Link
            href={isRegister ? `/login?next=${encodeURIComponent(nextPath)}` : `/registro?next=${encodeURIComponent(nextPath)}`}
            className="font-medium text-blue-800 hover:underline dark:text-blue-300"
          >
            {isRegister ? "Inicia sesión" : "Regístrate"}
          </Link>
        </p>
      </div>
    </main>
  );
}
