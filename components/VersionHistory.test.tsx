import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { NoteVersion } from "../lib/notes";
import VersionHistory from "./VersionHistory";

const VERSIONS: NoteVersion[] = [
  { timestamp: "2026-11-14T10:00:00.000Z", content: "# v1" },
  { timestamp: "2026-11-14T11:00:00.000Z", content: "## v2" },
];

describe("VersionHistory", () => {
  it("muestra estado vacío", () => {
    render(<VersionHistory versions={[]} noteTitle="Nota" onSaveVersion={vi.fn()} onRestore={vi.fn()} />);
    expect(screen.getByText(/No hay versiones|Aún no hay versiones/i)).toBeInTheDocument();
  });

  it("lista versiones y permite acciones", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onRestore = vi.fn();
    render(<VersionHistory versions={VERSIONS} noteTitle="Nota" onSaveVersion={onSave} onRestore={onRestore} />);
    await user.click(screen.getByRole("button", { name: /guardar versi/i }));
    expect(onSave).toHaveBeenCalled();
    const restoreButtons = screen.getAllByRole("button", { name: /restaurar/i });
    await user.click(restoreButtons[0]);
    expect(onRestore).toHaveBeenCalled();
  });
});
