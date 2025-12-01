"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, ArrowLeft, User, FileText, Glasses } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Cliente } from "@/lib/types";
import { toast } from "sonner";

export default function NuevaRecetaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteIdParam = searchParams.get('cliente_id');

  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  
  const [formData, setFormData] = useState({
    cliente_id: clienteIdParam || "",
    fecha: new Date().toISOString().split('T')[0],
    od_esfera: "",
    od_cilindro: "",
    od_eje: "",
    oi_esfera: "",
    oi_cilindro: "",
    oi_eje: "",
    distancia_pupilar: "",
    observaciones: ""
  });

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      // CORRECCIÓN: Seleccionar '*' para coincidir con la interfaz 'Cliente' completa
      const { data, error } = await supabase
        .from('clientes')
        .select('*') 
        .order('nombre');
      
      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      toast.error('No se pudieron cargar los clientes');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cliente_id) {
      toast.error("Debes seleccionar un cliente");
      return;
    }

    setLoading(true);

    try {
      const recetaData = {
        cliente_id: formData.cliente_id,
        fecha: formData.fecha,
        ojo_derecho_esfera: formData.od_esfera ? parseFloat(formData.od_esfera) : null,
        ojo_derecho_cilindro: formData.od_cilindro ? parseFloat(formData.od_cilindro) : null,
        ojo_derecho_eje: formData.od_eje ? parseInt(formData.od_eje) : null,
        ojo_izquierdo_esfera: formData.oi_esfera ? parseFloat(formData.oi_esfera) : null,
        ojo_izquierdo_cilindro: formData.oi_cilindro ? parseFloat(formData.oi_cilindro) : null,
        ojo_izquierdo_eje: formData.oi_eje ? parseInt(formData.oi_eje) : null,
        distancia_pupilar: formData.distancia_pupilar ? parseFloat(formData.distancia_pupilar) : null,
        observaciones: formData.observaciones || null
      };

      const { error } = await supabase
        .from('recetas')
        .insert([recetaData]);

      if (error) throw error;

      toast.success('Receta guardada exitosamente');
      router.push('/recetas'); 
    } catch (error: any) {
      console.error('Error al guardar receta:', error);
      toast.error(error.message || 'Error al guardar la receta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Nueva Receta Oftalmológica</h1>
          <p className="text-gray-500">Registra los datos de graduación del paciente</p>
        </div>
        <Link href="/recetas">
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition">
            <ArrowLeft className="h-5 w-5" />
            Volver
          </button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-xl p-8">
        
        <div className="mb-8">
          <label className="block text-gray-700 font-medium mb-2 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Paciente <span className="text-red-500">*</span>
          </label>
          <select
            name="cliente_id"
            value={formData.cliente_id}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 bg-white"
          >
            <option value="">Seleccionar paciente...</option>
            {clientes.map(cliente => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre} {cliente.apellido}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Glasses className="h-5 w-5 text-blue-600" />
            Graduación
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Ojo Derecho (OD) */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h3 className="font-bold text-blue-800 mb-4 text-center">Ojo Derecho (OD)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Esfera</label>
                  <input
                    type="number"
                    step="0.25"
                    name="od_esfera"
                    value={formData.od_esfera}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border rounded-lg text-gray-900 text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Cilindro</label>
                  <input
                    type="number"
                    step="0.25"
                    name="od_cilindro"
                    value={formData.od_cilindro}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border rounded-lg text-gray-900 text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Eje</label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    name="od_eje"
                    value={formData.od_eje}
                    onChange={handleChange}
                    placeholder="0-180"
                    className="w-full px-3 py-2 border rounded-lg text-gray-900 text-center"
                  />
                </div>
              </div>
            </div>

            {/* Ojo Izquierdo (OI) */}
            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
              <h3 className="font-bold text-green-800 mb-4 text-center">Ojo Izquierdo (OI)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Esfera</label>
                  <input
                    type="number"
                    step="0.25"
                    name="oi_esfera"
                    value={formData.oi_esfera}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border rounded-lg text-gray-900 text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Cilindro</label>
                  <input
                    type="number"
                    step="0.25"
                    name="oi_cilindro"
                    value={formData.oi_cilindro}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border rounded-lg text-gray-900 text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Eje</label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    name="oi_eje"
                    value={formData.oi_eje}
                    onChange={handleChange}
                    placeholder="0-180"
                    className="w-full px-3 py-2 border rounded-lg text-gray-900 text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Distancia Pupilar (DP)</label>
            <input
              type="number"
              step="0.5"
              name="distancia_pupilar"
              value={formData.distancia_pupilar}
              onChange={handleChange}
              placeholder="Ej: 64"
              className="w-full px-4 py-3 border rounded-lg text-gray-900"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Fecha de Receta</label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-lg text-gray-900"
            />
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-gray-700 font-medium mb-2 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Observaciones
          </label>
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            rows={3}
            placeholder="Notas adicionales (tipo de lente recomendado, adición, etc.)"
            className="w-full px-4 py-3 border rounded-lg resize-none text-gray-900"
          />
        </div>

        <div className="flex justify-end gap-4">
          <Link href="/recetas">
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
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {loading ? 'Guardando...' : 'Guardar Receta'}
          </button>
        </div>
      </form>
    </div>
  );
}
