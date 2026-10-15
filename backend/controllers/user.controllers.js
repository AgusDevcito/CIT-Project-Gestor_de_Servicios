import { User } from "../models/user.models.js";
import { Profile } from "../models/profile.model.js";
import { hashPassword } from "../helper/bcrypt.js";

export const createUser = async (req,res) => {
    try {
        const {username,email,password,role} = req.body;
    if (!username || !email || !password){
        return res.status(400).json({msg:"El username,email y password son obligatorios"})
    }
    const newUser = await User.create({username,email,password:await hashPassword(password),role})
    return res.status(201).json({
        msg:"Usuario creado exitosamente",
        data: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
        }
    })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            msg:"Error interno del servidor"
        })
    }

}
export const getallUsers = async (req,res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ["password"] },
            include: { model: Profile, as: "Profile" },
        })
        res.json({
            count:users.length,
            data:users
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            msg:"Error interno del sistema"
        })
    }
    
}
export const getUserbyID = async (req,res) => {
    const {id} = req.params
    if (isNaN(id) || Number(id) <= 0 ){
        return res.status(404).json({
            msg:"El id es invalido o el usuario no existe"
        })
    }
    try {
        const users = await User.findByPk(id, {
            attributes: { exclude: ["password"] },
            include: { model: Profile, as: "Profile" },
        })
        if(!users) return res.status(404).json({msg:"usuario no encontrado"})
        return res.json({
            data:users
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            msg:"error interno del sistema"
        })
    }
    
}
export const updateUser = async (req,res) => {
    const {id} = req.params
    if(isNaN(id) || Number(id) <= 0){
        return res.status(500).json({
            msg:"El id no puede ser nulo"
        })
    }
    try {
        const userId = await User.findByPk(id)
        if(!userId) return res.status(404).json({msg:"id no valido o incorrecto"})
        const {username,email,password,role} = req.body
        const userData = {username,email}
        if (role !== undefined) userData.role = role
        if (password) userData.password = await hashPassword(password)
        await userId.update(userData)
        return res.json({
            msg:"Se actualizaron los datos del usuario",
            data: { id: userId.id, username: userId.username, email: userId.email, role: userId.role }
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({msg:"Error interno del servidor"})
    }
}
export const deleteUser = async (req,res) => {
    const {id} = req.params
    if (isNaN(id) || Number(id) <= 0){
        return res.status(404).json({msg:"id invalido o usuario no existente"})
    }
    try {
        const user = await User.findByPk(id)
        if(!user) return res.status(404).json({msg:"Usuario no encontrado"})
        await user.destroy()
        res.json({
            msg:"usuario eliminado",
            data: { id: user.id, username: user.username, email: user.email, role: user.role }
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            msg:"Error interno del servidor"
        })
        
    }
}