"use client";

import { useState, useEffect } from "react";
import { Plus, TrendingUp, TrendingDown, Package, Calendar, Filter, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { MovimientoConProducto } from "@/lib/types";

export default function HistorialMovimientosPage() {
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [movimientos, setMovimientos] = useState<MovimientoConProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    entradasHoy: 0,
    salidasHoy: 0,
    balance: 0
  });

  useEffect(() => {
    cargarMovimientos();
    cargarEstadisticas();
  }, []);

  const cargarMovimientos = async () => {
    try {
      const { data, error } = await supabase
        .from('movimientos_inventario')
        .select(`
          *,
          producto:productos(nombre)
        `)
        .order('fecha', { ascending: false });

      if (error) throw error;
      setMovimientos(data || []);
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const hoy = new Date().toISOString().split('T')[0];

      // Entradas de hoy
      const { data: entradas } = await supabase
        .from('movimientos_inventario')
        .select('cantidad')
        .eq('tipo', 'entrada')
        .gte('fecha', hoy);

      const totalEntradas = entradas?.reduce((acc, m) => acc + m.cantidad, 0) || 0;

      // Salidas de hoy
      const { data: salidas } = await supabase
        .from('movimientos_inventario')
        .select('cantidad')
        .eq('tipo', 'salida')
        .gte('fecha', hoy);

      const totalSalidas = salidas?.reduce((acc, m) => acc + Math.abs(m.cantidad), 0) || 0;

      setEstadisticas({
        entradasHoy: totalEntradas,
        salidasHoy: totalSalidas,
        balance: totalEntradas - totalSalidas
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const movimientosFiltrados = movimientos.filter(mov => {
    const coincideTipo = filtroTipo === "todos" || mov.tipo === filtroTipo;
    const coincideBusqueda = !busqueda || (mov.producto?.nombre || '').toLowerCase().includes(busqueda.toLowerCase());
    return coincideTipo && coincideBusqueda;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Historial de Movimientos</h1>
          <p className="text-gray-500">Registro completo de entradas, salidas y ajustes</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-md font-semibold transition transform hover:-translate-y-1 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Nuevo Movimiento
        </button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Entradas (hoy)</p>
              <p className="text-2xl font-bold text-green-600">
                {loading ? '...' : `+${estadisticas.entradasHoy}`}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Salidas (hoy)</p>
              <p className="text-2xl font-bold text-red-600">
                {loading ? '...' : `-${estadisticas.salidasHoy}`}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Balance</p>
              <p className={`text-2xl font-bold ${estadisticas.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {loading ? '...' : `${estadisticas.balance >= 0 ? '+' : ''}${estadisticas.balance}`}
              </p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-white"
            >
              <option value="todos">Todos los tipos</option>
              <option value="entrada">Entradas</option>
              <option value="salida">Salidas</option>
              <option value="ajuste">Ajustes</option>
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="date"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tabla de movimientos */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Tipo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Producto</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Cantidad</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Fecha</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Usuario</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Cargando movimientos...
                  </td>
                </tr>
              ) : movimientosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No hay movimientos registrados
                  </td>
                </tr>
              ) : (
                movimientosFiltrados.map((mov) => (
                  <tr key={mov.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {mov.tipo === "entrada" ? (
                          <div className="p-2 bg-green-100 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          </div>
                        ) : mov.tipo === "salida" ? (
                          <div className="p-2 bg-red-100 rounded-lg">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          </div>
                        ) : (
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <Package className="h-4 w-4 text-yellow-600" />
                          </div>
                        )}
                        <span className="font-medium capitalize">{mov.tipo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">{mov.producto?.nombre || 'Producto desconocido'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${
                        mov.tipo === "entrada" ? "text-green-600" :
                        mov.tipo === "salida" ? "text-red-600" : "text-yellow-600"
                      }`}>
                      {mov.tipo === "entrada" ? "+" : mov.tipo === "salida" ? "-" : ""}{mov.cantidad}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(mov.fecha).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{mov.usuario || 'Sistema'}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{mov.motivo || 'Sin motivo especificado'}</span>
                  </td>
                </tr>
              )))
            }
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen del día */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Resumen del día</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-blue-100 text-sm">Total entradas</p>
            <p className="text-2xl font-bold">{loading ? '...' : `${estadisticas.entradasHoy} unidades`}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Total salidas</p>
            <p className="text-2xl font-bold">{loading ? '...' : `${estadisticas.salidasHoy} unidades`}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Movimientos registrados</p>
            <p className="text-2xl font-bold">{loading ? '...' : `${movimientos.length} operaciones`}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
