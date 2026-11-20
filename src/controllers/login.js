import { checkPassword } from "../utils/password.js";
import usersCrud from "../models/users.js";
import { generarToken } from "../middlewares/auth.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email y contraseña son obligatorios" });
    }

    const user = await usersCrud.findOne({ where: { email } });
    const isPasswordValid = user && await checkPassword(password, user.password);

    if (!user || !isPasswordValid) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos" });
    }

    const { token, tokenExpiresAt } = generarToken(user);

    return res.status(200).json({
      message: "Inicio de sesión exitoso",
      token,
      tokenExpiresAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ error: "Error interno en login" });
  }
};
