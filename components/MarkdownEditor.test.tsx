import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import MarkdownEditor from "./MarkdownEditor";

function ControlledEditor({ initialContent = "", onChange }: { initialContent?: string; onChange?: (c: string) => void }) {
  const [content, setContent] = useState(initialContent);
  return <MarkdownEditor content={content} onChange={(next) => { setContent(next); onChange?.(next); }} />;
}

describe("MarkdownEditor", () => {
  it("renderiza el editor y la vista previa", () => {
    render(<ControlledEditor initialContent="## Contenido" />);
    expect(screen.getByRole("textbox", { name: "Contenido Markdown" })).toHaveValue("## Contenido");
    expect(screen.getByRole("tabpanel", { name: "Vista previa" })).toBeInTheDocument();
  });

  it("actualiza la vista previa al escribir", async () => {
    const user = userEvent.setup();
    render(<ControlledEditor />);
    await user.type(screen.getByRole("textbox", { name: "Contenido Markdown" }), "Hola");
    expect(screen.getByRole("textbox", { name: "Contenido Markdown" })).toHaveValue("Hola");
  });

  it("tiene botones de formato", () => {
    render(<ControlledEditor />);
    expect(screen.getByRole("button", { name: "Negrita" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cursiva" })).toBeInTheDocument();
  });
});
