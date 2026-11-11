import { describe, expect, it } from "vitest";
import { errorDeValidacion, getApiError, traducirError } from "../../domain/errors";

describe("domain/errors", () => {
  it("traduce errores 401 del backend a noAutorizado conservando msg y code", () => {
    const axiosErr = {
      response: {
        status: 401,
        data: { msg: "Contraseña Incorrecta", code: "UNAUTHORIZED" },
      },
    };

    const res = traducirError(axiosErr);
    expect(res).toEqual({
      tipo: "noAutorizado",
      mensaje: "Contraseña Incorrecta",
      codigo: "UNAUTHORIZED",
      estado: 401,
    });
  });

  it("traduce errores 400 del backend a validacion", () => {
    const axiosErr = {
      response: {
        status: 400,
        data: { msg: "Todos los campos obligatorios deben estar completos.", code: "VALIDATION_ERROR" },
      },
    };

    const res = traducirError(axiosErr);
    expect(res.tipo).toBe("validacion");
    expect(res.mensaje).toBe("Todos los campos obligatorios deben estar completos.");
  });

  it("traduce errores 413 a tamanoArchivo con mensaje claro", () => {
    const axiosErr = {
      response: {
        status: 413,
        data: {},
      },
    };

    const res = traducirError(axiosErr);
    expect(res.tipo).toBe("tamanoArchivo");
    expect(res.mensaje).toBe("El archivo supera el tamaño máximo permitido.");
  });

  it("traduce un error sin response como error de red", () => {
    const netErr = new Error("Network Error");
    const res = traducirError(netErr);
    expect(res.tipo).toBe("red");
    expect(res.mensaje).toContain("No se pudo conectar con el servidor");
  });

  it("construye un error de validación local y getApiError extrae el mensaje", () => {
    const err = errorDeValidacion("Campo inválido");
    expect(traducirError(err)).toEqual(err);
    expect(getApiError(err)).toBe("Campo inválido");
  });
});
