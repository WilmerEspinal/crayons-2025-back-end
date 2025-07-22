const mp = require('../services/mercadoPago');
const { Preference } = require('mercadopago');
const Cuota = require('../models/Cuota');
const pool = require('../config/database');

const generarPagoCuota = async (req, res) => {
  let connection;
  try {
    const id_persona = req.user.id_persona;
    const { anio, tipo_cuota } = req.body;

    if (!anio || !tipo_cuota) {
      return res.status(400).json({ success: false, message: 'El año y el tipo de cuota son obligatorios' });
    }

    // Validar tipo de cuota
    const tiposValidos = ['matricula', '1','2','3','4','5','6','7','8','9','10','c1','c2','c3','c4','c5','c6','c7','c8','c9','c10'];
    if (!tiposValidos.includes(tipo_cuota.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Tipo de cuota no válido' });
    }

    connection = await pool.getConnection();
    // Buscar el alumno por id_persona y obtener el email desde users
    const [alumnoRow] = await connection.query(
      `SELECT a.id, p.dni, p.nombre, p.ap_p, p.ap_m, u.email
       FROM alumno a
       JOIN persona p ON a.id_persona = p.id
       JOIN users u ON u.id_persona = p.id
       WHERE a.id_persona = ?`,
      [id_persona]
    );
    if (!alumnoRow || alumnoRow.length === 0) {
      return res.status(404).json({ success: false, message: 'No se encontró el alumno autenticado' });
    }
    const alumno = alumnoRow[0];

    // Buscar la cuota del año correspondiente
    const cuotas = await Cuota.obtenerCuotasCompletasPorDniYAnio(alumno.dni, anio);
    if (!cuotas || cuotas.length === 0) {
      return res.status(404).json({ success: false, message: 'No se encontraron cuotas para el año seleccionado' });
    }
    const cuota = cuotas[0]; // Tomamos la más reciente

    // Determinar monto y estado
    let monto = 0;
    let estado = null;
    let descripcion = '';
    switch (tipo_cuota.toLowerCase()) {
      case 'matricula':
        monto = cuota.matricula_precio;
        estado = cuota.matricula_estado;
        descripcion = 'Pago de Matrícula';
        break;
      case '1': case 'c1':
        monto = cuota.c1;
        estado = cuota.c1_estado;
        descripcion = 'Pago de Cuota 1';
        break;
      case '2': case 'c2':
        monto = cuota.c2;
        estado = cuota.c2_estado;
        descripcion = 'Pago de Cuota 2';
        break;
      case '3': case 'c3':
        monto = cuota.c3;
        estado = cuota.c3_estado;
        descripcion = 'Pago de Cuota 3';
        break;
      case '4': case 'c4':
        monto = cuota.c4;
        estado = cuota.c4_estado;
        descripcion = 'Pago de Cuota 4';
        break;
      case '5': case 'c5':
        monto = cuota.c5;
        estado = cuota.c5_estado;
        descripcion = 'Pago de Cuota 5';
        break;
      case '6': case 'c6':
        monto = cuota.c6;
        estado = cuota.c6_estado;
        descripcion = 'Pago de Cuota 6';
        break;
      case '7': case 'c7':
        monto = cuota.c7;
        estado = cuota.c7_estado;
        descripcion = 'Pago de Cuota 7';
        break;
      case '8': case 'c8':
        monto = cuota.c8;
        estado = cuota.c8_estado;
        descripcion = 'Pago de Cuota 8';
        break;
      case '9': case 'c9':
        monto = cuota.c9;
        estado = cuota.c9_estado;
        descripcion = 'Pago de Cuota 9';
        break;
      case '10': case 'c10':
        monto = cuota.c10;
        estado = cuota.c10_estado;
        descripcion = 'Pago de Cuota 10';
        break;
    }

    if (estado === 1) {
      return res.status(400).json({ success: false, message: 'Esta cuota ya está pagada' });
    }
    if (monto <= 0) {
      return res.status(400).json({ success: false, message: 'El monto de la cuota es 0 o no está configurado' });
    }

    // Crear la referencia externa para identificar el pago
    const external_reference = `${alumno.dni}-${anio}-${tipo_cuota.toLowerCase()}`;

    // Crear preferencia de pago en Mercado Pago usando la nueva sintaxis
    const preferenciaData = {
      items: [
        {
          title: descripcion,
          unit_price: Number(monto),
          quantity: 1,
        }
      ],
      payer: {
        name: alumno.nombre,
        email: alumno.email,
        identification: {
          type: "DNI",
          number: String(alumno.dni) // Asegurar que sea string
        }
      },
      external_reference: external_reference,
      back_urls: {
        success: "https://tuapp.com/pago-exitoso",
        failure: "https://tuapp.com/pago-fallido",
        pending: "https://tuapp.com/pago-pendiente"
      },
      auto_return: "approved",
      notification_url: "https://tu-dominio.com/webhook/mercadopago" // Añadir URL de notificación
    };
    console.log('Preferencia a enviar a Mercado Pago:', JSON.stringify(preferenciaData, null, 2));

    const preference = new Preference(mp);
    const response = await preference.create({ body: preferenciaData });

    res.json({ 
      success: true, 
      init_point: response.body?.sandbox_init_point || response.body?.init_point || response.sandbox_init_point || response.init_point, 
      descripcion, 
      monto,
      preference_id: response.body?.id || response.id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error al crear preferencia de pago", error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

const webhookMercadoPago = async (req, res) => {
  try {
    const payment = req.body;

    // Solo procesar pagos aprobados
    if (payment.type === 'payment' && payment.data && payment.data.id) {
      // Obtener detalles del pago desde Mercado Pago
      const mpPayment = await Preference.mp.payment.findById(payment.data.id);
      const status = mpPayment.body.status;
      const description = mpPayment.body.description;
      const external_reference = mpPayment.body.external_reference;

      // Solo si el pago fue aprobado
      if (status === 'approved') {
        // Usar external_reference para identificar la cuota: "DNI-ANIO-TIPO_CUOTA"
        const ref = external_reference || description;
        if (ref) {
          const [dni, anio, tipo_cuota] = ref.split('-');
          if (dni && anio && tipo_cuota) {
            await Cuota.actualizarEstadoCuotaPorWebhook(dni, anio, tipo_cuota);
          }
        }
      }
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error en webhook de Mercado Pago:', error);
    res.status(500).send('Error');
  }
};

module.exports = { generarPagoCuota, webhookMercadoPago };