"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, Save, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Cliente } from "@/lib/types";
import { toast } from "sonner";

export default function NuevaRecetaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteId = searchParams.get("cliente");

  const [loading, setLoading] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState({
    cliente_id: clienteId || "",
    fecha: new Date().toISOString().split('T')[0],
    ojo_derecho_esfera: "",
    ojo_derecho_cilindro: "",
    ojo_derecho_eje: "",
    ojo_izquierdo_esfera: "",
    ojo_izquierdo_cilindro: "",
    ojo_izquierdo_eje: "",
    distancia_pupilar: "",
    observaciones: "",
  });

  useEffect(() => {
    if (clienteId) {
      cargarCliente(clienteId);
      setFormData(prev => ({ ...prev, cliente_id: clienteId }));
    }
  }, [clienteId]);

  const cargarCliente = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCliente(data);
    } catch (error) {
      console.error('Error al cargar cliente:', error);
      toast.error('Error al cargar información del cliente');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar que se haya seleccionado un cliente
      if (!formData.cliente_id) {
        toast.error('Debe seleccionar un cliente');
        setLoading(false);
        return;
      }

      // Preparar datos para inserción
      const recetaData = {
        cliente_id: formData.cliente_id,
        fecha: formData.fecha,
        ojo_derecho_esfera: formData.ojo_derecho_esfera ? parseFloat(formData.ojo_derecho_esfera) : null,
        ojo_derecho_cilindro: formData.ojo_derecho_cilindro ? parseFloat(formData.ojo_derecho_cilindro) : null,
        ojo_derecho_eje: formData.ojo_derecho_eje ? parseInt(formData.ojo_derecho_eje) : null,
        ojo_izquierdo_esfera: formData.ojo_izquierdo_esfera ? parseFloat(formData.ojo_izquierdo_esfera) : null,
        ojo_izquierdo_cilindro: formData.ojo_izquierdo_cilindro ? parseFloat(formData.ojo_izquierdo_cilindro) : null,
        ojo_izquierdo_eje: formData.ojo_izquierdo_eje ? parseInt(formData.ojo_izquierdo_eje) : null,
        distancia_pupilar: formData.distancia_pupilar ? parseFloat(formData.distancia_pupilar) : null,
        observaciones: formData.observaciones || null,
      };

      const { data, error } = await supabase
        .from('recetas')
        .insert([recetaData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Receta creada exitosamente');
      router.push(`/clientes/${formData.cliente_id}`);
    } catch (error) {
      console.error('Error al crear receta:', error);
      toast.error('Error al crear la receta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clientes">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Nueva Receta Oftalmológica</h1>
          <p className="text-gray-500">Registra una nueva receta para el cliente</p>
        </div>
      </div>

      {/* Información del cliente */}
      {cliente && (
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {cliente.nombre} {cliente.apellido}
              </h2>
              <p className="text-purple-100">{cliente.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8 space-y-8">
        {/* Fecha */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Fecha de la Receta *
          </label>
          <input
            type="date"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        {/* Ojo Derecho */}
        <div className="border-t pt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Eye className="h-6 w-6 text-purple-600" />
            Ojo Derecho (OD)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Esfera (SPH)
              </label>
              <input
                type="number"
                step="0.25"
                name="ojo_derecho_esfera"
                value={formData.ojo_derecho_esfera}
                onChange={handleChange}
                placeholder="-3.50"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Ejemplo: -3.50, +2.00</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cilindro (CYL)
              </label>
              <input
                type="number"
                step="0.25"
                name="ojo_derecho_cilindro"
                value={formData.ojo_derecho_cilindro}
                onChange={handleChange}
                placeholder="-1.00"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Ejemplo: -1.00, +0.50</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Eje (AXIS)
              </label>
              <input
                type="number"
                min="0"
                max="180"
                name="ojo_derecho_eje"
                value={formData.ojo_derecho_eje}
                onChange={handleChange}
                placeholder="90"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Rango: 0-180°</p>
            </div>
          </div>
        </div>

        {/* Ojo Izquierdo */}
        <div className="border-t pt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Eye className="h-6 w-6 text-purple-600" />
            Ojo Izquierdo (OI)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Esfera (SPH)
              </label>
              <input
                type="number"
                step="0.25"
                name="ojo_izquierdo_esfera"
                value={formData.ojo_izquierdo_esfera}
                onChange={handleChange}
                placeholder="-3.50"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Ejemplo: -3.50, +2.00</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cilindro (CYL)
              </label>
              <input
                type="number"
                step="0.25"
                name="ojo_izquierdo_cilindro"
                value={formData.ojo_izquierdo_cilindro}
                onChange={handleChange}
                placeholder="-1.00"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Ejemplo: -1.00, +0.50</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Eje (AXIS)
              </label>
              <input
                type="number"
                min="0"
                max="180"
                name="ojo_izquierdo_eje"
                value={formData.ojo_izquierdo_eje}
                onChange={handleChange}
                placeholder="90"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Rango: 0-180°</p>
            </div>
          </div>
        </div>

        {/* Distancia Pupilar */}
        <div className="border-t pt-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Distancia Pupilar (DP)
            </label>
            <input
              type="number"
              step="0.5"
              name="distancia_pupilar"
              value={formData.distancia_pupilar}
              onChange={handleChange}
              placeholder="63"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Distancia entre pupilas en milímetros (ejemplo: 63 mm)</p>
          </div>
        </div>

        {/* Observaciones */}
        <div className="border-t pt-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Observaciones
          </label>
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            rows={4}
            placeholder="Notas adicionales sobre la receta..."
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
          />
        </div>

        {/* Botones */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl shadow-md font-semibold transition transform hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Guardar Receta
              </>
            )}
          </button>
          <Link href="/clientes" className="flex-1">
            <button
              type="button"
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold transition"
            >
              Cancelar
            </button>
          </Link>
        </div>
      </form>

      {/* Ayuda */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-800 mb-2">ℹ️ Información sobre la receta</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Esfera (SPH):</strong> Mide la miopía (-) o hipermetropía (+)</li>
          <li>• <strong>Cilindro (CYL):</strong> Mide el astigmatismo</li>
          <li>• <strong>Eje (AXIS):</strong> Orientación del astigmatismo (0-180°)</li>
          <li>• <strong>Distancia Pupilar (DP):</strong> Distancia entre las pupilas en milímetros</li>
        </ul>
      </div>
    </div>
  );
}
