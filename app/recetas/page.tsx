"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Eye, FileText, Calendar, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface RecetaConCliente {
  id: string;
  fecha: string;
  ojo_derecho_esfera?: number;
  ojo_derecho_cilindro?: number;
  ojo_derecho_eje?: number;
  ojo_izquierdo_esfera?: number;
  ojo_izquierdo_cilindro?: number;
  ojo_izquierdo_eje?: number;
  distancia_pupilar?: number;
  observaciones?: string;
  created_at: string;
  cliente?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
}

export default function RecetasPage() {
  const searchParams = useSearchParams();
  const clienteParam = searchParams.get("cliente");

  const [busqueda, setBusqueda] = useState("");
  const [recetas, setRecetas] = useState<RecetaConCliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarRecetas();
  }, [clienteParam]);

  const cargarRecetas = async () => {
    try {
      let query = supabase
        .from('recetas')
        .select(`
          *,
          cliente:clientes(id, nombre, apellido, email)
        `)
        .order('created_at', { ascending: false });

      // Filtrar por cliente si se proporciona el parámetro
      if (clienteParam) {
        query = query.eq('cliente_id', clienteParam);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRecetas(data || []);
    } catch (error) {
      console.error('Error al cargar recetas:', error);
      toast.error('Error al cargar recetas');
    } finally {
      setLoading(false);
    }
  };

  const recetasFiltradas = recetas.filter(receta =>
    receta.cliente && (
      `${receta.cliente.nombre} ${receta.cliente.apellido}`.toLowerCase().includes(busqueda.toLowerCase()) ||
      receta.cliente.email.toLowerCase().includes(busqueda.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Recetas Oftalmológicas</h1>
          <p className="text-gray-500">Gestiona las recetas de tus clientes</p>
        </div>
        <Link href="/recetas/nueva">
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl shadow-md font-semibold transition transform hover:-translate-y-1 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nueva Receta
          </button>
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Recetas</p>
              <p className="text-2xl font-bold text-gray-800">{loading ? '...' : recetas.length}</p>
            </div>
            <FileText className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Este Mes</p>
              <p className="text-2xl font-bold text-gray-800">
                {loading ? '...' : recetas.filter(r => {
                  const created = new Date(r.created_at);
                  const now = new Date();
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Clientes con Recetas</p>
              <p className="text-2xl font-bold text-gray-800">
                {loading ? '...' : new Set(recetas.map(r => r.cliente?.id)).size}
              </p>
            </div>
            <User className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Lista de recetas */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Cliente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Fecha</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Ojo Derecho</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Ojo Izquierdo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">DP</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Cargando recetas...
                  </td>
                </tr>
              ) : recetasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No se encontraron recetas</p>
                  </td>
                </tr>
              ) : (
                recetasFiltradas.map((receta) => (
                  <tr key={receta.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {receta.cliente ? `${receta.cliente.nombre} ${receta.cliente.apellido}` : 'Sin cliente'}
                          </p>
                          <p className="text-sm text-gray-500">{receta.cliente?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {new Date(receta.fecha).toLocaleDateString('es-ES')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {receta.ojo_derecho_esfera !== null && receta.ojo_derecho_esfera !== undefined ? (
                          <div>
                            <span className="font-mono">SPH: {receta.ojo_derecho_esfera > 0 ? '+' : ''}{receta.ojo_derecho_esfera}</span>
                            {receta.ojo_derecho_cilindro && (
                              <span className="font-mono ml-2">CYL: {receta.ojo_derecho_cilindro > 0 ? '+' : ''}{receta.ojo_derecho_cilindro}</span>
                            )}
                            {receta.ojo_derecho_eje && (
                              <span className="font-mono ml-2">EJE: {receta.ojo_derecho_eje}°</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {receta.ojo_izquierdo_esfera !== null && receta.ojo_izquierdo_esfera !== undefined ? (
                          <div>
                            <span className="font-mono">SPH: {receta.ojo_izquierdo_esfera > 0 ? '+' : ''}{receta.ojo_izquierdo_esfera}</span>
                            {receta.ojo_izquierdo_cilindro && (
                              <span className="font-mono ml-2">CYL: {receta.ojo_izquierdo_cilindro > 0 ? '+' : ''}{receta.ojo_izquierdo_cilindro}</span>
                            )}
                            {receta.ojo_izquierdo_eje && (
                              <span className="font-mono ml-2">EJE: {receta.ojo_izquierdo_eje}°</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-gray-600">
                        {receta.distancia_pupilar ? `${receta.distancia_pupilar} mm` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/recetas/${receta.id}`}>
                          <button className="p-2 hover:bg-purple-50 rounded-lg transition" title="Ver detalles">
                            <Eye className="h-5 w-5 text-purple-600" />
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
