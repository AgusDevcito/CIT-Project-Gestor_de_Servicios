import { Estado } from "../models/estado.model.js";
import { Sector } from "../models/sector.model.js";

export const seedCatalogos = async () => {
    const sectores = [
        ["AGRICOLA", "Agrícola"],
        ["GANADERO", "Ganadero"],
        ["FRUTIHORTICOLA", "Frutihortícola"],
    ];
    const estados = [
        ["PENDIENTE", "Pendiente"],
        ["APROBADO", "Aprobado"],
        ["RECHAZADO", "Rechazado"],
        ["ACEPTADA", "Aceptada"],
        ["FINALIZADA", "Finalizada"],
    ];

    for (const [codigo, nombre] of sectores) {
        await Sector.findOrCreate({ where: { codigo }, defaults: { nombre } });
    }
    for (const [codigo, nombre] of estados) {
        await Estado.findOrCreate({ where: { codigo }, defaults: { nombre } });
    }
};