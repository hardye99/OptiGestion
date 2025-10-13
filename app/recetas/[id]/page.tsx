"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, User, Calendar, FileText, Printer } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface RecetaCompleta {
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
    telefono: string;
  };
}

export default function VerRecetaPage() {
  const params = useParams();
  const router = useRouter();
  const [receta, setReceta] = useState<RecetaCompleta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      cargarReceta();
    }
  }, [params.id]);

  const cargarReceta = async () => {
    try {
      const { data, error } = await supabase
        .from('recetas')
        .select(`
          *,
          cliente:clientes(id, nombre, apellido, email, telefono)
        `)
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setReceta(data);
    } catch (error) {
      console.error('Error al cargar receta:', error);
      toast.error('Error al cargar receta');
    } finally {
      setLoading(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando receta...</p>
        </div>
      </div>
    );
  }

  if (!receta) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Receta no encontrada</h2>
          <p className="text-gray-600 mb-6">La receta que buscas no existe</p>
          <Link href="/recetas">
            <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
              Volver a Recetas
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/recetas">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Receta Oftalmológica</h1>
            <p className="text-gray-500">Detalles completos de la receta</p>
          </div>
        </div>
        <button
          onClick={handleImprimir}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl shadow-md font-semibold transition transform hover:-translate-y-1 flex items-center gap-2"
        >
          <Printer className="h-5 w-5" />
          Imprimir
        </button>
      </div>

      {/* Información del cliente */}
      {receta.cliente && (
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30">
              <User className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {receta.cliente.nombre} {receta.cliente.apellido}
              </h2>
              <div className="flex items-center gap-4 text-purple-100">
                <span>{receta.cliente.email}</span>
                <span>•</span>
                <span>{receta.cliente.telefono}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información de la receta */}
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Fecha de Emisión</p>
              <p className="text-lg font-bold text-gray-800">
                {new Date(receta.fecha).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Número de Receta</p>
              <p className="text-lg font-bold text-gray-800 font-mono">#{receta.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Prescripción Oftalmológica */}
        <div className="border-t pt-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Prescripción Oftalmológica</h3>

          {/* Tabla de valores */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-6 py-4 text-left font-bold text-gray-700">Ojo</th>
                  <th className="border border-gray-300 px-6 py-4 text-center font-bold text-gray-700">Esfera (SPH)</th>
                  <th className="border border-gray-300 px-6 py-4 text-center font-bold text-gray-700">Cilindro (CYL)</th>
                  <th className="border border-gray-300 px-6 py-4 text-center font-bold text-gray-700">Eje (AXIS)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-6 py-4 font-semibold text-gray-800">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-blue-600" />
                      Ojo Derecho (OD)
                    </div>
                  </td>
                  <td className="border border-gray-300 px-6 py-4 text-center font-mono text-lg">
                    {receta.ojo_derecho_esfera !== null && receta.ojo_derecho_esfera !== undefined ? (
                      <span className="font-bold text-blue-600">
                        {receta.ojo_derecho_esfera > 0 ? '+' : ''}{receta.ojo_derecho_esfera}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="border border-gray-300 px-6 py-4 text-center font-mono text-lg">
                    {receta.ojo_derecho_cilindro !== null && receta.ojo_derecho_cilindro !== undefined ? (
                      <span className="font-bold text-blue-600">
                        {receta.ojo_derecho_cilindro > 0 ? '+' : ''}{receta.ojo_derecho_cilindro}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="border border-gray-300 px-6 py-4 text-center font-mono text-lg">
                    {receta.ojo_derecho_eje !== null && receta.ojo_derecho_eje !== undefined ? (
                      <span className="font-bold text-blue-600">{receta.ojo_derecho_eje}°</span>
                    ) : '-'}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-6 py-4 font-semibold text-gray-800">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-purple-600" />
                      Ojo Izquierdo (OI)
                    </div>
                  </td>
                  <td className="border border-gray-300 px-6 py-4 text-center font-mono text-lg">
                    {receta.ojo_izquierdo_esfera !== null && receta.ojo_izquierdo_esfera !== undefined ? (
                      <span className="font-bold text-purple-600">
                        {receta.ojo_izquierdo_esfera > 0 ? '+' : ''}{receta.ojo_izquierdo_esfera}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="border border-gray-300 px-6 py-4 text-center font-mono text-lg">
                    {receta.ojo_izquierdo_cilindro !== null && receta.ojo_izquierdo_cilindro !== undefined ? (
                      <span className="font-bold text-purple-600">
                        {receta.ojo_izquierdo_cilindro > 0 ? '+' : ''}{receta.ojo_izquierdo_cilindro}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="border border-gray-300 px-6 py-4 text-center font-mono text-lg">
                    {receta.ojo_izquierdo_eje !== null && receta.ojo_izquierdo_eje !== undefined ? (
                      <span className="font-bold text-purple-600">{receta.ojo_izquierdo_eje}°</span>
                    ) : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Distancia Pupilar */}
          {receta.distancia_pupilar && (
            <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Distancia Pupilar (DP)</p>
                  <p className="text-3xl font-bold text-blue-600 font-mono">{receta.distancia_pupilar} mm</p>
                </div>
                <Eye className="h-12 w-12 text-blue-400" />
              </div>
            </div>
          )}
        </div>

        {/* Observaciones */}
        {receta.observaciones && (
          <div className="border-t pt-8 mt-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Observaciones</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <p className="text-gray-700 whitespace-pre-wrap">{receta.observaciones}</p>
            </div>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 print:hidden">
        <h3 className="font-bold text-blue-800 mb-2">ℹ️ Información sobre la receta</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>SPH (Esfera):</strong> Valores negativos (-) indican miopía, positivos (+) hipermetropía</li>
          <li>• <strong>CYL (Cilindro):</strong> Mide la corrección necesaria para el astigmatismo</li>
          <li>• <strong>AXIS (Eje):</strong> Orientación del astigmatismo en grados (0-180°)</li>
          <li>• <strong>DP (Distancia Pupilar):</strong> Distancia entre las pupilas en milímetros</li>
        </ul>
      </div>

      {/* Botón para volver al perfil del cliente */}
      {receta.cliente && (
        <div className="print:hidden">
          <Link href={`/clientes/${receta.cliente.id}`}>
            <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold transition">
              Ver Perfil del Cliente
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
