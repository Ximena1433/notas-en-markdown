import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import SessionMenu from "@/components/SessionMenu";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Notas en Markdown",
    template: "%s | Notas en Markdown",
  },
  description:
    "Editor de notas Markdown con vista previa, etiquetas e historial de versiones.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        <nav className="border-b border-zinc-200 bg-white/90 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3">
            <Link href="/notas" className="text-sm font-semibold hover:underline">
              Notas
            </Link>
            <Link href="/versiones" className="text-sm font-semibold hover:underline">
              Versiones
            </Link>
            <Link href="/papelera" className="text-sm font-semibold hover:underline">
              Papelera
            </Link>
            <div className="ml-auto">
              <Suspense fallback={<span className="text-sm text-zinc-500 dark:text-zinc-400">Sesión...</span>}>
                <SessionMenu />
              </Suspense>
            </div>
          </div>
        </nav>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-zinc-200 px-4 py-4 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          Notas en Markdown con versiones - Firestore
        </footer>
      </body>
    </html>
  );
}
