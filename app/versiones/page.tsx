import type { Metadata } from "next";
import VersionesClient from "@/components/VersionesClient";

export const metadata: Metadata = {
  title: "Versiones",
};

export default function VersionesPage() {
  return <VersionesClient />;
}
