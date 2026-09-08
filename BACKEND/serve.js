const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

const port = Number(process.env.PORT) || 4000;

const UsuarioRoutes = require("./routes/UsersRouts");

const { Conexion_Mongodb } = require("./Config/db");

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Ensure MongoDB connection in serverless (Vercel) — reuses cached connection
app.use(async (req, res, next) => {
  try {
    await Conexion_Mongodb();
    next();
  } catch (error) {
    next(error);
  }
});

// Health check
app.get("/", (req, res) => {
  res.json({ ok: true, service: "luciano_web" });
});

app.use("/", UsuarioRoutes);
app.use("/api/solicitudes", require("./routes/solicitudes"));

async function start() {
  try {
    await Conexion_Mongodb();
  } catch (error) {
    console.error("No se pudo conectar a MongoDB, servidor no iniciado:", error.message);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
  });
}

// Only auto-start when executed directly (node serve.js) — not in Vercel serverless
if (require.main === module) {
  start();
}

module.exports = app;
