import { Profile } from "../models/profile.model.js";
import { User } from "../models/user.models.js";

// Devuelve todos los perfiles junto con los datos publicos de su usuario.
export const getAllProfiles = async (req, res) => {
    try {
        const profiles = await Profile.findAll({
            include: {
                model: User,
                as: "User",
                attributes: { exclude: ["password"] },
            },
        });

        return res.json({ count: profiles.length, data: profiles });
    } catch (error) {
        console.error("Error al obtener perfiles:", error);
        return res.status(500).json({ msg: "Error interno del sistema" });
    }
};

// Busca un perfil usando el id del usuario al que pertenece.
export const getProfileByUserId = async (req, res) => {
    const { userId } = req.params;

    if (isNaN(userId) || Number(userId) <= 0) {
        return res.status(400).json({ msg: "El id del usuario es invalido" });
    }

    try {
        const profile = await Profile.findOne({
            where: { user_id: userId },
            include: {
                model: User,
                as: "User",
                attributes: { exclude: ["password"] },
            },
        });

        if (!profile) {
            return res.status(404).json({ msg: "Perfil no encontrado" });
        }

        return res.json({ data: profile });
    } catch (error) {
        console.error("Error al obtener el perfil:", error);
        return res.status(500).json({ msg: "Error interno del sistema" });
    }
};

// Actualiza solamente los datos personales del perfil.
export const updateProfile = async (req, res) => {
    const { userId } = req.params;
    const { first_name, last_name, avatar_url } = req.body;

    if (isNaN(userId) || Number(userId) <= 0) {
        return res.status(400).json({ msg: "El id del usuario es invalido" });
    }

    try {
        const profile = await Profile.findOne({ where: { user_id: userId } });

        if (!profile) {
            return res.status(404).json({ msg: "Perfil no encontrado" });
        }

        await profile.update({ first_name, last_name, avatar_url });
        return res.json({ msg: "Perfil actualizado", data: profile });
    } catch (error) {
        console.error("Error al actualizar el perfil:", error);
        return res.status(500).json({ msg: "Error interno del sistema" });
    }
};