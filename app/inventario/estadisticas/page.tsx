"use client";

import { BarChart3, TrendingUp, Package, DollarSign, Calendar, ArrowUp, ArrowDown } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { EstadisticaInventario } from "@/lib/types";
import { RoleGuard } from "@/components/RoleGuard";

export default function EstadisticasInventarioPage() {
  return (
    <RoleGuard allowedRoles={["desarrollador", "dueño"]}>
      <EstadisticasContent />
    </RoleGuard>
  );
}

function EstadisticasContent() {
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    stockTotal: 0,
    valorTotal: 0,
    ventasMes: 0,
  });
  const [categorias, setCategorias] = useState<EstadisticaInventario[]>([]);
  const [productosTop, setProductosTop] = useState<any[]>([]);
  const [ventasSemana, setVentasSemana] = useState<number[]>([]);
  const [productosStockBajo, setProductosStockBajo] = useState<any[]>([]);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      // Cargar estadísticas usando la vista de Supabase
      const { data: statsInventario } = await supabase
        .from('estadisticas_inventario')
        .select('*');

      setCategorias(statsInventario || []);

      // Calcular totales
      const stockTotal = statsInventario?.reduce((acc, cat) => acc + (cat.stock_total || 0), 0) || 0;
      const valorTotal = statsInventario?.reduce((acc, cat) => acc + (cat.valor_total || 0), 0) || 0;

      // Obtener salidas del mes (ventas)
      const now = new Date();
      const año = now.getFullYear();
      const mes = String(now.getMonth() + 1).padStart(2, '0');
      const primerDiaMes = `${año}-${mes}-01T00:00:00`;

      const { data: salidasMes } = await supabase
        .from('movimientos_inventario')
        .select(`
          cantidad,
          producto:productos(precio)
        `)
        .eq('tipo', 'salida')
        .gte('fecha', primerDiaMes);

      const totalVentasMes = salidasMes?.reduce((acc, salida: any) => {
        const precio = salida.producto?.precio || 0;
        return acc + (salida.cantidad * precio);
      }, 0) || 0;

      setEstadisticas({
        stockTotal,
        valorTotal,
        ventasMes: totalVentasMes,
      });

      // Obtener productos más vendidos (basado en salidas)
      const { data: movimientosSalida } = await supabase
        .from('movimientos_inventario')
        .select(`
          cantidad,
          producto:productos(nombre, precio)
        `)
        .eq('tipo', 'salida');

      // Agrupar por producto
      const ventasPorProducto = movimientosSalida?.reduce((acc: any, movimiento: any) => {
        const nombre = movimiento.producto?.nombre || 'Desconocido';
        const precio = movimiento.producto?.precio || 0;
        if (!acc[nombre]) {
          acc[nombre] = { nombre, ventas: 0, ingresos: 0 };
        }
        acc[nombre].ventas += movimiento.cantidad;
        acc[nombre].ingresos += movimiento.cantidad * precio;
        return acc;
      }, {});

      const topProductos = Object.values(ventasPorProducto || {})
        .sort((a: any, b: any) => b.ventas - a.ventas)
        .slice(0, 5);

      setProductosTop(topProductos);

      // Cargar ventas de los últimos 7 días (basado en salidas)
      const ventasPorDia: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);

        // Usar la hora local en lugar de UTC para evitar desfases de zona horaria
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        const fechaInicio = `${año}-${mes}-${dia}T00:00:00`;
        const fechaFin = `${año}-${mes}-${dia}T23:59:59`;

        const { data: salidasDia } = await supabase
          .from('movimientos_inventario')
          .select(`
            cantidad,
            producto:productos(precio)
          `)
          .eq('tipo', 'salida')
          .gte('fecha', fechaInicio)
          .lte('fecha', fechaFin);

        const totalDia = salidasDia?.reduce((acc, salida: any) => {
          const precio = salida.producto?.precio || 0;
          return acc + (salida.cantidad * precio);
        }, 0) || 0;

        ventasPorDia.push(totalDia);
      }
      setVentasSemana(ventasPorDia);

      // Cargar productos con stock bajo
      const { data: stockBajo } = await supabase
        .from('productos_stock_bajo')
        .select('*')
        .limit(3);

      setProductosStockBajo(stockBajo || []);

    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Estadísticas de Inventario</h1>
          <p className="text-gray-500">Análisis detallado y métricas de rendimiento</p>
        </div>
        <div className="flex gap-3">
          <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option>Últimos 7 días</option>
            <option>Últimos 30 días</option>
            <option>Último trimestre</option>
            <option>Último año</option>
          </select>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Stock Total</p>
          <p className="text-2xl font-bold text-gray-800">
            {loading ? '...' : `${estadisticas.stockTotal} unidades`}
          </p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Valor Total</p>
          <p className="text-2xl font-bold text-gray-800">
            {loading ? '...' : `$${estadisticas.valorTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Ventas (mes)</p>
          <p className="text-2xl font-bold text-gray-800">
            {loading ? '...' : `$${estadisticas.ventasMes.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Categorías</p>
          <p className="text-2xl font-bold text-gray-800">
            {loading ? '...' : categorias.length}
          </p>
        </div>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por categoría */}
        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Stock por Categoría</h2>
          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-500 text-center py-4">Cargando datos...</p>
            ) : categorias.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
            ) : (
              categorias.map((cat, index) => {
                const maxStock = Math.max(...categorias.map(c => c.stock_total || 0), 1);
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{cat.categoria || 'Sin categoría'}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-800">{cat.stock_total} unidades</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all"
                        style={{ width: `${((cat.stock_total || 0) / maxStock) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        Valor: ${(cat.valor_total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs text-gray-500">{cat.total_productos} productos</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Productos más vendidos */}
        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Productos Más Vendidos</h2>
          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-500 text-center py-4">Cargando datos...</p>
            ) : productosTop.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay ventas registradas</p>
            ) : (
              productosTop.map((prod: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{prod.nombre}</p>
                      <p className="text-sm text-gray-500">{prod.ventas} unidades vendidas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      ${prod.ingresos.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">ingresos</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Gráfico de tendencias */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Tendencia de Ventas (Últimos 7 días)</h2>
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>

        {/* Gráfico de barras con datos reales */}
        <div className="flex items-end justify-between h-64 gap-3">
          {ventasSemana.map((valor, i) => {
            const maxVenta = Math.max(...ventasSemana, 100);
            const altura = maxVenta > 0 ? (valor / maxVenta) * 100 : 0;

            // Calcular el día correcto basado en la fecha actual
            const fecha = new Date();
            fecha.setDate(fecha.getDate() - (6 - i));
            const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, etc.
            const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const nombreDia = nombresDias[diaSemana];

            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                <span className="text-xs font-semibold text-gray-700">
                  ${valor.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <div className="w-full flex flex-col justify-end" style={{ height: '85%' }}>
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-indigo-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-indigo-500 cursor-pointer"
                    style={{ height: altura > 0 ? `${altura}%` : '4px', minHeight: '4px' }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {nombreDia}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-400 rounded"></div>
            <span className="text-gray-600">Ventas diarias</span>
          </div>
        </div>
      </div>

      {/* Alertas y recomendaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos con stock bajo
          </h3>
          {loading ? (
            <p className="text-sm text-yellow-600">Cargando...</p>
          ) : productosStockBajo.length === 0 ? (
            <p className="text-sm text-yellow-600">No hay productos con stock bajo</p>
          ) : (
            <ul className="space-y-2 text-sm text-yellow-700">
              {productosStockBajo.map((prod, i) => (
                <li key={i}>• {prod.nombre} - Solo {prod.stock} unidades (mín: {prod.stock_minimo})</li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Productos de alto rendimiento
          </h3>
          {loading ? (
            <p className="text-sm text-green-600">Cargando...</p>
          ) : productosTop.length === 0 ? (
            <p className="text-sm text-green-600">No hay datos de ventas</p>
          ) : (
            <ul className="space-y-2 text-sm text-green-700">
              {productosTop.slice(0, 3).map((prod: any, i: number) => (
                <li key={i}>• {prod.nombre} - {prod.ventas} unidades vendidas</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
