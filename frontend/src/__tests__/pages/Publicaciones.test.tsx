import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "../../context/auth-context";
import type { Publicacion, UsuarioAutenticado } from "../../domain/entidades";
import PublicacionDetalle from "../../pages/PublicacionDetalle";
import Publicaciones from "../../pages/Publicaciones";
import * as catalogosService from "../../services/catalogosService";
import * as publicacionesService from "../../services/publicacionesService";

vi.mock("../../services/catalogosService");
vi.mock("../../services/publicacionesService");

const crearContexto = (
  user: UsuarioAutenticado | null,
): AuthContextValue => ({
  user,
  status: user ? "autenticado" : "anonimo",
  login: async () => {
    throw new Error("no implementado");
  },
  register: async () => ({ mensaje: "", documentUrl: null }),
  logout: async () => {},
  refresh: async () => {},
});

const usuarioNormal: UsuarioAutenticado = {
  id: 10,
  username: "productor_formosa",
  email: "productor@correo.com",
  rol: "user",
  nombre: "Carlos",
  apellido: "Gómez",
  avatarUrl: null,
};

const personalCIT: UsuarioAutenticado = {
  id: 2,
  username: "investigadora_cit",
  email: "cit@conicet.gov.ar",
  rol: "cit",
  nombre: "Laura",
  apellido: "Benítez",
  avatarUrl: null,
};

const publicacionInscripcionMock: Publicacion = {
  id: 1,
  titulo: "Inscripciones abiertas: Curso de Diagnóstico Fitosanitario",
  contenido:
    "Se encuentran abiertas las inscripciones para productores y técnicos de la región.",
  tipo_contenido: "inscripcion",
  sector_id: 1,
  author_id: 2,
  publicado: true,
  createdAt: "2026-10-12T10:00:00.000Z",
  Autor: {
    id: 2,
    username: "investigadora_cit",
    email: "cit@conicet.gov.ar",
    role: "cit",
    Profile: {
      first_name: "Laura",
      last_name: "Benítez",
      avatar_url: null,
    },
  },
  Sector: { id: 1, codigo: "AGRICOLA", nombre: "Agrícola", activo: true },
  Archivo: [
    {
      id: 100,
      tipo: "imagen",
      archivo_url: "https://cit.gob.ar/flyer-fitosanitario.jpg",
      archivo_nombre: "Flyer del curso",
      orden: 1,
      publicacion_id: 1,
    },
  ],
};

const publicacionJornadaMock: Publicacion = {
  id: 2,
  titulo: "Jornada de Biotecnología Reproductiva en Bovinos",
  contenido:
    "Encuentro técnico-científico con especialistas del CONICET Nordeste.",
  tipo_contenido: "jornada",
  sector_id: 2,
  author_id: 2,
  publicado: true,
  createdAt: "2026-10-15T14:00:00.000Z",
  Sector: { id: 2, codigo: "GANADERO", nombre: "Ganadero", activo: true },
  Archivo: [],
};

const publicacionBorradorMock: Publicacion = {
  id: 3,
  titulo: "Borrador interno: Calendario de capacitaciones 2027",
  contenido: "Documento en preparación por el equipo de vinculación.",
  tipo_contenido: "capacitacion",
  sector_id: 1,
  author_id: 2,
  publicado: false,
  createdAt: "2026-10-18T09:00:00.000Z",
  Sector: { id: 1, codigo: "AGRICOLA", nombre: "Agrícola", activo: true },
  Archivo: [],
};

const publicacionesMock: Publicacion[] = [
  publicacionInscripcionMock,
  publicacionJornadaMock,
  publicacionBorradorMock,
];

describe("pages/Publicaciones y PublicacionDetalle (Spec-002 Fase E)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(catalogosService.getSectores).mockResolvedValue([
      { id: 1, codigo: "AGRICOLA", nombre: "Agrícola", activo: true },
      { id: 2, codigo: "GANADERO", nombre: "Ganadero", activo: true },
    ]);
    vi.mocked(publicacionesService.getPublicaciones).mockResolvedValue(
      publicacionesMock,
    );
  });

  it("muestra únicamente las publicaciones publicadas al usuario normal, sin botones de administración, y permite filtrar por categoría", async () => {
    render(
      <AuthContext.Provider value={crearContexto(usuarioNormal)}>
        <MemoryRouter initialEntries={["/publicaciones"]}>
          <Routes>
            <Route path="/publicaciones" element={<Publicaciones />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(
      await screen.findByText(
        "Inscripciones abiertas: Curso de Diagnóstico Fitosanitario",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Jornada de Biotecnología Reproductiva en Bovinos"),
    ).toBeInTheDocument();

    // El borrador no debe mostrarse a usuarios normales
    expect(
      screen.queryByText("Borrador interno: Calendario de capacitaciones 2027"),
    ).not.toBeInTheDocument();

    // Sin botones de administración
    expect(
      screen.queryByRole("button", { name: /\+ Nueva publicación/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Editar$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Eliminar$/i }),
    ).not.toBeInTheDocument();

    // Filtrar por pestaña de Jornadas
    fireEvent.click(screen.getByRole("tab", { name: "Jornadas" }));
    expect(
      screen.getByText("Jornada de Biotecnología Reproductiva en Bovinos"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Inscripciones abiertas: Curso de Diagnóstico Fitosanitario",
      ),
    ).not.toBeInTheDocument();
  });

  it("permite al personal CIT crear, editar, publicar/despublicar y eliminar publicaciones", async () => {
    vi.mocked(publicacionesService.createPublicacion).mockResolvedValue({
      id: 4,
      titulo: "Nueva Noticia Institucional CIT",
      contenido: "Incorporación de nuevo equipamiento de cromatografía.",
      tipo_contenido: "noticia",
      sector_id: 1,
      author_id: 2,
      publicado: true,
      createdAt: "2026-10-20T12:00:00.000Z",
    });
    vi.mocked(publicacionesService.toggleEstadoPublicacion).mockResolvedValue({
      ...publicacionBorradorMock,
      publicado: true,
    });
    vi.mocked(publicacionesService.deletePublicacion).mockResolvedValue();

    render(
      <AuthContext.Provider value={crearContexto(personalCIT)}>
        <MemoryRouter initialEntries={["/publicaciones"]}>
          <Routes>
            <Route path="/publicaciones" element={<Publicaciones />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    // El personal CIT también visualiza el borrador
    expect(
      await screen.findByText(
        "Borrador interno: Calendario de capacitaciones 2027",
      ),
    ).toBeInTheDocument();

    // Crear nueva publicación
    fireEvent.click(
      screen.getByRole("button", { name: /\+ Nueva publicación/i }),
    );
    fireEvent.change(screen.getByLabelText(/Título de la publicación/i), {
      target: { value: "Nueva Noticia Institucional CIT" },
    });
    fireEvent.change(screen.getByLabelText(/Categoría o tipo/i), {
      target: { value: "noticia" },
    });
    fireEvent.change(screen.getByLabelText(/Área o sector vinculado/i), {
      target: { value: "AGRICOLA" },
    });
    fireEvent.change(screen.getByLabelText(/Imagen o recurso visual/i), {
      target: { value: "https://cit.gob.ar/cromatografo.jpg" },
    });
    fireEvent.change(screen.getByLabelText(/Descripción o contenido/i), {
      target: { value: "Incorporación de nuevo equipamiento de cromatografía." },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Crear publicación/i }),
    );

    await waitFor(() => {
      expect(publicacionesService.createPublicacion).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: "Nueva Noticia Institucional CIT",
          tipo_contenido: "noticia",
          sector: "AGRICOLA",
          publicado: true,
          imagen_url: "https://cit.gob.ar/cromatografo.jpg",
        }),
      );
    });

    // Publicar el borrador
    const btnPublicar = screen.getByRole("button", { name: /^Publicar$/i });
    fireEvent.click(btnPublicar);

    await waitFor(() => {
      expect(publicacionesService.toggleEstadoPublicacion).toHaveBeenCalledWith(
        3,
        true,
      );
    });

    // Eliminar una publicación
    const botonesEliminar = screen.getAllByRole("button", {
      name: /^Eliminar$/i,
    });
    fireEvent.click(botonesEliminar[0]!);

    await waitFor(() => {
      expect(publicacionesService.deletePublicacion).toHaveBeenCalledWith(1);
    });
  });

  it("muestra el detalle de una publicación y permite al personal CIT adjuntar y eliminar recursos visuales", async () => {
    vi.mocked(publicacionesService.getPublicacionById).mockResolvedValue(
      publicacionInscripcionMock,
    );
    vi.mocked(publicacionesService.addArchivo).mockResolvedValue({
      id: 101,
      tipo: "video",
      archivo_url: "https://cit.gob.ar/presentacion.mp4",
      archivo_nombre: "Video introductorio",
      orden: 2,
      publicacion_id: 1,
    });
    vi.mocked(publicacionesService.deleteArchivo).mockResolvedValue();

    render(
      <AuthContext.Provider value={crearContexto(personalCIT)}>
        <MemoryRouter initialEntries={["/publicaciones/1"]}>
          <Routes>
            <Route path="/publicaciones/:id" element={<PublicacionDetalle />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Inscripciones abiertas: Curso de Diagnóstico Fitosanitario",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Por Laura Benítez/i)).toBeInTheDocument();
    expect(screen.getByText("Flyer del curso")).toBeInTheDocument();

    // Adjuntar un nuevo recurso visual
    fireEvent.change(screen.getByLabelText(/^Tipo$/i), {
      target: { value: "video" },
    });
    fireEvent.change(screen.getByLabelText(/URL del recurso/i), {
      target: { value: "https://cit.gob.ar/presentacion.mp4" },
    });
    fireEvent.change(screen.getByLabelText(/Nombre \/ Epígrafe/i), {
      target: { value: "Video introductorio" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Adjuntar recurso/i }));

    await waitFor(() => {
      expect(publicacionesService.addArchivo).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          tipo: "video",
          archivo_url: "https://cit.gob.ar/presentacion.mp4",
          archivo_nombre: "Video introductorio",
        }),
      );
    });

    expect(
      (await screen.findAllByText("Video introductorio")).length,
    ).toBeGreaterThan(0);

    // Eliminar un adjunto
    const botonesEliminarAdjunto = screen.getAllByRole("button", {
      name: /^Eliminar$/i,
    });
    fireEvent.click(botonesEliminarAdjunto[0]!);

    await waitFor(() => {
      expect(publicacionesService.deleteArchivo).toHaveBeenCalledWith(100);
    });
  });
});
