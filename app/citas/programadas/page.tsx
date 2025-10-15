// app/citas/programadas/page.tsx

"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Clock, Search, CheckCircle, XCircle, User } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { CitaConCliente } from "@/lib/types";
import { toast } from "sonner";

export default function CitasProgramadasPage() {
  const [citas, setCitas] = useState<CitaConCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");

  useEffect(() => {
    cargarCitas();
  }, []);

  const cargarCitas = async () => {
    try {
      const { data, error } = await supabase
        .from('citas')
        .select(`
          *,
          cliente:clientes(*)
        `)
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true });

      if (error) throw error;
      setCitas(data || []);
    } catch (error) {
      console.error('Error al cargar citas:', error);
      toast.error('Error al cargar citas');
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (citaId: string, nuevoEstado: 'completada' | 'cancelada') => {
    try {
      const { error } = await supabase
        .from('citas')
        .update({ estado: nuevoEstado })
        .eq('id', citaId);

      if (error) throw error;

      toast.success(`Cita ${nuevoEstado} exitosamente`);
      cargarCitas();
    } catch (error) {
      console.error('Error al actualizar cita:', error);
      toast.error('Error al actualizar cita');
    }
  };

  const citasFiltradas = citas.filter(cita => {
    const cliente = cita.cliente;
    const coincideBusqueda = !busqueda ||
      (cliente && `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(busqueda.toLowerCase()));

    const coincideEstado = filtroEstado === "todas" || cita.estado === filtroEstado;

    return coincideBusqueda && coincideEstado;
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completada':
        return 'bg-green-100 text-green-700';
      case 'cancelada':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Citas Programadas</h1>
          <p className="text-gray-500">Gestiona todas las citas agendadas</p>
        </div>
        <Link href="/citas">
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition">
            <ArrowLeft className="h-5 w-5" />
            Volver
          </button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow-md rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
            />
          </div>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
          >
            <option value="todas">Todas las citas</option>
            <option value="pendiente">Pendientes</option>
            <option value="completada">Completadas</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Tabla de citas */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Cargando citas...</p>
          </div>
        ) : citasFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay citas programadas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Cliente</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Fecha y Hora</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Motivo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Estado</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {citasFiltradas.map((cita) => (
                  <tr key={cita.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {cita.cliente ? `${cita.cliente.nombre} ${cita.cliente.apellido}` : 'Cliente no encontrado'}
                          </p>
                          <p className="text-sm text-gray-500">{cita.cliente?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {new Date(cita.fecha).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{cita.hora}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{cita.motivo || 'No especificado'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getEstadoColor(cita.estado)}`}>
                        {cita.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {cita.estado === 'pendiente' && (
                          <>
                            <button
                              onClick={() => cambiarEstado(cita.id, 'completada')}
                              className="p-2 hover:bg-green-50 rounded-lg transition"
                              title="Marcar como completada"
                            >
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            </button>
                            <button
                              onClick={() => cambiarEstado(cita.id, 'cancelada')}
                              className="p-2 hover:bg-red-50 rounded-lg transition"
                              title="Cancelar cita"
                            >
                              <XCircle className="h-5 w-5 text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
