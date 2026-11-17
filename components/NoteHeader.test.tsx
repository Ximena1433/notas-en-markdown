import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import NoteHeader from "./NoteHeader";

function ControlledHeader({ initialTitle, onCommit }: { initialTitle: string; onCommit?: (t: string) => void }) {
  const [title, setTitle] = useState(initialTitle);
  const [tags, setTags] = useState<string[]>(["docs"]);
  return (
    <NoteHeader
      title={title}
      tags={tags}
      onTitleCommit={(t) => { setTitle(t); onCommit?.(t); }}
      onTagsChange={setTags}
    />
  );
}

describe("NoteHeader", () => {
  it("muestra el título y las etiquetas", () => {
    render(<ControlledHeader initialTitle="Guía Markdown" />);
    expect(screen.getByRole("textbox", { name: "Título de la nota" })).toHaveValue("Guía Markdown");
    expect(screen.getByText("docs")).toBeInTheDocument();
  });

  it("confirma el título al salir", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<ControlledHeader initialTitle="Antiguo" onCommit={onCommit} />);
    const input = screen.getByRole("textbox", { name: "Título de la nota" });
    await user.clear(input);
    await user.type(input, "  Nuevo  ");
    await user.tab();
    expect(onCommit).toHaveBeenCalledWith("Nuevo");
  });

  it("permite añadir y quitar etiquetas", async () => {
    const user = userEvent.setup();
    render(<ControlledHeader initialTitle="T" />);
    const tagInput = screen.getByLabelText("Etiquetas");
    await user.type(tagInput, "react{Enter}");
    expect(screen.getByText("react")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Quitar etiqueta react" }));
    expect(screen.queryByText("react")).not.toBeInTheDocument();
  });
});
