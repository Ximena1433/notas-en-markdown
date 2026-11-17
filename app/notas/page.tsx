import type { Metadata } from "next";
import NotesClient from "@/components/NotesClient";

export const metadata: Metadata = {
  title: "Notas",
};

export default function NotasPage() {
  return <NotesClient />;
}
