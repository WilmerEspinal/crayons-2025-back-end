const PersonaModel = require("../models/Persona");
const UserModel = require("../models/User");
const DocenteModel = require("../models/Docente");
const DocenteCursoModel = require("../models/docenteCurso");
const { withTransaction } = require("../config/database");
const bcrypt = require("bcryptjs");

class DocenteController {
  static generarUsername(nombre, ap_p, fecha_nacimiento) {
    // Obtener el primer nombre
    const primerNombre = nombre.split(" ")[0].toLowerCase();
    // Formatear la fecha (asumiendo que viene en formato YYYY-MM-DD)
    const fecha = new Date(fecha_nacimiento);
    const dia = fecha.getDate().toString().padStart(2, "0");
    const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
    const anio = fecha.getFullYear();

    return `${primerNombre}${ap_p.toLowerCase()}${dia}${mes}${anio}`;
  }

  static generarPassword(nombre, ap_p, ap_m, dni, fecha_nacimiento) {
    // Obtener las primeras 3 letras del nombre
    const nombreInicial = nombre.substring(0, 3).toLowerCase();
    // Obtener las primeras 2 letras de ap_p
    const ap_pInicial = ap_p.substring(0, 2).toLowerCase();
    // Obtener las primeras 2 letras de ap_m
    const ap_mInicial = ap_m.substring(0, 2).toLowerCase();
    // Obtener los últimos 4 dígitos del DNI
    const dniFinal = dni.slice(-4);
    // Formatear la fecha (asumiendo que viene en formato YYYY-MM-DD)
    const fecha = new Date(fecha_nacimiento);
    const dia = fecha.getDate().toString().padStart(2, "0");
    const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
    const anio = fecha.getFullYear();

    return `${nombreInicial}${ap_pInicial}${ap_mInicial}${dniFinal}${dia}${mes}${anio}`;
  }

  static async registrarCompleto(pool, datos) {
    try {
      // Usamos la función withTransaction para hacer todo atomizado
      const resultado = await withTransaction(async (connection) => {
        const {
          dni,
          nombre,
          ap_p,
          ap_m,
          fecha_nacimiento,
          role_id,
          cursos_asignados,
          email,
        } = datos;

        // Generar username y password automáticamente
        const username = this.generarUsername(nombre, ap_p, fecha_nacimiento);
        const password = this.generarPassword(
          nombre,
          ap_p,
          ap_m,
          dni,
          fecha_nacimiento
        );

        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);

        // 1. Validar si la persona ya existe
        const personaExistente = await PersonaModel.buscarPorDni(
          connection,
          dni
        );
        if (personaExistente) {
          return {
            success: false,
            message: "La persona con este DNI ya existe.",
          };
        }

        // 2. Insertar en persona
        const id_persona = await PersonaModel.crear(
          connection,
          dni,
          nombre,
          ap_p,
          ap_m,
          fecha_nacimiento
        );

        // 3. Insertar en users
        await UserModel.crear(connection, {
          username,
          email,
          password: passwordEncriptada,
          role_id,
          id_persona,
        });

        // 4. Insertar en docente
        const id_docente = await DocenteModel.crear(connection, id_persona);

        // 5. Insertar cursos asignados
        for (const { idCurso, idGrado } of cursos_asignados) {
          await DocenteCursoModel.crear(
            connection,
            id_docente,
            idCurso,
            idGrado
          );
        }

        return {
          success: true,
          message: "Docente registrado con éxito.",
          credenciales: {
            username,
            password,
            email,
          },
        };
      });

      return resultado;
    } catch (error) {
      console.error("Error al registrar docente:", error);
      return {
        success: false,
        message: "Error interno.",
        error: {
          message: error.message,
          stack: error.stack,
        },
      };
    }
  }

  static async obtenerDatosCompletos(pool, id_docente) {
    try {
      const connection = await pool.getConnection();
      try {
        const docente = await DocenteModel.obtenerDatosCompletos(
          connection,
          id_docente
        );

        if (!docente) {
          return {
            success: false,
            message: "Docente no encontrado.",
          };
        }

        return {
          success: true,
          data: docente,
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Error al obtener datos del docente:", error);
      return {
        success: false,
        message: "Error al obtener datos del docente.",
        error: {
          message: error.message,
          stack: error.stack,
        },
      };
    }
  }

  static async listarTodosConCursos(pool, anio = null) {
    try {
      const connection = await pool.getConnection();
      try {
        const docentes = await DocenteModel.listarTodosConCursos(
          connection,
          anio
        );

        return {
          success: true,
          data: docentes,
          anio: anio || new Date().getFullYear(),
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Error al listar docentes:", error);
      return {
        success: false,
        message: "Error al listar docentes.",
        error: {
          message: error.message,
          stack: error.stack,
        },
      };
    }
  }

  static async asignarCursos(pool, id_docente, cursos) {
    try {
      const connection = await pool.getConnection();
      try {
        await DocenteModel.asignarCursos(connection, id_docente, cursos);
        return {
          success: true,
          message: "Cursos asignados correctamente",
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Error al asignar cursos:", error);
      return {
        success: false,
        message: "Error al asignar cursos",
        error: {
          message: error.message,
          stack: error.stack,
        },
      };
    }
  }

  static async insertarCursosPrueba(pool) {
    try {
      const connection = await pool.getConnection();
      try {
        await DocenteModel.insertarCursosPrueba(connection);
        return {
          success: true,
          message: "Cursos de prueba insertados correctamente",
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Error al insertar cursos de prueba:", error);
      return {
        success: false,
        message: "Error al insertar cursos de prueba",
        error: {
          message: error.message,
          stack: error.stack,
        },
      };
    }
  }

  static async listarConCursos(pool, anio = null) {
    try {
      const connection = await pool.getConnection();
      try {
        const rows = await DocenteModel.obtenerDocentesConCursos(
          connection,
          anio
        );

        // Agrupar por docente
        const docentesMap = {};
        for (const row of rows) {
          if (!docentesMap[row.docente_id]) {
            docentesMap[row.docente_id] = {
              docente_id: row.docente_id,
              dni: row.dni,
              nombre_completo: row.nombre_completo,
              fecha_registro: row.created_at,
              cursos: [],
            };
          }

          if (row.curso && row.grado) {
            docentesMap[row.docente_id].cursos.push({
              curso: row.curso,
              grado: row.grado,
            });
          }
        }

        const docentes = Object.values(docentesMap);

        return {
          success: true,
          data: docentes,
          anio: anio || "todos",
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Error al obtener docentes con cursos:", error);
      return {
        success: false,
        message: "Error al obtener docentes con cursos",
        error: {
          message: error.message,
          stack: error.stack,
        },
      };
    }
  }
}

module.exports = DocenteController;
