"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DRAFT_KEY } from "@/lib/useNotesState";

interface SessionState {
  email: string | null;
  loading: boolean;
}

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

export default function SessionMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<SessionState>({ email: null, loading: true });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data: unknown = res.ok ? await res.json() : null;
        const email =
          isRecord(data) && isRecord(data.user) && typeof data.user.email === "string"
            ? data.user.email
            : null;
        if (!cancelled) setSession({ email, loading: false });
      } catch {
        if (!cancelled) setSession({ email: null, loading: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      clearLocalDraft();
      setSession({ email: null, loading: false });
      router.replace("/login");
      router.refresh();
    } catch {
      return;
    }
  }

  if (session.loading) {
    return <span className="text-sm text-zinc-500 dark:text-zinc-400">Sesión...</span>;
  }

  if (session.email === null) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center rounded-lg border border-blue-700 px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 dark:border-blue-400 dark:text-blue-300 dark:hover:bg-blue-950 dark:focus-visible:ring-blue-300"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/registro"
          className="inline-flex min-h-11 items-center rounded-lg border border-blue-700 px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 dark:border-blue-400 dark:text-blue-300 dark:hover:bg-blue-950 dark:focus-visible:ring-blue-300"
        >
          Registro
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="max-w-56 truncate text-sm text-zinc-700 dark:text-zinc-300" title={session.email}>
        {session.email}
      </span>
      <button
        type="button"
        onClick={() => void handleLogout()}
        className="inline-flex min-h-11 items-center rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950 dark:focus-visible:ring-red-300"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
