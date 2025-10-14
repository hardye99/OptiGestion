// app/clientes/nuevo/page.tsx

"use client";

import { useState } from "react";
import { User, Mail, Phone, MapPin, Calendar, FileText, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function NuevoClientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    fechaNacimiento: "",
    direccion: "",
    ciudad: "",
    codigoPostal: "",
    observaciones: "",
    tipoCliente: "regular"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          telefono: formData.telefono,
          fecha_nacimiento: formData.fechaNacimiento || null,
          direccion: formData.direccion || null,
          ciudad: formData.ciudad || null,
          codigo_postal: formData.codigoPostal || null,
          observaciones: formData.observaciones || null,
          tipo_cliente: formData.tipoCliente as 'regular' | 'vip' | 'mayorista'
        }])
        .select();

      if (error) throw error;

      toast.success('Cliente creado exitosamente');
      router.push('/clientes');
    } catch (error: any) {
      console.error('Error al crear cliente:', error);
      toast.error(error.message || 'Error al crear cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Añadir Nuevo Cliente</h1>
          <p className="text-gray-500">Completa la información del cliente</p>
        </div>
        <Link href="/clientes">
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition">
            <ArrowLeft className="h-5 w-5" />
            Volver
          </button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-xl p-8">
        {/* Información Personal */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Información Personal
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Juan"
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Apellido <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                placeholder="Ej: Pérez"
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="+1 234-567-8900"
                  required
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Fecha de Nacimiento
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  name="fechaNacimiento"
                  value={formData.fechaNacimiento}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Tipo de Cliente
              </label>
              <select
                name="tipoCliente"
                value={formData.tipoCliente}
                onChange={handleChange}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
              >
                <option value="regular">Regular</option>
                <option value="vip">VIP</option>
                <option value="mayorista">Mayorista</option>
              </select>
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Dirección
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3">
              <label className="block text-gray-700 font-medium mb-2">
                Dirección
              </label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Calle, Número, Piso, Depto..."
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-2">
                Ciudad
              </label>
              <input
                type="text"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleChange}
                placeholder="Ej: Madrid"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Código Postal
              </label>
              <input
                type="text"
                name="codigoPostal"
                value={formData.codigoPostal}
                onChange={handleChange}
                placeholder="28001"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Observaciones
          </h2>

          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            placeholder="Notas adicionales sobre el cliente, preferencias, alergias, etc..."
            rows={4}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none text-gray-900"
          />
        </div>

        {/* Botones de acción */}
        <div className="flex gap-4 justify-end">
          <Link href="/clientes">
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
            <Save className="h-5 w-5" />
            {loading ? 'Guardando...' : 'Guardar Cliente'}
          </button>
        </div>
      </form>

      {/* Información de ayuda */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 mb-2">📋 Consejos para completar el formulario</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Los campos marcados con <span className="text-red-500">*</span> son obligatorios</li>
          <li>• Verifica que el correo electrónico sea válido para enviar notificaciones</li>
          <li>• Las observaciones pueden incluir preferencias visuales o información médica relevante</li>
          <li>• Los clientes VIP reciben descuentos y beneficios especiales</li>
        </ul>
      </div>
    </div>
  );
}
