import usersCrud from "../models/users.js";
import { encryptPassword } from "../utils/password.js";
import { sendWelcomeEmail } from "../utils/sendEmail.js";

export const getUsers = async (_req, res) => {
  try {
    const users = await usersCrud.findAll({
      attributes: { exclude: ["password"] },
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Todos los campos son obligatorios (name, email, password)",
      });
    }

    const hashedPassword = await encryptPassword(password);

    const user = await usersCrud.create({
      name,
      email,
      password: hashedPassword,
      role: req.usuario?.role === "admin" && role === "admin" ? "admin" : "user",
    });

    const { password: _omit, ...safeUser } = user.toJSON();

    res.status(201).json({
      message: "Usuario creado correctamente",
      user: safeUser,
    });

    try {
      await sendWelcomeEmail(email, name);
    } catch (mailError) {
      console.error("Error al enviar el correo:", mailError);
    }
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "Ya existe un usuario con ese correo electrónico",
      });
    }

    console.error("Error al crear usuario:", error);
    res.status(400).json({ error: "Error al crear usuario" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const changes = {};
    if (name) changes.name = name;
    if (email) changes.email = email;
    if (password) changes.password = await encryptPassword(password);

    const user = await usersCrud.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    await user.update(changes);
    res.json({ message: "Usuario actualizado correctamente" });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "Ya existe un usuario con ese correo electrónico",
      });
    }

    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (Number(req.params.id) === req.usuario.id) {
      return res.status(400).json({ error: "No puedes eliminar tu propio usuario" });
    }

    const deleted = await usersCrud.destroy({
      where: { id: req.params.id },
    });

    if (!deleted) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};
