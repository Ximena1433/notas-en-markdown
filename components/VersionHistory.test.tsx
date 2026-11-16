import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";
import type { NoteVersion } from "../lib/notes";
import VersionHistory from "./VersionHistory";

const T1 = "2026-11-14T10:00:00.000Z";
const T2 = "2026-11-14T11:00:00.000Z";

const VERSIONS: NoteVersion[] = [
  { timestamp: T1, content: "# Primera versión" },
  { timestamp: T2, content: "## Segunda versión" },
];

describe("VersionHistory", () => {
  it("muestra un estado vacío cuando no hay versiones", () => {
    render(
      <VersionHistory
        versions={[]}
        noteTitle="Nota de prueba"
        onSaveVersion={vi.fn()}
        onRestore={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Historial de versiones" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Nota activa: Nota de prueba")).toBeInTheDocument();
    expect(
      screen.getByText("Aún no hay versiones guardadas."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("lista las versiones de la más reciente a la más antigua con fechas formateadas", () => {
    const { container } = render(
      <VersionHistory
        versions={VERSIONS}
        onSaveVersion={vi.fn()}
        onRestore={vi.fn()}
      />,
    );

    const items = screen.getAllByRole("listitem");
    const times = container.querySelectorAll("time");

    expect(items).toHaveLength(2);
    expect(times).toHaveLength(2);
    expect(times[0]).toHaveAttribute("datetime", T2);
    expect(times[0]).toHaveTextContent("14 nov 2026, 11:00");
    expect(times[1]).toHaveAttribute("datetime", T1);
    expect(times[1]).toHaveTextContent("14 nov 2026, 10:00");
  });

  it("previsualiza y oculta el contenido de una versión", async () => {
    const user = userEvent.setup();

    render(
      <VersionHistory
        versions={VERSIONS}
        onSaveVersion={vi.fn()}
        onRestore={vi.fn()}
      />,
    );

    const previewButton = screen.getByRole("button", {
      name: "Ver versión del 14 nov 2026, 11:00",
    });
    const regionName = "Vista previa de la versión del 14 nov 2026, 11:00";

    expect(previewButton).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("region", { name: regionName }),
    ).not.toBeInTheDocument();

    await user.click(previewButton);

    expect(previewButton).toHaveAttribute("aria-expanded", "true");

    const region = screen.getByRole("region", { name: regionName });

    expect(
      within(region).getByRole("heading", {
        level: 2,
        name: "Segunda versión",
      }),
    ).toBeInTheDocument();

    await user.click(previewButton);

    expect(previewButton).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("region", { name: regionName }),
    ).not.toBeInTheDocument();
  });

  it("guarda una versión con un botón nativo y lo anuncia", async () => {
    const user = userEvent.setup();
    const onSaveVersion = vi.fn();

    render(
      <VersionHistory
        versions={VERSIONS}
        noteTitle="Nota de prueba"
        onSaveVersion={onSaveVersion}
        onRestore={vi.fn()}
      />,
    );

    const saveButton = screen.getByRole("button", {
      name: "Guardar versión actual de «Nota de prueba»",
    });

    expect(saveButton.tagName).toBe("BUTTON");
    expect(saveButton).toHaveAttribute("type", "button");
    expect(saveButton).toHaveClass("min-h-11", "min-w-11");

    await user.click(saveButton);

    expect(onSaveVersion).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Se guardó la versión actual de la nota.",
    );
  });

  it("restaura la versión correcta usando el índice original", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();

    render(
      <VersionHistory
        versions={VERSIONS}
        onSaveVersion={vi.fn()}
        onRestore={onRestore}
      />,
    );

    const latestRestore = screen.getByRole("button", {
      name: "Restaurar versión del 14 nov 2026, 11:00",
    });
    const oldestRestore = screen.getByRole("button", {
      name: "Restaurar versión del 14 nov 2026, 10:00",
    });

    await user.click(latestRestore);
    expect(onRestore).toHaveBeenLastCalledWith(1);

    await user.click(oldestRestore);
    expect(onRestore).toHaveBeenLastCalledWith(0);
  });

  it("anuncia el cambio de estado mediante una región aria-live", async () => {
    const user = userEvent.setup();

    render(
      <VersionHistory
        versions={VERSIONS}
        onSaveVersion={vi.fn()}
        onRestore={vi.fn()}
      />,
    );

    const status = screen.getByRole("status");

    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toBeEmptyDOMElement();

    await user.click(
      screen.getByRole("button", {
        name: "Restaurar versión del 14 nov 2026, 11:00",
      }),
    );

    expect(status).toHaveTextContent(
      "Se restauró la versión del 14 nov 2026, 11:00.",
    );
  });

  it("usa botones nativos con nombres accesibles que incluyen la fecha", () => {
    render(
      <VersionHistory
        versions={VERSIONS}
        onSaveVersion={vi.fn()}
        onRestore={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole("button");

    for (const button of buttons) {
      expect(button.tagName).toBe("BUTTON");
      expect(button).toHaveAttribute("type", "button");
    }

    expect(
      screen.getAllByRole("button", { name: /restaurar versión del/i }),
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("button", { name: /ver versión del/i }),
    ).toHaveLength(2);
  });

  it("mantiene un layout responsive sin elementos de ancho fijo", () => {
    render(
      <VersionHistory
        versions={VERSIONS}
        onSaveVersion={vi.fn()}
        onRestore={vi.fn()}
      />,
    );

    expect(screen.getByTestId("version-history")).toHaveClass("min-w-0");

    const items = screen.getAllByTestId("version-item");

    for (const item of items) {
      expect(item).toHaveClass("min-w-0", "break-words");

      const actions = within(item).getByTestId("version-actions");

      expect(actions).toHaveClass("flex-col", "sm:flex-row");

      for (const button of within(actions).getAllByRole("button")) {
        expect(button).toHaveClass(
          "min-h-11",
          "min-w-11",
          "w-full",
          "sm:w-auto",
        );
      }
    }
  });

  it("no tiene violaciones de accesibilidad detectables por axe", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <main>
        <h1>Nota de prueba</h1>
        <VersionHistory
          versions={VERSIONS}
          onSaveVersion={vi.fn()}
          onRestore={vi.fn()}
        />
      </main>,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Ver versión del 14 nov 2026, 11:00",
      }),
    );

    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });
});
