const express = require('express');
const router = express.Router();
const CuotasController = require('../controllers/cuotasController');
const { verifyToken } = require('../middleware/auth');

// Ruta para listar cuotas del alumno autenticado
router.get('/mi-cuota', verifyToken, CuotasController.listarCuotasAlumno);

module.exports = router; 