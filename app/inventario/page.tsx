"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, TrendingUp, TrendingDown, AlertTriangle, ArrowRight, BarChart3, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { MovimientoInventario, ProductoStockBajo } from "@/lib/types";

export default function InventarioPage() {
  const [periodo, setPeriodo] = useState("mes");
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    totalProductos: 0,
    valorTotal: 0,
    stockBajo: 0,
    movimientosHoy: 0
  });
  const [movimientosRecientes, setMovimientosRecientes] = useState<any[]>([]);
  const [alertasStock, setAlertasStock] = useState<ProductoStockBajo[]>([]);
  const [movimientosSemana, setMovimientosSemana] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Obtener estadísticas generales
      const { data: productos } = await supabase
        .from('productos')
        .select('precio, stock, stock_minimo')
        .eq('activo', true);

      const totalProductos = productos?.length || 0;
      const valorTotal = productos?.reduce((acc, p) => acc + (p.precio * p.stock), 0) || 0;
      const stockBajo = productos?.filter(p => p.stock <= p.stock_minimo).length || 0;

      // Obtener movimientos de hoy
      const hoy = new Date().toISOString().split('T')[0];
      const { count: movimientosHoy } = await supabase
        .from('movimientos_inventario')
        .select('*', { count: 'exact', head: true })
        .gte('fecha', hoy);

      setEstadisticas({
        totalProductos,
        valorTotal,
        stockBajo,
        movimientosHoy: movimientosHoy || 0
      });

      // Cargar movimientos de los últimos 7 días para la gráfica
      const movimientosPorDia: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = fecha.toISOString().split('T')[0];

        const { count } = await supabase
          .from('movimientos_inventario')
          .select('*', { count: 'exact', head: true })
          .gte('fecha', fechaStr)
          .lt('fecha', new Date(fecha.getTime() + 86400000).toISOString().split('T')[0]);

        movimientosPorDia.push(count || 0);
      }
      setMovimientosSemana(movimientosPorDia);

      // Cargar movimientos recientes con información del producto
      const { data: movimientos } = await supabase
        .from('movimientos_inventario')
        .select(`
          *,
          producto:productos(nombre, stock)
        `)
        .order('fecha', { ascending: false })
        .limit(5);

      setMovimientosRecientes(movimientos || []);

      // Cargar alertas de stock bajo usando la vista
      const { data: stockBajoData } = await supabase
        .from('productos_stock_bajo')
        .select('*')
        .limit(5);

      setAlertasStock(stockBajoData || []);
    } catch (error) {
      console.error('Error al cargar datos del inventario:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Inventario</h1>
          <p className="text-gray-500">Panel de control y seguimiento de stock</p>
        </div>
        <div className="flex gap-3">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="dia">Hoy</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
            <option value="año">Este Año</option>
          </select>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-xs text-green-600 font-semibold">+12%</span>
          </div>
          <p className="text-sm text-gray-500">Total Productos</p>
          <p className="text-2xl font-bold text-gray-800">{estadisticas.totalProductos}</p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-xs text-green-600 font-semibold">+8%</span>
          </div>
          <p className="text-sm text-gray-500">Valor Total</p>
          <p className="text-2xl font-bold text-gray-800">${estadisticas.valorTotal.toLocaleString()}</p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <span className="text-xs text-red-600 font-semibold">Crítico</span>
          </div>
          <p className="text-sm text-gray-500">Stock Bajo</p>
          <p className="text-2xl font-bold text-gray-800">{estadisticas.stockBajo}</p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-xs text-purple-600 font-semibold">Activo</span>
          </div>
          <p className="text-sm text-gray-500">Movimientos Hoy</p>
          <p className="text-2xl font-bold text-gray-800">{estadisticas.movimientosHoy}</p>
        </div>
      </div>

      {/* Gráfico de resumen */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Resumen de Movimientos</h2>
          <Link href="/inventario/estadisticas">
            <button className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
              Ver Estadísticas
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>

        {/* Representación visual con datos reales */}
        <div className="grid grid-cols-7 gap-2 h-48">
          {movimientosSemana.map((cantidad, i) => {
            const maxMovimientos = Math.max(...movimientosSemana, 1);
            const altura = (cantidad / maxMovimientos) * 100;

            return (
              <div key={i} className="flex flex-col items-center justify-end">
                <div className="text-xs text-gray-600 font-semibold mb-1">{cantidad}</div>
                <div
                  className="w-full bg-gradient-to-t from-blue-500 to-indigo-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-indigo-500"
                  style={{ height: `${altura || 5}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'][i]}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600">Entradas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-400 rounded"></div>
            <span className="text-gray-600">Salidas</span>
          </div>
        </div>
      </div>

      {/* Contenido en dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movimientos recientes */}
        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Movimientos Recientes</h2>
            <Link href="/inventario/movimientos">
              <button className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                Ver Todos
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-gray-500 text-center py-4">Cargando movimientos...</p>
            ) : movimientosRecientes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay movimientos recientes</p>
            ) : (
              movimientosRecientes.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.tipo === 'entrada' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {item.tipo === 'entrada' ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{item.producto?.nombre || 'Producto desconocido'}</p>
                    <p className="text-xs text-gray-500">Stock actual: {item.producto?.stock || 0}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${item.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.tipo === 'entrada' ? '+' : '-'}{Math.abs(item.cantidad)}
                  </p>
                  <p className="text-xs text-gray-500">{new Date(item.fecha).toLocaleDateString('es-ES')}</p>
                </div>
              </div>
            )))}
          </div>
        </div>

        {/* Alertas de stock */}
        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Alertas de Stock Bajo</h2>
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
              {loading ? '...' : alertasStock.length} alertas
            </span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-gray-500 text-center py-4">Cargando alertas...</p>
            ) : alertasStock.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-green-300 mx-auto mb-2" />
                <p className="text-green-600 font-semibold">¡Todo el stock está en buen estado!</p>
              </div>
            ) : (
              alertasStock.map((alerta) => (
                <div key={alerta.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{alerta.nombre}</p>
                      <p className="text-xs text-gray-500">{alerta.categoria || 'Sin categoría'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{alerta.stock} unidades</p>
                    <p className="text-xs text-gray-500">Mín: {alerta.stock_minimo}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition">
            Generar Orden de Compra
          </button>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/inventario/movimientos">
          <div className="bg-blue-500 hover:bg-blue-600 text-white shadow-md rounded-xl p-6 flex items-center justify-between transition cursor-pointer">
            <div>
              <p className="text-lg font-semibold">Registrar Movimiento</p>
              <p className="text-sm text-blue-100">Entrada o salida de productos</p>
            </div>
            <Activity className="h-8 w-8" />
          </div>
        </Link>

        <Link href="/inventario/estadisticas">
          <div className="bg-white hover:bg-gray-50 shadow-md rounded-xl p-6 flex items-center justify-between transition cursor-pointer">
            <div>
              <p className="text-lg font-semibold text-gray-800">Estadísticas</p>
              <p className="text-sm text-gray-500">Análisis detallado del inventario</p>
            </div>
            <BarChart3 className="h-8 w-8 text-gray-600" />
          </div>
        </Link>

        <Link href="/productos">
          <div className="bg-white hover:bg-gray-50 shadow-md rounded-xl p-6 flex items-center justify-between transition cursor-pointer">
            <div>
              <p className="text-lg font-semibold text-gray-800">Ver Catálogo</p>
              <p className="text-sm text-gray-500">Todos los productos disponibles</p>
            </div>
            <Package className="h-8 w-8 text-gray-600" />
          </div>
        </Link>
      </div>
    </div>
  );
}
