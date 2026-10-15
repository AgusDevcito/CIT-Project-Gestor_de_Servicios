import { Propuestas } from "../models/propuesta.model.js";
import { User } from "../models/user.models.js";
import { Sector } from "../models/sector.model.js";
import { Estado } from "../models/estado.model.js";
import { findEstado, findSector } from "../helper/catalogos.js";

// Cada propuesta muestra al solicitante y, si existe, al revisor CIT.
const propuestaIncludes = [
  {
    model: User,
    as: 'Solicitante',
    attributes: { exclude: ['password'] },
  },
  { model: Sector, as: 'Sector' },
  {
    model: User,
    as: 'Revisor',
    attributes: { exclude: ['password'] },
  },
];

export const crearPropuesta = async (req, res) => {
  try {
    const { titulo, sector_id: requestedSector, sector, problematica } = req.body;
    const solicitante = req.user.id;
    const sectorItem = await findSector(requestedSector ?? sector);
    const pendingState = await findEstado("PENDIENTE");

    if (!titulo || !sectorItem || !problematica || !pendingState) {
      return res.status(400).json({
        ok: false,
        msg: 'Los campos titulo, sector y problematica son obligatorios.',
      });
    }

    const nuevaPropuesta = await Propuestas.create({
      titulo,
      sector_id: sectorItem.id,
      problematica,
      solicitante,
      estado_id: pendingState.id,
    });

    return res.status(201).json({
      ok: true,
      msg: 'Propuesta agropecuaria registrada exitosamente.',
      data: nuevaPropuesta,
    });
  } catch (error) {
    console.error('Error en crearPropuesta:', error);
    return res.status(500).json({ ok: false, msg: 'Error interno al registrar la propuesta.' });
  }
};
export const obtenerPendientesCIT = async (req, res) => {
  try {
    const pendientes = await Propuestas.findAll({
      where: { estado_id: (await findEstado("PENDIENTE")).id },
      include: [{ model: Estado, as: 'Estado' }, ...propuestaIncludes],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      ok: true,
      total: pendientes.length,
      data: pendientes,
    });
  } catch (error) {
    console.error('Error en obtenerPendientesCIT:', error);
    return res.status(500).json({ ok: false, msg: 'Error al consultar propuestas.' });
  }
};
export const dictaminarPropuestaCIT = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, justificacion } = req.body;
    const cirRevisorId = req.user.id;
    const estadoCodigo = decision === 'APROBADO' ? 'APROBADO' : 'RECHAZADO';
    const estadoDecision = await findEstado(estadoCodigo);

    
    if (!['APROBADO', 'RECHAZADO'].includes(decision)) {
      return res.status(400).json({
        ok: false,
        msg: 'La decisión debe ser "APROBADO" o "RECHAZADO".',
      });
    }

    if (!estadoDecision) {
      return res.status(500).json({ ok: false, msg: 'El estado solicitado no está configurado.' });
    }

    if (!justificacion || justificacion.trim().length < 15) {
      return res.status(400).json({
        ok: false,
        msg: 'Se requiere una justificación técnica de al menos 15 caracteres.',
      });
    }

    const propuesta = await Propuestas.findByPk(id, {
      include: [{ model: Estado, as: 'Estado' }, ...propuestaIncludes],
    });

    if (!propuesta) {
      return res.status(404).json({ ok: false, msg: 'Propuesta no encontrada.' });
    }

    if (propuesta.Estado?.codigo !== 'PENDIENTE') {
      return res.status(409).json({
        ok: false,
        msg: `La propuesta ya fue dictaminada previamente con estado: ${propuesta.Estado?.nombre}.`,
      });
    }

    
    propuesta.estado_id = estadoDecision.id;
    propuesta.citJustificacion = justificacion.trim();
    propuesta.cirRevisorId = cirRevisorId;
    propuesta.citFechaRevision = new Date();

    await propuesta.save();

    return res.status(200).json({
      ok: true,
      msg: `Propuesta evaluada exitosamente como ${decision}.`,
      data: propuesta,
    });
  } catch (error) {
    console.error('Error en dictaminarPropuestaCIT:', error);
    return res.status(500).json({ ok: false, msg: 'Error al procesar el dictamen.' });
  }
};
