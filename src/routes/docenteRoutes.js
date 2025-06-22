const express = require("express");
const router = express.Router();

const DocenteController = require("../controllers/docenteController");
const { pool } = require("../config/database");

// Ruta para registrar docente
router.post("/registrar-docente", async (req, res) => {
  const pool = req.app.locals.pool;
  const datos = req.body;

  const resultado = await DocenteController.registrarCompleto(pool, datos);

  if (resultado.success) {
    res.status(201).json(resultado);
  } else {
    res.status(400).json(resultado);
  }
});

// Ruta para listar docentes con cursos
router.get("/lista-docentes/:anio?", async (req, res) => {
  try {
    const anio = req.params.anio ? parseInt(req.params.anio) : null;

    // Validar que el año sea un número válido si se proporciona
    if (anio && (isNaN(anio) || anio < 2000 || anio > 2100)) {
      return res.status(400).json({
        success: false,
        message: "El año debe ser un número válido entre 2000 y 2100",
      });
    }

    const resultado = await DocenteController.listarConCursos(pool, anio);
    if (resultado.success) {
      res.json(resultado);
    } else {
      res.status(500).json(resultado);
    }
  } catch (error) {
    console.error("Error en la ruta de listar docentes con cursos:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
  }
});

// Ruta para obtener datos del docente por año
router.get('/datos/:anio', DocenteController.getDatosDocentePorAnio);

// Ruta para exportar datos del docente a Excel
router.get('/exportar/:anio', DocenteController.exportarDatosDocenteExcel);

module.exports = router;
