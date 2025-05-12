import { response } from "express";
import usersCrud from "../models/users.js";
import { encryptPassword } from "../utils/password.js";
import { sendWelcomeEmail } from "../utils/sendEmail.js";

  // GET
  export const getUsers = async (require, response) => {
    try {
      const users = await usersCrud.findAll();
      response.status(200).json(users);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      response.status(500).json({ error: "Error al obtener usuarios" });
    }
  };

  // POST
  export const createUser = async (require, response) => {
    try {
      const { name, email, password, role } = require.body;

      if (!name || !email || !password) {
        return response.status(400).json({
          error: "Todos los campos son obligatorios (name, email, password)",
        });
      }

      const hashedPassword = await encryptPassword(password);

      const user = await usersCrud.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'user',
      })

      response.status(201).json({
        message: "Usuario creado correctamente",
        user,
      });

      try {
        await sendWelcomeEmail(email, name);
      } catch (mailError) {
        console.error(" Error al enviar el correo:", mailError);
      }
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return response.status(409).json({
          error: "Ya existe un usuario con ese correo electrónico",
        });
      }

      console.error("Error al crear usuario:", error);
      response.status(400).json({ error: "Error al crear usuario" });
    }
  };

  // PUT para actulizar
  export const updateUser = async (require, response) => {
    try {
      const { name, email, password } = require.body;

      const [updated] = await usersCrud.update(
        { name, email, password },
        { where: { id: require.params.id } }
      );

      if (updated) {
        response.json({ message: "Usuario actualizado correctamente" });
      } else {
        response.status(404).json({ error: "Usuario no encontrado" });
      }
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      response.status(500).json({ error: "Error al actualizar usuario" });
    }
  };

  // DELETE Delete para borrar
  export const deleteUser = async (require, response) => {
    try {
      const deleted = await usersCrud.destroy({
        where: { id: require.params.id },
      });

      if (deleted) {
        response.json({ message: "🗑️ Usuario eliminado correctamente" });
      } else {
        response.status(404).json({ error: "Usuario no encontrado" });
      }
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      response.status(500).json({ error: "Error al eliminar usuario" });
    }
  };
