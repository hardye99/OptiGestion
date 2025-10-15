// app/citas/agendar/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, User, FileText } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Cliente } from "@/lib/types";
import { toast } from "sonner";

export default function AgendarCitaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formData, setFormData] = useState({
    cliente_id: '',
    fecha: '',
    hora: '',
    motivo: '',
    observaciones: ''
  });

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const { data } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre');

      setClientes(data || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('citas')
        .insert([{
          cliente_id: formData.cliente_id,
          fecha: formData.fecha,
          hora: formData.hora,
          motivo: formData.motivo || null,
          observaciones: formData.observaciones || null,
          estado: 'pendiente'
        }]);

      if (error) throw error;

      toast.success('Cita agendada exitosamente');
      router.push('/citas/programadas');
    } catch (error: any) {
      console.error('Error al agendar cita:', error);
      toast.error(error.message || 'Error al agendar cita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Agendar Nueva Cita</h1>
          <p className="text-gray-500">Programa una cita con un cliente</p>
        </div>
        <Link href="/citas">
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition">
            <ArrowLeft className="h-5 w-5" />
            Volver
          </button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-xl p-8 max-w-2xl">
        <div className="space-y-6">
          {/* Cliente */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              Cliente <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.cliente_id}
              onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
            >
              <option value="">Seleccionar cliente</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} {cliente.apellido} - {cliente.email}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Hora <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={formData.hora}
                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
              />
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Motivo de la cita
            </label>
            <input
              type="text"
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
              placeholder="Ej: Examen de la vista, Entrega de lentes, etc."
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Observaciones
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none text-gray-900"
              rows={4}
              placeholder="Notas adicionales sobre la cita..."
            />
          </div>

          {/* Botones */}
          <div className="flex gap-4 justify-end pt-4">
            <Link href="/citas">
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Cancelar
              </button>
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar className="h-5 w-5" />
              {loading ? 'Agendando...' : 'Agendar Cita'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
