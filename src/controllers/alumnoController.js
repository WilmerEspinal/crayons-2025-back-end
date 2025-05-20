const db = require("../config/database");

const listarAlumnosConApoderados = async (req, res) => {
  try {
    const anio = req.params.anio;
    const grado = req.params.grado;

    const [alumnos] = await db.pool.query(
      `
      SELECT
        e.id AS alumno_id,
        p.dni AS alumno_dni,
        p.nombre AS alumno_nombre,
        p.ap_p AS alumno_apellido_paterno,
        p.ap_m AS alumno_apellido_materno,
        p.fecha_nacimiento,

        pa.dni AS apoderado_dni,
        pa.nombre AS apoderado_nombre,
        pa.ap_p AS apoderado_apellido_paterno,
        pa.ap_m AS apoderado_apellido_materno,
        ap.telefono,
        ap.relacion,

        g.descripcion AS grado,
        m.fecha_matricula

      FROM alumno e
      JOIN persona p ON e.id_persona = p.id
      JOIN alumno_apoderado ea ON ea.id_alumno = e.id
      JOIN apoderado ap ON ap.id = ea.id_apoderado
      JOIN persona pa ON pa.id = ap.id_persona
      JOIN matricula m ON m.id_alumno = e.id
      JOIN grado g ON g.id = m.id_grado

      WHERE YEAR(m.fecha_matricula) = ? AND g.id = ?
      LIMIT 100
      `,
      [anio, grado]
    );

    res.status(200).json(alumnos);
  } catch (error) {
    console.error("Error al listar alumnos:", error.message);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = {
  listarAlumnosConApoderados,
};
