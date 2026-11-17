import { Suspense } from "react";
import type { Metadata } from "next";
import NotesClient from "@/components/NotesClient";

export const metadata: Metadata = {
  title: "Nota",
};

async function NotaContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <NotesClient activeId={id} />;
}

export default function NotaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">Cargando nota...</p>
        </main>
      }
    >
      <NotaContent params={params} />
    </Suspense>
  );
}
