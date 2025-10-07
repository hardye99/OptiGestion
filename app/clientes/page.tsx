"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Edit, Trash2, Eye, Phone, Mail, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Cliente } from "@/lib/types";
import { toast } from "sonner";

export default function ClientesPage() {
  const [busqueda, setBusqueda] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecetas, setTotalRecetas] = useState(0);

  // Cargar clientes desde Supabase
  useEffect(() => {
    cargarClientes();
    cargarEstadisticas();
  }, []);

  const cargarClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const { count } = await supabase
        .from('recetas')
        .select('*', { count: 'exact', head: true });

      setTotalRecetas(count || 0);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const eliminarCliente = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Cliente eliminado exitosamente');
      cargarClientes();
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      toast.error('Error al eliminar cliente');
    }
  };

  const clientesFiltrados = clientes.filter(cliente =>
    `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(busqueda.toLowerCase()) ||
    cliente.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Calcular clientes nuevos del mes
  const clientesNuevosMes = clientes.filter(c => {
    const created = new Date(c.created_at);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
          <p className="text-gray-500">Administra tu base de clientes</p>
        </div>
        <Link href="/clientes/nuevo">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-md font-semibold transition transform hover:-translate-y-1 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nuevo Cliente
          </button>
        </Link>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-800">{loading ? '...' : clientes.length}</p>
            </div>
            <User className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Nuevos (este mes)</p>
              <p className="text-2xl font-bold text-gray-800">{loading ? '...' : clientesNuevosMes}</p>
            </div>
            <User className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Clientes VIP</p>
              <p className="text-2xl font-bold text-gray-800">{loading ? '...' : clientes.filter(c => c.tipo_cliente === 'vip').length}</p>
            </div>
            <User className="h-8 w-8 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Recetas Totales</p>
              <p className="text-2xl font-bold text-gray-800">{loading ? '...' : totalRecetas}</p>
            </div>
            <Eye className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cliente por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tabla de clientes */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Cliente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Contacto</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Fecha Registro</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Ciudad</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Cargando clientes...
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{cliente.nombre} {cliente.apellido}</p>
                          <p className="text-sm text-gray-500 capitalize">{cliente.tipo_cliente}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          {cliente.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          {cliente.telefono}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {new Date(cliente.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        {cliente.ciudad || 'No especificada'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/clientes/${cliente.id}`}>
                          <button className="p-2 hover:bg-blue-50 rounded-lg transition" title="Ver detalles">
                            <Eye className="h-5 w-5 text-blue-600" />
                          </button>
                        </Link>
                        <Link href={`/clientes/${cliente.id}/editar`}>
                          <button className="p-2 hover:bg-green-50 rounded-lg transition" title="Editar">
                            <Edit className="h-5 w-5 text-green-600" />
                          </button>
                        </Link>
                        <button
                          onClick={() => eliminarCliente(cliente.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition"
                          title="Eliminar"
                        >
                          <Trash2 className="h-5 w-5 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Sin resultados */}
        {!loading && clientesFiltrados.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron clientes</p>
          </div>
        )}
      </div>
    </div>
  );
}
