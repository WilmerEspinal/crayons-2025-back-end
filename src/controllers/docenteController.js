const PersonaModel = require("../models/Persona");
const UserModel = require("../models/User");
const DocenteModel = require("../models/Docente");
const DocenteCursoModel = require("../models/docenteCurso");
const { withTransaction } = require("../config/database");
const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const ExcelJS = require('exceljs');

const docenteController = {
  generarUsername(nombre, ap_p, fecha_nacimiento) {
    // Obtener el primer nombre
    const primerNombre = nombre.split(' ')[0].toLowerCase();
    // Obtener el primer apellido
    const primerApellido = ap_p.split(' ')[0].toLowerCase();
    // Obtener el año de nacimiento
    const año = fecha_nacimiento.split('-')[0];
    // Combinar todo
    return `${primerNombre}${primerApellido}${año}`;
  },

  generarPassword(nombre, ap_p, ap_m, dni, fecha_nacimiento) {
    // Obtener iniciales
    const nombreInicial = nombre.charAt(0).toUpperCase();
    const ap_pInicial = ap_p.charAt(0).toUpperCase();
    const ap_mInicial = ap_m.charAt(0).toUpperCase();
    // Obtener últimos 4 dígitos del DNI
    const dniFinal = dni.slice(-4);
    // Formatear la fecha
    const fecha = new Date(fecha_nacimiento);
    const dia = fecha.getDate().toString().padStart(2, "0");
    const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
    const anio = fecha.getFullYear();

    return `${nombreInicial}${ap_pInicial}${ap_mInicial}${dniFinal}${dia}${mes}${anio}`;
  },

  async registrarCompleto(pool, datos) {
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
  },

  async obtenerDatosCompletos(pool, id_docente) {
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
  },

  async listarTodosConCursos(pool, anio = null) {
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
  },

  async asignarCursos(pool, id_docente, cursos) {
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
  },

  async insertarCursosPrueba(pool) {
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
  },

  async listarConCursos(pool, anio = null) {
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
  },

  // Obtener datos del docente por año
  getDatosDocentePorAnio: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { anio } = req.params;
      const { docente_id } = req.query;

      if (!anio || !docente_id) {
        return res.status(400).json({
          message: "Se requiere el año y el ID del docente"
        });
      }

      // Consulta para obtener los datos del docente
      const [docente] = await connection.query(
        `SELECT 
          d.id,
          d.nombre,
          d.apellido,
          d.apellido_materno,
          d.dni,
          d.email,
          d.telefono,
          d.fecha_registro,
          d.estado
        FROM docente d
        WHERE d.id = ?`,
        [docente_id]
      );

      if (!docente || docente.length === 0) {
        return res.status(404).json({
          message: "No se encontraron datos para el docente en el año especificado"
        });
      }

      // Estructurar la respuesta
      const respuesta = {
        docente: {
          id: docente[0].id,
          nombre: docente[0].nombre,
          apellido: docente[0].apellido,
          apellido_materno: docente[0].apellido_materno,
          dni: docente[0].dni,
          email: docente[0].email,
          telefono: docente[0].telefono,
          fecha_registro: docente[0].fecha_registro,
          estado: docente[0].estado
        }
      };

      res.json(respuesta);
    } catch (error) {
      console.error("Error al obtener datos del docente:", error);
      res.status(500).json({
        message: "Error al obtener los datos del docente"
      });
    } finally {
      connection.release();
    }
  },

  // Exportar datos del docente a Excel
  exportarDatosDocenteExcel: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { anio } = req.params;

      if (!anio) {
        return res.status(400).json({
          message: "Se requiere el año"
        });
      }

      // Obtener datos completos de todos los docentes del año
      const [docentes] = await connection.query(
        `SELECT 
          d.id,
          p.nombre,
          p.ap_p as apellido_paterno,
          p.ap_m as apellido_materno,
          p.dni,
          p.fecha_nacimiento,
          u.email,
          d.created_at as fecha_registro,
          GROUP_CONCAT(
            DISTINCT
            CONCAT(c.nombre, ' - ', g.descripcion)
            SEPARATOR ', '
          ) as cursos
        FROM docente d
        INNER JOIN persona p ON d.id_persona = p.id
        INNER JOIN users u ON u.id_persona = p.id
        LEFT JOIN docente_curso dc ON d.id = dc.id_docente
        LEFT JOIN curso c ON dc.id_curso = c.id
        LEFT JOIN grado g ON dc.id_grado = g.id
        WHERE YEAR(d.created_at) = ?
        GROUP BY d.id, p.id, u.id
        ORDER BY d.id DESC`,
        [anio]
      );

      if (!docentes || docentes.length === 0) {
        return res.status(404).json({
          message: `No se encontraron docentes para el año ${anio}`
        });
      }

      // Crear un nuevo libro de Excel
      const workbook = new ExcelJS.Workbook();
      
      // Hoja 1: Información de Docentes
      const infoDocentes = workbook.addWorksheet('Docentes');
      
      // Definir las columnas
      infoDocentes.columns = [
        { header: 'Año', key: 'anio', width: 10 },
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Nombre', key: 'nombre', width: 20 },
        { header: 'Apellido Paterno', key: 'apellido_paterno', width: 20 },
        { header: 'Apellido Materno', key: 'apellido_materno', width: 20 },
        { header: 'DNI', key: 'dni', width: 15 },
        { header: 'Fecha de Nacimiento', key: 'fecha_nacimiento', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Fecha de Registro', key: 'fecha_registro', width: 20 },
        { header: 'Cursos', key: 'cursos', width: 40 }
      ];

      // Estilo para el encabezado
      infoDocentes.getRow(1).font = { bold: true };
      infoDocentes.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };

      // Agregar los datos
      docentes.forEach(docente => {
        infoDocentes.addRow({
          anio: anio,
          id: docente.id,
          nombre: docente.nombre,
          apellido_paterno: docente.apellido_paterno,
          apellido_materno: docente.apellido_materno,
          dni: docente.dni,
          fecha_nacimiento: new Date(docente.fecha_nacimiento).toLocaleDateString(),
          email: docente.email,
          fecha_registro: new Date(docente.fecha_registro).toLocaleDateString(),
          cursos: docente.cursos || 'Sin cursos asignados'
        });
      });

      // Configurar respuesta
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=docentes_${anio}.xlsx`
      );

      // Enviar el archivo
      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error("Error al exportar datos de los docentes:", error);
      res.status(500).json({
        message: "Error al exportar los datos de los docentes"
      });
    } finally {
      connection.release();
    }
  }
};

module.exports = docenteController;
