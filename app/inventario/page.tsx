// app/inventario/page.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, TrendingUp, TrendingDown, AlertTriangle, ArrowRight, BarChart3, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ProductoStockBajo } from "@/lib/types";

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
  const [entradasSemana, setEntradasSemana] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [salidasSemana, setSalidasSemana] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [estadisticasPrevias, setEstadisticasPrevias] = useState({
    totalProductos: 0,
    valorTotal: 0
  });
  const [mostrarModalOrden, setMostrarModalOrden] = useState(false);
  const [cantidadesOrden, setCantidadesOrden] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirModalOrden = () => {
    // Inicializar cantidades sugeridas (stock mínimo - stock actual + margen de seguridad)
    const cantidadesIniciales: { [key: string]: number } = {};
    alertasStock.forEach(alerta => {
      const cantidadSugerida = Math.max(alerta.stock_minimo - alerta.stock + 10, 10);
      cantidadesIniciales[alerta.id] = cantidadSugerida;
    });
    setCantidadesOrden(cantidadesIniciales);
    setMostrarModalOrden(true);
  };

  const generarOrdenCompra = () => {
    const productosOrden = alertasStock
      .filter(alerta => cantidadesOrden[alerta.id] > 0)
      .map(alerta => ({
        producto: alerta.nombre,
        cantidad: cantidadesOrden[alerta.id],
        stockActual: alerta.stock,
        stockMinimo: alerta.stock_minimo
      }));

    if (productosOrden.length === 0) {
      alert('Selecciona al menos un producto para la orden de compra');
      return;
    }

    // Generar formato de orden de compra
    const fecha = new Date().toLocaleDateString('es-ES');
    let ordenTexto = `ORDEN DE COMPRA - ${fecha}\n\n`;
    ordenTexto += `Productos a solicitar:\n\n`;

    productosOrden.forEach((item, index) => {
      ordenTexto += `${index + 1}. ${item.producto}\n`;
      ordenTexto += `   Cantidad a ordenar: ${item.cantidad} unidades\n`;
      ordenTexto += `   Stock actual: ${item.stockActual}\n`;
      ordenTexto += `   Stock mínimo: ${item.stockMinimo}\n\n`;
    });

    ordenTexto += `\nTotal de productos: ${productosOrden.length}`;
    ordenTexto += `\nTotal de unidades: ${productosOrden.reduce((acc, p) => acc + p.cantidad, 0)}`;

    // Copiar al portapapeles
    navigator.clipboard.writeText(ordenTexto);
    alert('Orden de compra generada y copiada al portapapeles');
    setMostrarModalOrden(false);
  };

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

      // Obtener estadísticas del mes anterior para calcular porcentajes
      const inicioMesAnterior = new Date();
      inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1);
      inicioMesAnterior.setDate(1);
      const finMesAnterior = new Date();
      finMesAnterior.setDate(0);

      // Calcular total de productos del mes anterior (basado en movimientos)
      const { data: movimientosMesAnterior } = await supabase
        .from('movimientos_inventario')
        .select('cantidad, tipo')
        .gte('fecha', inicioMesAnterior.toISOString())
        .lte('fecha', finMesAnterior.toISOString());

      const cambioProductos = movimientosMesAnterior?.reduce((acc, m) =>
        acc + (m.tipo === 'entrada' ? m.cantidad : -m.cantidad), 0) || 0;

      const totalProductosAnterior = totalProductos - cambioProductos;
      const valorTotalAnterior = totalProductosAnterior > 0 ? valorTotal * (totalProductosAnterior / totalProductos) : valorTotal;

      setEstadisticasPrevias({
        totalProductos: totalProductosAnterior,
        valorTotal: valorTotalAnterior
      });

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
      const entradasPorDia: number[] = [];
      const salidasPorDia: number[] = [];

      for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = fecha.toISOString().split('T')[0];
        const fechaSiguiente = new Date(fecha.getTime() + 86400000).toISOString().split('T')[0];

        // Contar entradas
        const { data: entradas } = await supabase
          .from('movimientos_inventario')
          .select('cantidad')
          .eq('tipo', 'entrada')
          .gte('fecha', fechaStr)
          .lt('fecha', fechaSiguiente);

        const totalEntradas = entradas?.reduce((acc, m) => acc + m.cantidad, 0) || 0;
        entradasPorDia.push(totalEntradas);

        // Contar salidas
        const { data: salidas } = await supabase
          .from('movimientos_inventario')
          .select('cantidad')
          .eq('tipo', 'salida')
          .gte('fecha', fechaStr)
          .lt('fecha', fechaSiguiente);

        const totalSalidas = salidas?.reduce((acc, m) => acc + Math.abs(m.cantidad), 0) || 0;
        salidasPorDia.push(totalSalidas);
      }

      setEntradasSemana(entradasPorDia);
      setSalidasSemana(salidasPorDia);

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
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
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
            {(() => {
              const cambio = estadisticasPrevias.totalProductos > 0
                ? ((estadisticas.totalProductos - estadisticasPrevias.totalProductos) / estadisticasPrevias.totalProductos * 100)
                : 0;
              return cambio !== 0 ? (
                <span className={`text-xs font-semibold ${cambio > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {cambio > 0 ? '+' : ''}{cambio.toFixed(1)}%
                </span>
              ) : null;
            })()}
          </div>
          <p className="text-sm text-gray-500">Total Productos</p>
          <p className="text-2xl font-bold text-gray-800">{estadisticas.totalProductos}</p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            {(() => {
              const cambio = estadisticasPrevias.valorTotal > 0
                ? ((estadisticas.valorTotal - estadisticasPrevias.valorTotal) / estadisticasPrevias.valorTotal * 100)
                : 0;
              return cambio !== 0 ? (
                <span className={`text-xs font-semibold ${cambio > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {cambio > 0 ? '+' : ''}{cambio.toFixed(1)}%
                </span>
              ) : null;
            })()}
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
          {entradasSemana.map((entradas, i) => {
            const salidas = salidasSemana[i];
            const maxMovimientos = Math.max(
              ...entradasSemana,
              ...salidasSemana,
              1
            );
            const alturaEntradas = (entradas / maxMovimientos) * 100;
            const alturaSalidas = (salidas / maxMovimientos) * 100;

            // Calcular el día correcto basado en la fecha actual
            const fecha = new Date();
            fecha.setDate(fecha.getDate() - (6 - i));
            const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, etc.
            const nombresDias = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
            const nombreDia = nombresDias[diaSemana];

            return (
              <div key={i} className="flex flex-col items-center justify-end gap-1">
                <div className="text-xs text-gray-600 font-semibold mb-1">
                  {entradas + salidas}
                </div>
                <div className="w-full flex gap-1 items-end" style={{ height: '100%' }}>
                  <div
                    className="flex-1 bg-green-500 rounded-t-lg transition-all hover:bg-green-600"
                    style={{ height: `${alturaEntradas || 5}%` }}
                    title={`Entradas: ${entradas}`}
                  ></div>
                  <div
                    className="flex-1 bg-red-500 rounded-t-lg transition-all hover:bg-red-600"
                    style={{ height: `${alturaSalidas || 5}%` }}
                    title={`Salidas: ${salidas}`}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 mt-2">
                  {nombreDia}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">Entradas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
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

          {alertasStock.length > 0 && (
            <button
              onClick={abrirModalOrden}
              className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition"
            >
              Generar Orden de Compra
            </button>
          )}
        </div>
      </div>

      {/* Modal para generar orden de compra */}
      {mostrarModalOrden && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-red-600 text-white p-6">
              <h2 className="text-2xl font-bold">Generar Orden de Compra</h2>
              <p className="text-red-100 text-sm mt-1">Ajusta las cantidades a ordenar</p>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              <div className="space-y-4">
                {alertasStock.map((alerta) => (
                  <div key={alerta.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">{alerta.nombre}</p>
                        <p className="text-sm text-gray-500">
                          Stock: {alerta.stock} | Mínimo: {alerta.stock_minimo}
                        </p>
                      </div>
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-600">Cantidad a ordenar:</label>
                      <input
                        type="number"
                        min="0"
                        value={cantidadesOrden[alerta.id] || 0}
                        onChange={(e) => setCantidadesOrden({
                          ...cantidadesOrden,
                          [alerta.id]: parseInt(e.target.value) || 0
                        })}
                        className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none text-gray-900"
                      />
                      <span className="text-sm text-gray-500">unidades</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-6 flex justify-end gap-3">
              <button
                onClick={() => setMostrarModalOrden(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={generarOrdenCompra}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
              >
                Generar y Copiar
              </button>
            </div>
          </div>
        </div>
      )}

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
