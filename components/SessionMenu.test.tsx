import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import SessionMenu from "./SessionMenu";

const { replace, refresh } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
  usePathname: () => "/notas",
}));

describe("SessionMenu", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("muestra solo cerrar sesión con marco rojo cuando hay sesión", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ user: { id: "u1", email: "usuario@ejemplo.com" } }),
      }),
    );
    render(<SessionMenu />);

    const logout = await screen.findByRole("button", { name: "Cerrar sesión" });
    expect(logout).toHaveClass("border-red-300");
    expect(screen.queryByRole("link", { name: "Iniciar sesión" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Registro" })).not.toBeInTheDocument();

    await user.click(logout);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("muestra los accesos con marco cuando no hay sesión", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    render(<SessionMenu />);

    const login = await screen.findByRole("link", { name: "Iniciar sesión" });
    const register = screen.getByRole("link", { name: "Registro" });
    expect(login).toHaveClass("border-blue-700");
    expect(register).toHaveClass("border-blue-700");
    expect(screen.queryByRole("button", { name: "Cerrar sesión" })).not.toBeInTheDocument();
  });
});
