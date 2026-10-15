import { Solicitud } from "../models/Serviciosoli.models.js";
import { Servicios } from "../models/servicios.models.js";
import { Estado } from "../models/estado.model.js";
import { findEstado } from "../helper/catalogos.js";

const includes = [
    { model: Servicios, as: "Servicio" },
    { model: Estado, as: "Estado" },
];

export const getSolicitudes = async (req, res) => {
    const where = req.user.role === "admin" || req.user.role === "cit" ? {} : { user_id: req.user.id };
    const data = await Solicitud.findAll({ where, include: includes, order: [["createdAt", "DESC"]] });
    return res.json({ count: data.length, data });
};

export const createSolicitud = async (req, res) => {
    const estado = await findEstado("PENDIENTE");
    if (!estado) return res.status(500).json({ msg: "El catálogo de estados no está inicializado." });

    const solicitud = await Solicitud.create({
        user_id: req.user.id,
        servicio_id: Number(req.body.servicio_id),
        estado_id: estado.id,
    });
    return res.status(201).json({ data: solicitud });
};

export const updateSolicitudEstado = async (req, res) => {
    const estado = await findEstado(req.body.estado_id ?? req.body.estado);
    if (!estado) return res.status(400).json({ msg: "El estado no es válido." });

    const solicitud = await Solicitud.findByPk(req.params.id);
    if (!solicitud) return res.status(404).json({ msg: "Solicitud no encontrada." });

    await solicitud.update({ estado_id: estado.id });
    return res.json({ data: solicitud });
};