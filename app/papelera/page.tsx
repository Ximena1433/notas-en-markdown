import type { Metadata } from "next";
import PapeleraClient from "@/components/PapeleraClient";

export const metadata: Metadata = {
  title: "Papelera",
};

export default function PapeleraPage() {
  return <PapeleraClient />;
}
