const express = require("express");
const {
  listarAlumnosConApoderados,
} = require("../controllers/alumnoController");
const router = express.Router();

router.get("/lista-alumnos/:anio/:grado", listarAlumnosConApoderados);

module.exports = router;
