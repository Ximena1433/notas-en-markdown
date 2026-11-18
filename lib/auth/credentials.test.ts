import { describe, expect, it } from "vitest";
import { hashPassword, normalizeEmail, parseCredentials, verifyPassword } from "./credentials";
import { isStrongPassword } from "./password-policy";

describe("credenciales", () => {
  it("normaliza correos", () => {
    expect(normalizeEmail("  Usuario@Ejemplo.COM ")).toBe("usuario@ejemplo.com");
    expect(normalizeEmail("no-es-un-correo")).toBeNull();
    expect(normalizeEmail(42)).toBeNull();
  });

  it("valida la política de contraseñas", () => {
    expect(isStrongPassword("passwordLarga1")).toBe(true);
    expect(isStrongPassword("corta1")).toBe(false);
    expect(isStrongPassword("sololetrassinnumeros")).toBe(false);
    expect(isStrongPassword(123)).toBe(false);
  });

  it("rechaza cuerpos incompletos", () => {
    expect(parseCredentials({ email: "a@b.com", password: "x" })).toEqual({
      email: "a@b.com",
      password: "x",
    });
    expect(parseCredentials({ email: "a@b.com" })).toBeNull();
    expect(parseCredentials(null)).toBeNull();
  });

  it("verifica contraseñas con hash aleatorio", async () => {
    const record = await hashPassword("claveSegura123");
    expect(record.salt).not.toBe(record.hash);
    expect(await verifyPassword("claveSegura123", record)).toBe(true);
    expect(await verifyPassword("claveIncorrecta123", record)).toBe(false);
    expect(await verifyPassword("claveSegura123", { salt: "00", hash: "00" })).toBe(false);
  });
});
