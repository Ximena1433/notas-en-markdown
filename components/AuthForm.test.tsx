import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AuthForm from "./AuthForm";

const { replace, refresh } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

describe("AuthForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("muestra los campos de acceso", () => {
    render(<AuthForm mode="login" nextPath="/notas" />);
    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.queryByLabelText("Confirmar contraseña")).not.toBeInTheDocument();
  });

  it("rechaza contraseñas que no coinciden antes de llamar a la API", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="register" nextPath="/notas" />);
    await user.type(screen.getByLabelText("Correo electrónico"), "usuario@ejemplo.com");
    await user.type(screen.getByLabelText("Contraseña"), "claveSegura123");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "otraSegura123");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("no coinciden");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("envía las credenciales y navega tras iniciar sesión", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="login" nextPath="/notas" />);
    await user.type(screen.getByLabelText("Correo electrónico"), "usuario@ejemplo.com");
    await user.type(screen.getByLabelText("Contraseña"), "claveSegura123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(replace).toHaveBeenCalledWith("/notas");
  });
});
