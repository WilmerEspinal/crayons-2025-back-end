const db = require("../config/database");

class CuotasModel {
  static async crear(
    connection,
    idMatricula,
    matriculaPrecio,
    matriculaEstado,
    c1, c1_estado,
    c2, c2_estado,
    c3, c3_estado,
    c4, c4_estado,
    c5, c5_estado,
    c6, c6_estado,
    c7, c7_estado,
    c8, c8_estado,
    c9, c9_estado,
    c10, c10_estado
  ) {
    const [result] = await connection.execute(
      `INSERT INTO cuotas (
        id_matricula, matricula_precio, matricula_estado,
        c1, c1_estado, c2, c2_estado, c3, c3_estado, c4, c4_estado, c5, c5_estado,
        c6, c6_estado, c7, c7_estado, c8, c8_estado, c9, c9_estado, c10, c10_estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idMatricula, matriculaPrecio, matriculaEstado,
        c1, c1_estado,
        c2, c2_estado,
        c3, c3_estado,
        c4, c4_estado,
        c5, c5_estado,
        c6, c6_estado,
        c7, c7_estado,
        c8, c8_estado,
        c9, c9_estado,
        c10, c10_estado
      ]
    );
    return result.insertId;
  }

  // Nuevo método para listar cuotas por id_persona (alumno autenticado)
  static async listarPorIdPersona(idPersona) {
    // 1. Buscar id del alumno
    const [alumnoRows] = await db.pool.query(
      'SELECT id FROM alumno WHERE id_persona = ?',
      [idPersona]
    );
    if (alumnoRows.length === 0) return null;
    const idAlumno = alumnoRows[0].id;

    // 2. Buscar matrículas del alumno
    const [matriculaRows] = await db.pool.query(
      'SELECT id FROM matricula WHERE id_alumno = ?',
      [idAlumno]
    );
    if (matriculaRows.length === 0) return null;
    // Si hay varias matrículas, devolvemos todas las cuotas
    const matriculaIds = matriculaRows.map(row => row.id);

    // 3. Buscar cuotas de esas matrículas
    const [cuotasRows] = await db.pool.query(
      `SELECT * FROM cuotas WHERE id_matricula IN (${matriculaIds.map(() => '?').join(',')})`,
      matriculaIds
    );
    return cuotasRows;
  }
}

module.exports = CuotasModel;
