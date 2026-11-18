import { Suspense } from "react";
import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

type SearchParams = Promise<{ next?: string | string[] }>;

function safeNext(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/api/") ||
    value.startsWith("/login") ||
    value.startsWith("/registro")
  ) {
    return "/notas";
  }
  return value;
}

async function LoginForm({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <AuthForm mode="login" nextPath={safeNext(params.next)} />;
}

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-md px-4 py-10">Cargando...</main>}>
      <LoginForm searchParams={searchParams} />
    </Suspense>
  );
}
