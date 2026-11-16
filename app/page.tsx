import NoteApp from "@/components/NoteApp";
import type { Note } from "@/lib/notes";

const INITIAL_NOTES: Note[] = [
  {
    id: "bienvenida",
    title: "Bienvenida",
    content: `# Bienvenida

Esta es una **vista previa** en vivo del contenido Markdown.

## Primeros pasos

- Escribe en el panel del editor
- Cambia entre Editor y Vista previa
- Restaura una versión desde el historial
`,
    tags: ["ideas", "markdown"],
    updatedAt: "2026-11-14T12:00:00.000Z",
    versions: [
      {
        timestamp: "2026-11-14T10:00:00.000Z",
        content: "# Bienvenida\n\nVersión inicial de la nota.",
      },
    ],
  },
  {
    id: "atajos",
    title: "Atajos de Markdown",
    content: `# Atajos de Markdown

## Énfasis

Usa \`**texto**\` para negrita y \`*texto*\` para cursiva.

## Listas

- Elemento uno
- Elemento dos
`,
    tags: ["docs", "markdown"],
    updatedAt: "2026-11-14T11:00:00.000Z",
    versions: [],
  },
  {
    id: "pendientes",
    title: "Pendientes",
    content: `# Pendientes

- Revisar etiquetas
- Probar la búsqueda
- Organizar las notas
`,
    tags: ["ideas"],
    updatedAt: "2026-11-14T09:00:00.000Z",
    versions: [],
  },
];

export default function Home() {
  return <NoteApp initialNotes={INITIAL_NOTES} />;
}
