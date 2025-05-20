const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./src/routes/authRoutes");
const matriculaRoutes = require("./src/routes/matriculaRoutes");
const gradoRoutes = require("./src/routes/gradoRoutes");
const reniecRoutes = require("./src/routes/reniecRoutes");
const alumnoRoutes = require("./src/routes/alumnoRoutes");
const docenteRoutes = require("./src/routes/docenteRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/das", matriculaRoutes);

app.use("/api/grado", gradoRoutes);

app.use("/api/dni", reniecRoutes);

app.use("/api/alumno", alumnoRoutes);

app.use("/api/docente", docenteRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ message: "API funcionando correctamente" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
