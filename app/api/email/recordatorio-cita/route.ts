import { NextRequest, NextResponse } from 'next/server';
import { enviarRecordatorioCita } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clienteNombre, clienteApellido, clienteEmail, fecha, hora, motivo } = body;

    // Validar datos
    if (!clienteNombre || !clienteApellido || !clienteEmail || !fecha || !hora) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Enviar email
    const result = await enviarRecordatorioCita({
      clienteNombre,
      clienteApellido,
      clienteEmail,
      fecha,
      hora,
      motivo,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Error al enviar recordatorio', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Recordatorio de cita enviado correctamente',
      data: result.data,
    });
  } catch (error) {
    console.error('Error en API de recordatorio de cita:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
