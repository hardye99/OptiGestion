import { NextRequest, NextResponse } from 'next/server';
import { enviarEmailBienvenidaCliente } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Debug: Verificar que las variables de entorno estén cargadas
    console.log('=== DEBUG EMAIL API ===');
    console.log('RESEND_API_KEY existe:', !!process.env.RESEND_API_KEY);
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

    if (!process.env.RESEND_API_KEY) {
      console.error('ERROR: RESEND_API_KEY no está configurada');
      return NextResponse.json(
        { error: 'Configuración de email incompleta. Falta RESEND_API_KEY' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { nombre, apellido, email } = body;

    console.log('Enviando email a:', email);

    // Validar datos
    if (!nombre || !apellido || !email) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Enviar email
    const result = await enviarEmailBienvenidaCliente({
      nombre,
      apellido,
      email,
    });

    if (!result.success) {
      console.error('Error al enviar email:', result.error);
      return NextResponse.json(
        { error: 'Error al enviar email', details: result.error },
        { status: 500 }
      );
    }

    console.log('Email enviado exitosamente');
    return NextResponse.json({
      success: true,
      message: 'Email de bienvenida enviado correctamente',
      data: result.data,
    });
  } catch (error) {
    console.error('Error en API de email de bienvenida:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
