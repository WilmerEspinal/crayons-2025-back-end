const express = require("express");
const {
  listarAlumnosConApoderados,
} = require("../controllers/alumnoController");
const { verifyToken } = require("../middleware/auth");
const router = express.Router();

router.get("/lista-alumnos/:anio/:grado", listarAlumnosConApoderados);
// Ruta para que el alumno autenticado vea su asistencia
router.get("/mi-asistencia", verifyToken, require("../controllers/alumnoController").verMiAsistencia);

module.exports = router;
