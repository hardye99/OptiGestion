"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, User, Eye, FileText, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Cliente } from "@/lib/types";
import { toast } from "sonner";

export default function VerClientePage() {
  const params = useParams();
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [recetas, setRecetas] = useState<any[]>([]);
  const [citas, setCitas] = useState<any[]>([]);

  useEffect(() => {
    if (params.id) {
      cargarCliente();
      cargarRecetas();
      cargarCitas();
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
      setCliente(data);
    } catch (error) {
      console.error('Error al cargar cliente:', error);
      toast.error('Error al cargar cliente');
    } finally {
      setLoading(false);
    }
  };

  const cargarRecetas = async () => {
    try {
      const { data } = await supabase
        .from('recetas')
        .select('*')
        .eq('cliente_id', params.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecetas(data || []);
    } catch (error) {
      console.error('Error al cargar recetas:', error);
    }
  };

  const cargarCitas = async () => {
    try {
      const { data } = await supabase
        .from('citas')
        .select('*')
        .eq('cliente_id', params.id)
        .order('fecha', { ascending: false })
        .limit(5);

      setCitas(data || []);
    } catch (error) {
      console.error('Error al cargar citas:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información del cliente...</p>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Cliente no encontrado</h2>
          <p className="text-gray-600 mb-6">El cliente que buscas no existe</p>
          <Link href="/clientes">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              Volver a Clientes
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clientes">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Perfil del Cliente</h1>
            <p className="text-gray-500">Información detallada y historial</p>
          </div>
        </div>
        <Link href={`/clientes/${cliente.id}/editar`}>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-md font-semibold transition transform hover:-translate-y-1 flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Cliente
          </button>
        </Link>
      </div>

      {/* Información principal del cliente */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30">
            <User className="h-12 w-12 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">
              {cliente.nombre} {cliente.apellido}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-blue-100">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{cliente.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{cliente.telefono}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{cliente.ciudad || 'No especificada'}</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-sm font-semibold capitalize border border-white/30">
                Cliente {cliente.tipo_cliente}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de información */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información de contacto */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <User className="h-6 w-6 text-blue-600" />
            Información Personal
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Nombre completo</span>
              <span className="font-semibold text-gray-800">{cliente.nombre} {cliente.apellido}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Email</span>
              <span className="font-semibold text-gray-800">{cliente.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Teléfono</span>
              <span className="font-semibold text-gray-800">{cliente.telefono}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Dirección</span>
              <span className="font-semibold text-gray-800">{cliente.direccion || 'No especificada'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Ciudad</span>
              <span className="font-semibold text-gray-800">{cliente.ciudad || 'No especificada'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Tipo de cliente</span>
              <span className="font-semibold text-gray-800 capitalize">{cliente.tipo_cliente}</span>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-600" />
            Estadísticas
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Eye className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{recetas.length}</p>
              <p className="text-sm text-gray-600">Recetas</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{citas.length}</p>
              <p className="text-sm text-gray-600">Citas</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">
                {new Date(cliente.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
              </p>
              <p className="text-sm text-gray-600">Cliente desde</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <User className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600 capitalize">{cliente.tipo_cliente}</p>
              <p className="text-sm text-gray-600">Categoría</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recetas recientes */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Eye className="h-6 w-6 text-blue-600" />
            Recetas Recientes
          </h3>
          <Link href={`/recetas?cliente=${cliente.id}`}>
            <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
              Ver todas →
            </button>
          </Link>
        </div>
        {recetas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Eye className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p>No hay recetas registradas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recetas.map((receta) => (
              <div key={receta.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">Receta #{receta.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(receta.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <Link href={`/recetas/${receta.id}`}>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                      Ver detalles →
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Citas recientes */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-purple-600" />
            Citas Recientes
          </h3>
          <Link href={`/citas?cliente=${cliente.id}`}>
            <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
              Ver todas →
            </button>
          </Link>
        </div>
        {citas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p>No hay citas registradas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {citas.map((cita) => (
              <div key={cita.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{cita.motivo || 'Cita general'}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(cita.fecha).toLocaleDateString('es-ES')} - {cita.hora}
                    </p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      cita.estado === 'completada' ? 'bg-green-100 text-green-700' :
                      cita.estado === 'cancelada' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {cita.estado}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Observaciones */}
      {cliente.observaciones && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-yellow-600" />
            Observaciones
          </h3>
          <p className="text-gray-700 whitespace-pre-wrap">{cliente.observaciones}</p>
        </div>
      )}
    </div>
  );
}
