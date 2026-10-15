import { ArchivoPublicacion } from "../models/ArchivoPublicacion.models.js";
import { Publicaciones } from "../models/publicaciones.models.js";
import { User } from "../models/user.models.js";
import { Sector } from "../models/sector.model.js";
import { findSector } from "../helper/catalogos.js";

const publicationIncludes = [
    {
        model: User,
        as: "Autor",
        attributes: { exclude: ["password"] },
    },
    {
        model: ArchivoPublicacion,
        as: "Archivo",
    },
    {
        model: Sector,
        as: "Sector",
    },
];

// Cualquier usuario autenticado puede consultar las publicaciones.
export const getAllPublicaciones = async (req, res) => {
    try {
        const publicaciones = await Publicaciones.findAll({
            include: publicationIncludes,
            order: [["createdAt", "DESC"]],
        });

        return res.json({ count: publicaciones.length, data: publicaciones });
    } catch (error) {
        console.error("Error al obtener publicaciones:", error);
        return res.status(500).json({ msg: "Error interno del sistema" });
    }
};

// Busca una publicacion y carga sus relaciones: autor y archivos.
export const getPublicacionById = async (req, res) => {
    const { id } = req.params;

    if (isNaN(id) || Number(id) <= 0) {
        return res.status(400).json({ msg: "El id de la publicacion es invalido" });
    }

    try {
        const publicacion = await Publicaciones.findByPk(id, {
            include: publicationIncludes,
        });

        if (!publicacion) {
            return res.status(404).json({ msg: "Publicacion no encontrada" });
        }

        return res.json({ data: publicacion });
    } catch (error) {
        console.error("Error al obtener la publicacion:", error);
        return res.status(500).json({ msg: "Error interno del sistema" });
    }
};

// Solo un usuario CIT puede crear contenido tecnico.
export const createPublicacion = async (req, res) => {
    const { titulo, contenido, tipo_contenido, sector_id: requestedSector, sector } = req.body;
    const sectorItem = await findSector(requestedSector ?? sector);

    if (!titulo || !contenido || !sectorItem) {
        return res.status(400).json({ msg: "El titulo y el contenido son obligatorios" });
    }

    try {
        const publicacion = await Publicaciones.create({
            titulo,
            contenido,
            tipo_contenido,
            sector_id: sectorItem.id,
            author_id: req.user.id,
        });

        return res.status(201).json({ msg: "Publicacion creada", data: publicacion });
    } catch (error) {
        console.error("Error al crear la publicacion:", error);
        return res.status(500).json({ msg: "Error interno del sistema" });
    }
};

// Actualiza una publicacion existente.
export const updatePublicacion = async (req, res) => {
    const { id } = req.params;

    try {
        const publicacion = await Publicaciones.findByPk(id);

        if (!publicacion) {
            return res.status(404).json({ msg: "Publicacion no encontrada" });
        }

        const { titulo, contenido, tipo_contenido, sector_id: requestedSector, sector } = req.body;
        const sectorItem = await findSector(requestedSector ?? sector);
        if (!sectorItem) {
            return res.status(400).json({ msg: "El sector no es válido" });
        }
        await publicacion.update({ titulo, contenido, tipo_contenido, sector_id: sectorItem.id });
        return res.json({ msg: "Publicacion actualizada", data: publicacion });
    } catch (error) {
        console.error("Error al actualizar la publicacion:", error);
        return res.status(500).json({ msg: "Error interno del sistema" });
    }
};

// Elimina una publicacion y sus archivos relacionados.
export const deletePublicacion = async (req, res) => {
    const { id } = req.params;

    try {
        const publicacion = await Publicaciones.findByPk(id);

        if (!publicacion) {
            return res.status(404).json({ msg: "Publicacion no encontrada" });
        }

        await ArchivoPublicacion.destroy({ where: { publicacion_id: id } });
        await publicacion.destroy();
        return res.json({ msg: "Publicacion eliminada" });
    } catch (error) {
        console.error("Error al eliminar la publicacion:", error);
        return res.status(500).json({ msg: "Error interno del sistema" });
    }
};