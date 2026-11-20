import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import sequelize, { dbConfig, sistema } from "./db.js";
import { router } from "./routes/index.js";

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("Falta JWT_SECRET en el .env");
  process.exit(1);
}

const PORT = Number(process.env.PORT) || 4001;
const CORS_ORIGIN = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(router);

try {
  await sequelize.authenticate();
  console.log(`Conexión a MySQL establecida (${sistema}, puerto ${dbConfig.port})`);
} catch (error) {
  console.error(`No se pudo conectar a MySQL en ${dbConfig.host}:${dbConfig.port} (${sistema}):`, error.message);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
