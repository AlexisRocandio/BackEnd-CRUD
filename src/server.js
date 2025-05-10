import express from "express";
import { router } from "./routes/index.js";

const app = express();
app.use(express.json());
app.use(router);

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
