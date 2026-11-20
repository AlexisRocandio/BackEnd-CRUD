import jwt from "jsonwebtoken";
import usersCrud from "../models/users.js";

const TOKEN_HEADER = "x-api-token";

const leerUsuarioDelToken = async (token) => {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  return usersCrud.findByPk(payload.id, {
    attributes: { exclude: ["password"] },
  });
};

export const generarToken = (user) => {
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
  const { exp } = jwt.decode(token);
  return { token, tokenExpiresAt: exp * 1000 };
};

export const verificarToken = async (req, res, next) => {
  const token = req.headers[TOKEN_HEADER];

  if (!token) {
    return res.status(401).json({ error: "Token requerido" });
  }

  try {
    const user = await leerUsuarioDelToken(token);

    if (!user) {
      return res.status(401).json({ error: "Usuario no válido" });
    }

    req.usuario = user;
    next();
  } catch (error) {
    const tokenExpired = error.name === "TokenExpiredError";
    return res.status(401).json({
      error: tokenExpired ? "La sesión expiró" : "Token inválido",
      tokenExpired,
    });
  }
};

export const tokenOpcional = async (req, _res, next) => {
  const token = req.headers[TOKEN_HEADER];

  if (token) {
    try {
      req.usuario = await leerUsuarioDelToken(token);
    } catch {
      req.usuario = null;
    }
  }

  next();
};

export const soloAdmin = (req, res, next) => {
  if (req.usuario?.role !== "admin") {
    return res.status(403).json({ error: "No tienes permisos para esta acción" });
  }
  next();
};
