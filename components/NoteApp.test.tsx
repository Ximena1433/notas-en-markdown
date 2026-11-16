import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";
import type { Note } from "../lib/notes";
import { loadNotes } from "../lib/storage";
import NoteApp from "./NoteApp";

const T0 = "2026-11-14T09:00:00.000Z";
const T1 = "2026-11-14T10:00:00.000Z";
const T2 = "2026-11-14T11:00:00.000Z";
const T3 = "2026-11-14T12:00:00.000Z";
const T4 = "2026-11-14T13:00:00.000Z";

const NOTES: Note[] = [
  {
    id: "react",
    title: "Introducción a React",
    content: "# React actual\n\nHooks y estado",
    tags: ["frontend", "react"],
    updatedAt: T2,
    versions: [{ timestamp: T0, content: "# React antiguo" }],
  },
  {
    id: "markdown",
    title: "Guía Markdown",
    content: "# Guía Markdown",
    tags: ["docs"],
    updatedAt: T3,
    versions: [],
  },
  {
    id: "ideas",
    title: "Ideas sueltas",
    content: "Notas para el futuro",
    tags: ["ideas", "react"],
    updatedAt: T1,
    versions: [],
  },
];

function renderNoteApp() {
  const onNow = vi.fn(() => T4);

  render(<NoteApp initialNotes={NOTES} now={onNow} />);

  return { onNow };
}

describe("NoteApp", () => {
  it("renderiza una estructura semántica con un solo landmark principal", () => {
    renderNoteApp();

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "Notas en Markdown" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("searchbox", { name: "Buscar notas" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Notas" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Título de la nota" }),
    ).toHaveValue("Guía Markdown");
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Editor de notas Markdown",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Historial de versiones" }),
    ).toBeInTheDocument();
  });

  it("filtra las notas por texto en título y contenido", async () => {
    const user = userEvent.setup();

    renderNoteApp();

    await user.type(
      screen.getByRole("searchbox", { name: "Buscar notas" }),
      "hooks",
    );

    const list = screen.getByTestId("note-list");

    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    expect(
      within(list).getByRole("button", { name: /Introducción a React/ }),
    ).toBeInTheDocument();
    expect(
      within(list).queryByRole("button", { name: /Guía Markdown/ }),
    ).not.toBeInTheDocument();
  });

  it("filtra por etiquetas con botones aria-pressed", async () => {
    const user = userEvent.setup();

    renderNoteApp();

    const reactTag = screen.getByRole("button", { name: "react" });

    expect(reactTag).toHaveAttribute("aria-pressed", "false");

    await user.click(reactTag);

    expect(reactTag).toHaveAttribute("aria-pressed", "true");

    const list = screen.getByTestId("note-list");

    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(
      within(list).getByRole("button", { name: /Introducción a React/ }),
    ).toBeInTheDocument();
    expect(
      within(list).getByRole("button", { name: /Ideas sueltas/ }),
    ).toBeInTheDocument();
    expect(
      within(list).queryByRole("button", { name: /Guía Markdown/ }),
    ).not.toBeInTheDocument();

    await user.click(reactTag);

    expect(reactTag).toHaveAttribute("aria-pressed", "false");
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
  });

  it("muestra un estado vacío cuando la búsqueda no tiene resultados", async () => {
    const user = userEvent.setup();

    renderNoteApp();

    await user.type(
      screen.getByRole("searchbox", { name: "Buscar notas" }),
      "inexistente",
    );

    expect(
      screen.getByText("No hay notas que coincidan con la búsqueda."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("note-list")).not.toBeInTheDocument();
  });

  it("selecciona una nota y actualiza el editor y el historial", async () => {
    const user = userEvent.setup();

    renderNoteApp();

    const textarea = screen.getByRole("textbox", {
      name: "Contenido Markdown",
    });

    expect(textarea).toHaveValue("# Guía Markdown");

    const reactButton = screen.getByRole("button", {
      name: /Introducción a React/,
    });

    await user.click(reactButton);

    expect(reactButton).toHaveAttribute("aria-current", "true");
    expect(textarea).toHaveValue("# React actual\n\nHooks y estado");
    expect(
      screen.getByRole("textbox", { name: "Título de la nota" }),
    ).toHaveValue("Introducción a React");
    expect(
      screen.getByRole("button", {
        name: "Restaurar versión del 14 nov 2026, 9:00",
      }),
    ).toBeInTheDocument();
  });

  it("crea una nota vacía, la selecciona en el editor y lo anuncia", async () => {
    const user = userEvent.setup();

    renderNoteApp();

    const list = screen.getByTestId("note-list");
    const createButton = screen.getByRole("button", { name: "Nueva nota" });

    expect(createButton.tagName).toBe("BUTTON");
    expect(createButton).toHaveAttribute("type", "button");
    expect(createButton).toHaveClass("min-h-11", "min-w-11");

    await user.click(createButton);

    expect(within(list).getAllByRole("listitem")).toHaveLength(4);

    const newNote = within(list).getByRole("button", {
      name: /Nota sin título/,
    });

    expect(newNote).toHaveAttribute("aria-current", "true");
    expect(
      screen.getByRole("textbox", { name: "Título de la nota" }),
    ).toHaveValue("Nota sin título");
    expect(
      screen.getByRole("textbox", { name: "Contenido Markdown" }),
    ).toHaveValue("");
    expect(screen.getByTestId("editor-panel")).toHaveFocus();

    const announcement = screen.getByTestId("note-announcement");

    expect(announcement).toHaveAttribute("role", "status");
    expect(announcement).toHaveAttribute("aria-live", "polite");
    expect(announcement).toHaveTextContent(
      "Se creó la nota «Nota sin título» y se abrió en el editor.",
    );
  });

  it("permite editar el título y lo conserva al salir del campo", async () => {
    const user = userEvent.setup();

    renderNoteApp();

    const titleInput = screen.getByRole("textbox", {
      name: "Título de la nota",
    });

    expect(titleInput).toHaveValue("Guía Markdown");

    await user.clear(titleInput);
    await user.type(titleInput, "  Mi guía personalizada  ");
    await user.tab();

    expect(titleInput).toHaveValue("Mi guía personalizada");
    expect(
      within(screen.getByTestId("note-list")).getByRole("button", {
        name: /Mi guía personalizada/,
      }),
    ).toHaveAttribute("aria-current", "true");
    expect(
      screen.queryByRole("button", { name: /Guía Markdown/ }),
    ).not.toBeInTheDocument();
  });

  it("persiste el título en localStorage entre montajes", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <NoteApp initialNotes={NOTES} now={() => T4} />,
    );

    const titleInput = screen.getByRole("textbox", {
      name: "Título de la nota",
    });

    await user.clear(titleInput);
    await user.type(titleInput, "Título persistente");
    await user.tab();

    await waitFor(() => {
      expect(loadNotes().find((note) => note.id === "markdown")?.title).toBe(
        "Título persistente",
      );
    });

    unmount();
    renderNoteApp();

    expect(
      await screen.findByDisplayValue("Título persistente"),
    ).toBeInTheDocument();
  });

  it("restaura una versión y actualiza el editor", async () => {
    const user = userEvent.setup();
    const { onNow } = renderNoteApp();

    await user.click(
      screen.getByRole("button", { name: /Introducción a React/ }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "Restaurar versión del 14 nov 2026, 9:00",
      }),
    );

    expect(onNow).toHaveBeenCalled();
    expect(
      screen.getByRole("textbox", { name: "Contenido Markdown" }),
    ).toHaveValue("# React antiguo");
    expect(
      within(screen.getByTestId("version-history")).getByRole("status"),
    ).toHaveTextContent("Se restauró la versión del 14 nov 2026, 9:00.");
    expect(
      screen.getByRole("button", {
        name: "Restaurar versión del 14 nov 2026, 13:00",
      }),
    ).toBeInTheDocument();
  });

  it("guarda la versión actual y permite verla desde el historial", async () => {
    const user = userEvent.setup();
    const { onNow } = renderNoteApp();

    const saveButton = screen.getByRole("button", {
      name: "Guardar versión actual de «Guía Markdown»",
    });

    expect(saveButton.tagName).toBe("BUTTON");
    expect(saveButton).toHaveAttribute("type", "button");

    await user.click(saveButton);

    expect(onNow).toHaveBeenCalled();

    const history = screen.getByTestId("version-history");

    expect(within(history).getByRole("status")).toHaveTextContent(
      "Se guardó la versión actual de la nota.",
    );

    await user.click(
      within(history).getByRole("button", {
        name: "Ver versión del 14 nov 2026, 13:00",
      }),
    );

    const preview = within(history).getByRole("region", {
      name: "Vista previa de la versión del 14 nov 2026, 13:00",
    });

    expect(
      within(preview).getByRole("heading", { name: "Guía Markdown" }),
    ).toBeInTheDocument();
  });

  it("alterna las pestañas móviles con clic y teclado", async () => {
    const user = userEvent.setup();

    renderNoteApp();

    const tablist = screen.getByRole("tablist", {
      name: "Vistas de la aplicación",
    });
    const notesTab = screen.getByRole("tab", { name: "Notas" });
    const editorTab = screen.getByRole("tab", { name: "Edición" });
    const notesPanel = screen.getByTestId("notes-panel");
    const editorPanel = screen.getByTestId("editor-panel");

    expect(tablist).toHaveClass("lg:hidden");
    expect(notesTab).toHaveAttribute("aria-selected", "true");
    expect(editorTab).toHaveAttribute("aria-selected", "false");
    expect(notesPanel).not.toHaveClass("hidden");
    expect(editorPanel).toHaveClass("hidden", "lg:block");

    notesTab.focus();
    await user.keyboard("{ArrowRight}");

    expect(editorTab).toHaveFocus();
    expect(editorTab).toHaveAttribute("aria-selected", "true");
    expect(notesPanel).toHaveClass("hidden", "lg:block");
    expect(editorPanel).not.toHaveClass("hidden");

    await user.keyboard("{Home}");

    expect(notesTab).toHaveFocus();
    expect(notesTab).toHaveAttribute("aria-selected", "true");
  });

  it("usa un layout mobile-first con dos columnas desde escritorio", () => {
    renderNoteApp();

    const layout = screen.getByTestId("note-app-layout");

    expect(layout).toHaveClass(
      "grid",
      "min-w-0",
      "grid-cols-1",
      "lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]",
    );

    const noteButtons = within(screen.getByTestId("note-list")).getAllByRole(
      "button",
    );

    for (const button of noteButtons) {
      expect(button).toHaveClass("min-h-11", "w-full");
    }
  });

  it("usa botones nativos y etiquetas accesibles", () => {
    renderNoteApp();

    const buttons = screen.getAllByRole("button");

    for (const button of buttons) {
      expect(button.tagName).toBe("BUTTON");
      expect(button).toHaveAttribute("type", "button");
    }

    expect(
      screen.getByRole("group", { name: "Filtrar por etiquetas" }),
    ).toBeInTheDocument();
  });

  it("no tiene violaciones de accesibilidad detectables por axe", async () => {
    const { container } = render(<NoteApp initialNotes={NOTES} />);

    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });
});
