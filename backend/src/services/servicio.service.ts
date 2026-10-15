import { validationError } from "../errors/AppError.js";
import * as catalogRepository from "../repositories/catalog.repository.js";
import * as servicioRepository from "../repositories/servicio.repository.js";

export interface CreateServicioInput {
    servicio_nombre?: string;
    servicio_description?: string;
    servicio_img?: string | null;
    servicio_precio?: number | string;
    sector_id?: number | string;
    sector?: string;
}

export const list = () => servicioRepository.findAll();

export const create = async (input: CreateServicioInput, proveedorId: number) => {
    const {
        servicio_nombre,
        servicio_description,
        servicio_img,
        servicio_precio,
        sector_id: requestedSector,
        sector,
    } = input;

    const sectorItem = await catalogRepository.findSector(requestedSector ?? sector);

    if (
        !servicio_nombre ||
        !servicio_description ||
        servicio_precio === undefined ||
        !sectorItem
    ) {
        throw validationError(
            "Nombre, descripción, precio y sector válido son obligatorios.",
        );
    }

    return servicioRepository.create({
        servicio_nombre,
        servicio_description,
        servicio_img,
        servicio_precio: Number(servicio_precio),
        sector_id: sectorItem.id,
        proveedor_id: proveedorId,
    });
};
