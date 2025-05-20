// models/Persona.js
class PersonaModel {
  static async crear(connection, dni, nombre, ap_p, ap_m, fecha_nacimiento) {
    try {
      const [result] = await connection.execute(
        "INSERT INTO persona (dni, nombre, ap_p, ap_m, fecha_nacimiento) VALUES (?, ?, ?, ?, ?)",
        [dni, nombre, ap_p, ap_m, fecha_nacimiento]
      );
      return result.insertId;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        const [rows] = await connection.execute(
          "SELECT id FROM persona WHERE dni = ?",
          [dni]
        );
        if (rows.length > 0) return rows[0].id;
      }
      throw error;
    }
  }

  static async buscarPorDni(connection, dni) {
    const [rows] = await connection.execute(
      "SELECT * FROM persona WHERE dni = ?",
      [dni]
    );
    return rows.length > 0 ? rows[0] : null;
  }
}

module.exports = PersonaModel;
