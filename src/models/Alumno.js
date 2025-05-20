const db = require("../config/database");

class AlumnoModel {
  static async crear(connection, idPersona) {
    try {
      const [result] = await connection.execute(
        "INSERT INTO alumno (id_persona) VALUES (?)",
        [idPersona]
      );
      return result.insertId;
    } catch (error) {
      // Comprobar si ya existe un alumno con ese id_persona
      const [rows] = await connection.execute(
        "SELECT id FROM alumno WHERE id_persona = ?",
        [idPersona]
      );
      if (rows.length > 0) {
        return rows[0].id;
      }
      throw error;
    }
  }

  static async buscarPorIdPersona(connection, idPersona) {
    const [rows] = await connection.execute(
      "SELECT * FROM alumno WHERE id_persona = ?",
      [idPersona]
    );
    return rows.length > 0 ? rows[0] : null;
  }
}

module.exports = AlumnoModel;
