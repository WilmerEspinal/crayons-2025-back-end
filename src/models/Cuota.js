const db = require("../config/database");

class CuotasModel {
  static async crear(
    connection,
    idMatricula,
    matriculaPrecio,
    c1,
    c2,
    c3,
    c4,
    c5,
    c6,
    c7,
    c8,
    c9,
    c10
  ) {
    const [result] = await connection.execute(
      `INSERT INTO cuotas (
        id_matricula, matricula_precio, matricula_estado,
        c1, c1_estado, c2, c2_estado, c3, c3_estado, c4, c4_estado, c5, c5_estado,
        c6, c6_estado, c7, c7_estado, c8, c8_estado, c9, c9_estado, c10, c10_estado
      ) VALUES (?, ?, false, ?, false, ?, false, ?, false, ?, false, ?, false, ?, false, ?, false, ?, false, ?, false, ?, false)`,
      [idMatricula, matriculaPrecio, c1, c2, c3, c4, c5, c6, c7, c8, c9, c10]
    );
    return result.insertId;
  }
}

module.exports = CuotasModel;
