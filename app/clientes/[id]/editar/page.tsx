"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, User, Mail, Phone, MapPin, FileText, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Cliente } from "@/lib/types";
import { toast } from "sonner";

export default function EditarClientePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    tipo_cliente: 'normal',
    observaciones: ''
  });

  useEffect(() => {
    if (params.id) {
      cargarCliente();
    }
  }, [params.id]);

  const cargarCliente = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;

      setFormData({
        nombre: data.nombre || '',
        apellido: data.apellido || '',
        email: data.email || '',
        telefono: data.telefono || '',
        direccion: data.direccion || '',
        ciudad: data.ciudad || '',
        tipo_cliente: data.tipo_cliente || 'normal',
        observaciones: data.observaciones || ''
      });
    } catch (error) {
      console.error('Error al cargar cliente:', error);
      toast.error('Error al cargar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const { error } = await supabase
        .from('clientes')
        .update({
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          telefono: formData.telefono,
          direccion: formData.direccion || null,
          ciudad: formData.ciudad || null,
          tipo_cliente: formData.tipo_cliente,
          observaciones: formData.observaciones || null,
        })
        .eq('id', params.id);

      if (error) throw error;

      toast.success('Cliente actualizado exitosamente');
      router.push(`/clientes/${params.id}`);
    } catch (error: any) {
      console.error('Error al actualizar cliente:', error);
      toast.error(error.message || 'Error al actualizar cliente');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/clientes/${params.id}`}>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Editar Cliente</h1>
            <p className="text-gray-500">Actualiza la información del cliente</p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8">
        <div className="space-y-6">
          {/* Información Personal */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 pb-3 border-b">
              <User className="h-6 w-6 text-blue-600" />
              Información Personal
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Ej: Juan"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Ej: Pérez"
                />
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 pb-3 border-b">
              <Phone className="h-6 w-6 text-green-600" />
              Información de Contacto
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="123-456-7890"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 pb-3 border-b">
              <MapPin className="h-6 w-6 text-purple-600" />
              Ubicación
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Calle Principal #123"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Ciudad de México"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Cliente
                </label>
                <select
                  value={formData.tipo_cliente}
                  onChange={(e) => setFormData({ ...formData, tipo_cliente: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                >
                  <option value="normal">Normal</option>
                  <option value="vip">VIP</option>
                  <option value="mayorista">Mayorista</option>
                </select>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 pb-3 border-b">
              <FileText className="h-6 w-6 text-orange-600" />
              Observaciones
            </h2>

            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
              rows={4}
              placeholder="Notas adicionales sobre el cliente..."
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-8 flex items-center justify-end gap-4 pt-6 border-t">
          <Link href={`/clientes/${params.id}`}>
            <button
              type="button"
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition flex items-center gap-2"
            >
              <X className="h-5 w-5" />
              Cancelar
            </button>
          </Link>

          <button
            type="submit"
            disabled={guardando}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition transform hover:-translate-y-1 shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Save className="h-5 w-5" />
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>

      {/* Información de ayuda */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Consejos para editar
            </h3>
            <ul className="text-gray-700 text-sm space-y-1 list-disc list-inside">
              <li>Los campos marcados con * son obligatorios</li>
              <li>Asegúrate de que el email sea válido y único</li>
              <li>El tipo de cliente puede afectar descuentos y beneficios</li>
              <li>Las observaciones son privadas y solo visibles para el personal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
