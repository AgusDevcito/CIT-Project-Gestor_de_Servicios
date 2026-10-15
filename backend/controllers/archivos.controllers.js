import { ArchivoPublicacion } from "../models/ArchivoPublicacion.models.js";
import { Publicaciones } from "../models/publicaciones.models.js";

// Lista los archivos que pertenecen a una publicacion.
export const getArchivosByPublicacion = async (req, res) => {
    const { publicacionId } = req.params;

    try {
        const archivos = await ArchivoPublicacion.findAll({
            where: { publicacion_id: publicacionId },
            order: [["orden", "ASC"]],
        });

        return res.json({ count: archivos.length, data: archivos });
    } catch (error) {
        console.error("Error al obtener archivos:", error);
        return res.status(500).json({ msg: "Error interno del sistema" });
    }
};

// Guarda la URL de un archivo que ya fue subido.
export const createArchivo = async (req, res) => {
    const { publicacionId } = req.params;
    const { tipo, archivo_url, archivo_nombre, orden } = req.body;

    if (!archivo_url) {
        return res.status(400).json({ msg: "La URL del archivo es obligatoria" });
    }

    try {
        const publicacion = await Publicaciones.findByPk(publicacionId);

        if (!publicacion) {
            return res.status(404).json({ msg: "Publicacion no encontrada" });
        }

        const archivo = await ArchivoPublicacion.create({
            publicacion_id: publicacionId,
            tipo,
            archivo_url,
            archivo_nombre,
            orden,
        });

        return res.status(201).json({ msg: "Archivo agregado", data: archivo });
    } catch (error) {
        console.error("Error al agregar archivo:", error);
        return res.status(500).json({ msg: "Error interno del sistema" });
    }
};

// Elimina un archivo individual de una publicacion.
export const deleteArchivo = async (req, res) => {
    const { id } = req.params;

    try {
        const archivo = await ArchivoPublicacion.findByPk(id);

        if (!archivo) {
            return res.status(404).json({ msg: "Archivo no encontrado" });
        }

        await archivo.destroy();
        return res.json({ msg: "Archivo eliminado" });
    } catch (error) {
        console.error("Error al eliminar archivo:", error);
        return res.status(500).json({ msg: "Error interno del sistema" });
    }
};