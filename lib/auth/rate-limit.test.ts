import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("límite de intentos", () => {
  it("bloquea después del máximo de intentos", () => {
    let time = 1_000;
    const limiter = createRateLimiter(2, 1_000, () => time);
    expect(limiter.check("ip:correo")).toBe(true);
    expect(limiter.check("ip:correo")).toBe(true);
    expect(limiter.check("ip:correo")).toBe(false);
    time += 1_001;
    expect(limiter.check("ip:correo")).toBe(true);
  });

  it("mantiene las claves separadas y permite reiniciar", () => {
    const limiter = createRateLimiter(1, 60_000, () => 1_000);
    expect(limiter.check("a")).toBe(true);
    expect(limiter.check("a")).toBe(false);
    expect(limiter.check("b")).toBe(true);
    limiter.reset();
    expect(limiter.check("a")).toBe(true);
  });
});
