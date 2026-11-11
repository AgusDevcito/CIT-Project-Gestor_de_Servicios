import { describe, expect, it } from "vitest";
import { ROL, ROLES, esPersonalCIT, esRol, labelDeRol } from "../../domain/roles";

describe("domain/roles", () => {
  it("declara los tres roles del sistema", () => {
    expect(ROLES).toEqual(["user", "cit", "admin"]);
  });

  it("esRol acepta roles válidos y rechaza valores desconocidos", () => {
    expect(esRol("user")).toBe(true);
    expect(esRol("cit")).toBe(true);
    expect(esRol("admin")).toBe(true);
    expect(esRol("empleado")).toBe(false);
    expect(esRol("")).toBe(false);
    expect(esRol(null)).toBe(false);
    expect(esRol(undefined)).toBe(false);
    expect(esRol(123)).toBe(false);
  });

  it("esPersonalCIT devuelve true para cit y admin, y false para user", () => {
    expect(esPersonalCIT(ROL.CIT)).toBe(true);
    expect(esPersonalCIT(ROL.ADMIN)).toBe(true);
    expect(esPersonalCIT(ROL.USER)).toBe(false);
    expect(esPersonalCIT(undefined)).toBe(false);
  });

  it("labelDeRol devuelve etiquetas legibles", () => {
    expect(labelDeRol(ROL.USER)).toBe("Usuario");
    expect(labelDeRol(ROL.CIT)).toBe("Personal CIT");
    expect(labelDeRol(ROL.ADMIN)).toBe("Administrador");
    expect(labelDeRol(undefined)).toBe("Desconocido");
  });
});
