const Cuota = require('../models/Cuota');

class CuotasController {
  // Listar cuotas del alumno autenticado
  static async listarCuotasAlumno(req, res) {
    try {
      const idPersona = req.user.id_persona;
      if (!idPersona) {
        return res.status(400).json({ status: false, message: 'No se pudo identificar al usuario' });
      }
      const cuotas = await Cuota.listarPorIdPersona(idPersona);
      if (!cuotas || cuotas.length === 0) {
        return res.status(404).json({ status: false, message: 'No se encontraron cuotas para este alumno' });
      }
      return res.status(200).json({ status: true, data: cuotas });
    } catch (error) {
      console.error('Error al listar cuotas del alumno:', error);
      return res.status(500).json({ status: false, message: 'Error al listar cuotas', error: error.message });
    }
  }
}

module.exports = CuotasController; 