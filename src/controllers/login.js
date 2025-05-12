import { checkPassword } from "../utils/password.js";
import usersCrud from "../models/users.js";

export const login = async (require, response) => {
  try {
    const { email, password } = require.body;

    if (!email || !password) {
      return response
        .status(400)
        .json({ error: "Email y contraseña son obligatorios" });
    }

    const user = await usersCrud.findOne({ where: { email } });
    const isPasswordValid = user && await checkPassword(password, user.password);

    if (!user || !isPasswordValid) {
      return response.status(401).json({ error: "Correo o contraseña incorrectos" });
    }

    return response.status(200).json({
      message: "Inicio de sesión exitoso",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return response.status(500).json({ error: "Error interno en login" });
  }
};
