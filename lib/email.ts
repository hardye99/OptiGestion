import { Resend } from 'resend';

// Inicializar Resend con la API Key
const resend = new Resend(process.env.RESEND_API_KEY);

// Email de origen (remitente)
const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';

/**
 * Enviar email de bienvenida cuando se crea un nuevo cliente
 */
export async function enviarEmailBienvenidaCliente(clienteData: {
  nombre: string;
  apellido: string;
  email: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [clienteData.email],
      subject: '¡Bienvenido a OptiGestión! 👓',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 20px;
                border-radius: 10px;
                text-align: center;
                margin-bottom: 30px;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 10px;
                margin-bottom: 20px;
              }
              .button {
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 30px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>👓 OptiGestión</h1>
              <p style="margin: 10px 0 0 0;">Tu Óptica de Confianza</p>
            </div>

            <div class="content">
              <h2>¡Hola ${clienteData.nombre} ${clienteData.apellido}! 👋</h2>

              <p>Nos complace darte la bienvenida a nuestra familia de clientes.</p>

              <p>Tu registro ha sido completado exitosamente. Ahora podrás disfrutar de:</p>

              <ul>
                <li>✅ Gestión de tus citas oftalmológicas</li>
                <li>✅ Historial de recetas y graduaciones</li>
                <li>✅ Recordatorios automáticos de citas</li>
                <li>✅ Atención personalizada y profesional</li>
              </ul>

              <p>Si tienes alguna pregunta o necesitas agendar una cita, no dudes en contactarnos.</p>

              <p style="margin-top: 30px;">
                <strong>¡Gracias por confiar en nosotros!</strong>
              </p>
            </div>

            <div class="footer">
              <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              <p>© ${new Date().getFullYear()} OptiGestión. Todos los derechos reservados.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error al enviar email de bienvenida:', error);
      return { success: false, error };
    }

    console.log('Email de bienvenida enviado:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error al enviar email de bienvenida:', error);
    return { success: false, error };
  }
}

/**
 * Enviar recordatorio de cita (1 día antes)
 */
export async function enviarRecordatorioCita(citaData: {
  clienteNombre: string;
  clienteApellido: string;
  clienteEmail: string;
  fecha: string;
  hora: string;
  motivo?: string;
}) {
  try {
    // Formatear fecha
    const fechaCita = new Date(citaData.fecha);
    const fechaFormateada = fechaCita.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [citaData.clienteEmail],
      subject: `📅 Recordatorio: Tienes una cita mañana - ${fechaFormateada}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 40px 20px;
                border-radius: 10px;
                text-align: center;
                margin-bottom: 30px;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 10px;
                margin-bottom: 20px;
              }
              .cita-info {
                background: white;
                border-left: 4px solid #10b981;
                padding: 20px;
                margin: 20px 0;
                border-radius: 5px;
              }
              .cita-info-item {
                display: flex;
                align-items: center;
                margin: 10px 0;
                font-size: 16px;
              }
              .cita-info-item strong {
                min-width: 100px;
                color: #059669;
              }
              .alert {
                background: #fef3c7;
                border: 2px solid #f59e0b;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 30px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📅 Recordatorio de Cita</h1>
              <p style="margin: 10px 0 0 0;">OptiGestión</p>
            </div>

            <div class="content">
              <h2>¡Hola ${citaData.clienteNombre} ${citaData.clienteApellido}! 👋</h2>

              <p>Te recordamos que <strong>mañana</strong> tienes una cita programada en nuestra óptica.</p>

              <div class="cita-info">
                <h3 style="margin-top: 0; color: #059669;">📋 Detalles de tu Cita</h3>

                <div class="cita-info-item">
                  <strong>📅 Fecha:</strong>
                  <span>${fechaFormateada}</span>
                </div>

                <div class="cita-info-item">
                  <strong>🕐 Hora:</strong>
                  <span>${citaData.hora}</span>
                </div>

                ${citaData.motivo ? `
                  <div class="cita-info-item">
                    <strong>📝 Motivo:</strong>
                    <span>${citaData.motivo}</span>
                  </div>
                ` : ''}
              </div>

              <div class="alert">
                <p style="margin: 0;">
                  <strong>⚠️ Importante:</strong> Si no puedes asistir, por favor avísanos con anticipación para reprogramar tu cita.
                </p>
              </div>

              <p style="margin-top: 30px;">
                <strong>¡Te esperamos!</strong> 😊
              </p>
            </div>

            <div class="footer">
              <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              <p>© ${new Date().getFullYear()} OptiGestión. Todos los derechos reservados.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error al enviar recordatorio de cita:', error);
      return { success: false, error };
    }

    console.log('Recordatorio de cita enviado:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error al enviar recordatorio de cita:', error);
    return { success: false, error };
  }
}

/**
 * Verificar si un email es válido
 */
export function esEmailValido(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
