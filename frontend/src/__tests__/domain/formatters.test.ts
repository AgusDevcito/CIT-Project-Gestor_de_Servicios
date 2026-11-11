import { describe, expect, it } from "vitest";
import {
  formatearPrecio,
  obtenerInicialesUsuario,
  obtenerNombreVisible,
} from "../../lib/formatters";
import { badgeVariantPorEstado, badgeVariantPorRol } from "../../components/ui/Badge";

describe("lib/formatters y ui/Badge (Spec-002 Fase A)", () => {
  it("formatea precios mayores a 0 como moneda ARS y 0 como Consultar", () => {
    expect(formatearPrecio(0)).toBe("Consultar");
    expect(formatearPrecio(null)).toBe("Consultar");
    expect(formatearPrecio(1500)).toContain("1.500");
  });

  it("calcula las iniciales del usuario y su nombre visible", () => {
    expect(
      obtenerInicialesUsuario({ nombre: "Agustín", apellido: "Rolón", username: "agustin" }),
    ).toBe("AR");
    expect(
      obtenerInicialesUsuario({ nombre: "", apellido: "", username: "cituser" }),
    ).toBe("CI");
    expect(
      obtenerNombreVisible({ nombre: "Agustín", apellido: "Rolón", username: "agustin" }),
    ).toBe("Agustín Rolón");
    expect(
      obtenerNombreVisible({ nombre: "", apellido: "", username: "agustin" }),
    ).toBe("agustin");
  });

  it("mapea códigos de estado y roles a variantes semánticas de Badge", () => {
    expect(badgeVariantPorEstado("PENDIENTE")).toBe("warning");
    expect(badgeVariantPorEstado("APROBADO")).toBe("success");
    expect(badgeVariantPorEstado("RECHAZADO")).toBe("danger");
    expect(badgeVariantPorRol("admin")).toBe("purple");
    expect(badgeVariantPorRol("cit")).toBe("success");
    expect(badgeVariantPorRol("user")).toBe("info");
  });
});
