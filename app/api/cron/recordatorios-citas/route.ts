import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { enviarRecordatorioCita } from '@/lib/email';

// Cliente de Supabase para el servidor
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * API Route para enviar recordatorios de citas
 * Se ejecuta diariamente para encontrar citas que sean mañana
 * y enviar recordatorios a los clientes
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación (opcional: agregar un API key)
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET || 'dev-secret-key'}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Calcular la fecha de mañana
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    const fechaMañana = mañana.toISOString().split('T')[0];

    console.log(`Buscando citas para mañana: ${fechaMañana}`);

    // Buscar citas pendientes para mañana con información del cliente
    const { data: citas, error } = await supabase
      .from('citas')
      .select(`
        id,
        fecha,
        hora,
        motivo,
        estado,
        cliente:clientes(nombre, apellido, email)
      `)
      .eq('fecha', fechaMañana)
      .eq('estado', 'pendiente');

    if (error) {
      console.error('Error al buscar citas:', error);
      throw error;
    }

    if (!citas || citas.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay citas para mañana',
        citasEncontradas: 0,
        recordatoriosEnviados: 0,
      });
    }

    console.log(`Encontradas ${citas.length} citas para mañana`);

    // Enviar recordatorios
    const resultados = await Promise.allSettled(
      citas.map(async (cita: any) => {
        if (!cita.cliente) {
          console.warn(`Cita ${cita.id} no tiene cliente asociado`);
          return { success: false, error: 'Sin cliente' };
        }

        return await enviarRecordatorioCita({
          clienteNombre: cita.cliente.nombre,
          clienteApellido: cita.cliente.apellido,
          clienteEmail: cita.cliente.email,
          fecha: cita.fecha,
          hora: cita.hora,
          motivo: cita.motivo,
        });
      })
    );

    // Contar exitosos y fallidos
    const exitosos = resultados.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;
    const fallidos = resultados.length - exitosos;

    console.log(`Recordatorios enviados: ${exitosos} exitosos, ${fallidos} fallidos`);

    return NextResponse.json({
      success: true,
      message: `Proceso completado`,
      citasEncontradas: citas.length,
      recordatoriosEnviados: exitosos,
      fallidos: fallidos,
      detalles: resultados.map((r, i) => ({
        cita: citas[i].id,
        cliente: citas[i].cliente?.email,
        resultado: r.status === 'fulfilled' ? 'exitoso' : 'fallido',
      })),
    });
  } catch (error) {
    console.error('Error en cron de recordatorios:', error);
    return NextResponse.json(
      {
        error: 'Error al procesar recordatorios',
        detalles: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
