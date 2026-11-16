import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import NoteHeader from "./NoteHeader";

interface ControlledHeaderProps {
  initialTitle: string;
  onCommit?: (title: string) => void;
}

function ControlledHeader({ initialTitle, onCommit }: ControlledHeaderProps) {
  const [title, setTitle] = useState(initialTitle);

  return (
    <NoteHeader
      title={title}
      tags={["docs"]}
      onTitleCommit={(nextTitle) => {
        setTitle(nextTitle);
        onCommit?.(nextTitle);
      }}
    />
  );
}

describe("NoteHeader", () => {
  it("muestra el título editable y las etiquetas", () => {
    render(<ControlledHeader initialTitle="Guía Markdown" />);

    expect(
      screen.getByRole("textbox", { name: "Título de la nota" }),
    ).toHaveValue("Guía Markdown");
    expect(screen.getByText("docs")).toBeInTheDocument();
  });

  it("confirma el título al salir del campo y lo recorta", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();

    render(<ControlledHeader initialTitle="Antiguo" onCommit={onCommit} />);

    const input = screen.getByRole("textbox", { name: "Título de la nota" });

    await user.clear(input);
    await user.type(input, "  Nuevo título  ");

    expect(onCommit).not.toHaveBeenCalled();

    await user.tab();

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("Nuevo título");
    expect(input).toHaveValue("Nuevo título");
  });

  it("confirma el título con Enter", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();

    render(<ControlledHeader initialTitle="Antiguo" onCommit={onCommit} />);

    const input = screen.getByRole("textbox", { name: "Título de la nota" });

    await user.clear(input);
    await user.type(input, "Con Enter{Enter}");

    expect(onCommit).toHaveBeenCalledWith("Con Enter");
  });

  it("revierte el título vacío al anterior", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();

    render(<ControlledHeader initialTitle="Antiguo" onCommit={onCommit} />);

    const input = screen.getByRole("textbox", { name: "Título de la nota" });

    await user.clear(input);
    await user.tab();

    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveValue("Antiguo");
  });

  it("descarta el borrador con Escape", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();

    render(<ControlledHeader initialTitle="Antiguo" onCommit={onCommit} />);

    const input = screen.getByRole("textbox", { name: "Título de la nota" });

    await user.clear(input);
    await user.type(input, "Otro{Escape}");

    expect(input).toHaveValue("Antiguo");

    await user.tab();

    expect(onCommit).not.toHaveBeenCalled();
  });

  it("ofrece un objetivo táctil de al menos 44 px y foco visible", () => {
    render(<ControlledHeader initialTitle="Guía Markdown" />);

    const input = screen.getByRole("textbox", { name: "Título de la nota" });

    expect(input).toHaveClass("h-11", "w-full");
    expect(input).toHaveClass("focus-visible:ring-2");
  });

  it("no tiene violaciones de accesibilidad detectables por axe", async () => {
    const { container } = render(
      <ControlledHeader initialTitle="Guía Markdown" />,
    );

    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });
});
