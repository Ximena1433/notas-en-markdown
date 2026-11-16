import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import MarkdownEditor from "./MarkdownEditor";

interface ControlledEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
}

function ControlledEditor({
  initialContent = "",
  onChange,
}: ControlledEditorProps) {
  const [content, setContent] = useState(initialContent);

  return (
    <MarkdownEditor
      content={content}
      onChange={(nextContent) => {
        setContent(nextContent);
        onChange?.(nextContent);
      }}
    />
  );
}

describe("MarkdownEditor", () => {
  it("renderiza la estructura semántica y el label asociado", () => {
    render(<ControlledEditor initialContent="## Contenido inicial" />);

    expect(
      screen.getByRole("region", { name: "Editor de notas Markdown" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Editor de notas Markdown",
      }),
    ).toBeInTheDocument();

    const textarea = screen.getByRole("textbox", {
      name: "Contenido Markdown",
    });

    expect(textarea).toHaveValue("## Contenido inicial");
    expect(textarea).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("ayuda"),
    );
    expect(
      screen.getByRole("tabpanel", { name: "Vista previa" }),
    ).toBeInTheDocument();
  });

  it("actualiza la vista previa al escribir", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ControlledEditor onChange={onChange} />);

    const textarea = screen.getByRole("textbox", {
      name: "Contenido Markdown",
    });

    await user.type(textarea, "## Nueva sección");

    expect(onChange).toHaveBeenLastCalledWith("## Nueva sección");
    expect(
      screen.getByRole("heading", { level: 2, name: "Nueva sección" }),
    ).toBeInTheDocument();
  });

  it("cambia entre pestañas con clic y actualiza los paneles", async () => {
    const user = userEvent.setup();

    render(<ControlledEditor />);

    const editorTab = screen.getByRole("tab", { name: "Editor" });
    const previewTab = screen.getByRole("tab", { name: "Vista previa" });
    const editorPanel = screen.getByRole("tabpanel", { name: "Editor" });
    const previewPanel = screen.getByRole("tabpanel", { name: "Vista previa" });

    expect(editorTab).toHaveAttribute("aria-selected", "true");
    expect(previewTab).toHaveAttribute("aria-selected", "false");
    expect(editorPanel).not.toHaveClass("hidden");
    expect(previewPanel).toHaveClass("hidden", "md:block");

    await user.click(previewTab);

    expect(previewTab).toHaveAttribute("aria-selected", "true");
    expect(editorTab).toHaveAttribute("aria-selected", "false");
    expect(editorPanel).toHaveClass("hidden", "md:block");
    expect(previewPanel).not.toHaveClass("hidden");
  });

  it("permite navegar las pestañas con el teclado", async () => {
    const user = userEvent.setup();

    render(<ControlledEditor />);

    const editorTab = screen.getByRole("tab", { name: "Editor" });
    const previewTab = screen.getByRole("tab", { name: "Vista previa" });

    editorTab.focus();
    await user.keyboard("{ArrowRight}");
    expect(previewTab).toHaveFocus();
    expect(previewTab).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowLeft}");
    expect(editorTab).toHaveFocus();
    expect(editorTab).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{End}");
    expect(previewTab).toHaveFocus();
    expect(previewTab).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Home}");
    expect(editorTab).toHaveFocus();
    expect(editorTab).toHaveAttribute("aria-selected", "true");
  });

  it("usa un layout mobile-first con dos columnas desde tablet", () => {
    render(<ControlledEditor />);

    const tablist = screen.getByRole("tablist");
    const layout = screen.getByTestId("editor-layout");

    expect(tablist).toHaveClass("md:hidden");
    expect(layout).toHaveClass("grid-cols-1", "md:grid-cols-2", "min-w-0");
  });

  it("ofrece objetivos táctiles de al menos 44 px y foco visible", () => {
    render(<ControlledEditor />);

    const tabs = screen.getAllByRole("tab");
    const textarea = screen.getByRole("textbox", {
      name: "Contenido Markdown",
    });

    for (const tab of tabs) {
      expect(tab).toHaveClass("min-h-11", "min-w-11");
      expect(tab).toHaveClass("focus-visible:ring-2");
    }

    expect(textarea).toHaveClass("focus-visible:ring-2");
  });

  it("no tiene violaciones de accesibilidad detectables por axe", async () => {
    const { container } = render(
      <ControlledEditor initialContent={"## Nota accesible\n\nTexto de prueba."} />,
    );

    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });
});
