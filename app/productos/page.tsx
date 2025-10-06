"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Eye, ShoppingCart, DollarSign, Package, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Producto, CategoriaProducto, ProductoConCategoria } from "@/lib/types";
import { toast } from "sonner";

export default function ProductosPage() {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [productos, setProductos] = useState<ProductoConCategoria[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [valorInventario, setValorInventario] = useState(0);
  const [modalAgregar, setModalAgregar] = useState(false);
  const [modalVer, setModalVer] = useState(false);
  const [modalVender, setModalVender] = useState(false);
  const [modalAgregarStock, setModalAgregarStock] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoConCategoria | null>(null);
  const [cantidadVenta, setCantidadVenta] = useState(1);
  const [cantidadAgregar, setCantidadAgregar] = useState(1);
  const [formData, setFormData] = useState({
    nombre: '',
    marca: '',
    categoria_id: '',
    precio: '',
    stock: '',
    stock_minimo: '10',
    descripcion: '',
    codigo_barras: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar productos con categorías
      const { data: productosData, error: productosError } = await supabase
        .from('productos')
        .select(`
          *,
          categoria:categorias_productos(*)
        `)
        .eq('activo', true)
        .order('created_at', { ascending: false });

      if (productosError) throw productosError;

      // Cargar categorías
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('categorias_productos')
        .select('*')
        .order('nombre');

      if (categoriasError) throw categoriasError;

      setProductos(productosData || []);
      setCategorias(categoriasData || []);

      // Calcular valor total del inventario
      const valor = (productosData || []).reduce((acc, p) => acc + (p.precio * p.stock), 0);
      setValorInventario(valor);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const productosFiltrados = productos.filter(producto => {
    const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                             (producto.marca || '').toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaFiltro === "Todas" || producto.categoria?.nombre === categoriaFiltro;
    return coincideBusqueda && coincideCategoria;
  });

  const productosStockBajo = productos.filter(p => p.stock <= p.stock_minimo).length;

  const agregarProducto = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('productos')
        .insert([{
          nombre: formData.nombre,
          marca: formData.marca || null,
          categoria_id: formData.categoria_id || null,
          precio: parseFloat(formData.precio),
          stock: parseInt(formData.stock),
          stock_minimo: parseInt(formData.stock_minimo),
          descripcion: formData.descripcion || null,
          codigo_barras: formData.codigo_barras || null,
          activo: true
        }]);

      if (error) throw error;

      toast.success('Producto agregado exitosamente');
      setModalAgregar(false);
      setFormData({
        nombre: '',
        marca: '',
        categoria_id: '',
        precio: '',
        stock: '',
        stock_minimo: '10',
        descripcion: '',
        codigo_barras: ''
      });
      cargarDatos();
    } catch (error: any) {
      console.error('Error al agregar producto:', error);
      toast.error(error.message || 'Error al agregar producto');
    }
  };

  const abrirModalVer = (producto: ProductoConCategoria) => {
    setProductoSeleccionado(producto);
    setModalVer(true);
  };

  const abrirModalVender = (producto: ProductoConCategoria) => {
    setProductoSeleccionado(producto);
    setCantidadVenta(1);
    setModalVender(true);
  };

  const abrirModalAgregarStock = (producto: ProductoConCategoria) => {
    setProductoSeleccionado(producto);
    setCantidadAgregar(1);
    setModalAgregarStock(true);
  };

  const agregarStock = async () => {
    if (!productoSeleccionado) return;

    try {
      if (cantidadAgregar <= 0) {
        toast.error('La cantidad debe ser mayor a 0');
        return;
      }

      // Registrar movimiento de entrada - el trigger actualizará el stock automáticamente
      const { error: errorMovimiento } = await supabase
        .from('movimientos_inventario')
        .insert({
          producto_id: productoSeleccionado.id,
          tipo: 'entrada',
          cantidad: cantidadAgregar,
          motivo: 'Reabastecimiento de stock',
          fecha: new Date().toISOString(),
          usuario: 'Sistema'
        });

      if (errorMovimiento) throw errorMovimiento;

      toast.success(`Stock agregado: +${cantidadAgregar} unidad(es) de ${productoSeleccionado.nombre}`);
      setModalAgregarStock(false);
      setProductoSeleccionado(null);

      // Recargar datos con delay
      setTimeout(() => {
        cargarDatos();
      }, 300);
    } catch (error: any) {
      console.error('Error al agregar stock:', error);
      toast.error(error.message || 'Error al agregar stock');
    }
  };

  const realizarVenta = async () => {
    if (!productoSeleccionado) return;

    try {
      if (cantidadVenta <= 0) {
        toast.error('La cantidad debe ser mayor a 0');
        return;
      }

      if (cantidadVenta > productoSeleccionado.stock) {
        toast.error('No hay suficiente stock disponible');
        return;
      }

      // Registrar movimiento de salida - el trigger de Supabase actualizará el stock automáticamente
      const { error: errorMovimiento } = await supabase
        .from('movimientos_inventario')
        .insert({
          producto_id: productoSeleccionado.id,
          tipo: 'salida',
          cantidad: cantidadVenta,
          motivo: 'Venta',
          fecha: new Date().toISOString(),
          usuario: 'Sistema'
        });

      if (errorMovimiento) throw errorMovimiento;

      toast.success(`Venta registrada: ${cantidadVenta} unidad(es) de ${productoSeleccionado.nombre}`);
      setModalVender(false);
      setProductoSeleccionado(null);

      // Recargar datos con delay para asegurar que el trigger se ejecutó
      setTimeout(() => {
        cargarDatos();
      }, 300);
    } catch (error: any) {
      console.error('Error al realizar venta:', error);
      toast.error(error.message || 'Error al realizar la venta');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Catálogo de Productos</h1>
          <p className="text-gray-500">Explora nuestro inventario de productos disponibles</p>
        </div>
        <button
          onClick={() => setModalAgregar(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-md font-semibold transition transform hover:-translate-y-1 flex items-center gap-2"
        >
          <Package className="h-5 w-5" />
          Agregar Producto
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Productos</p>
              <p className="text-2xl font-bold text-gray-800">{loading ? '...' : productos.length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Valor Inventario</p>
              <p className="text-2xl font-bold text-gray-800">
                {loading ? '...' : `$${valorInventario.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Stock Bajo</p>
              <p className="text-2xl font-bold text-gray-800">{loading ? '...' : productosStockBajo}</p>
            </div>
            <Package className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Búsqueda y filtros */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos por nombre o marca..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-white"
            >
              <option value="Todas">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid de productos */}
      {loading ? (
        <div className="bg-white shadow-md rounded-xl p-12 text-center">
          <p className="text-gray-500">Cargando productos...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productosFiltrados.map((producto) => {
              const emojiCategoria = producto.categoria?.nombre === 'Gafas de Sol' ? '🕶️' :
                                     producto.categoria?.nombre === 'Monturas' ? '👓' :
                                     producto.categoria?.nombre === 'Lentes' ? '🔍' : '📦';

              return (
                <div key={producto.id} className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1">
                  {/* Imagen del producto */}
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center relative">
                    <span className="text-6xl">{emojiCategoria}</span>
                    {producto.stock <= producto.stock_minimo && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                        Stock Bajo
                      </div>
                    )}
                  </div>

                  {/* Información del producto */}
                  <div className="p-6">
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {producto.categoria?.nombre || 'Sin categoría'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mb-1">{producto.nombre}</h3>
                    <p className="text-sm text-gray-500 mb-3">{producto.marca || 'Sin marca'}</p>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-2xl font-bold text-gray-800">
                          ${producto.precio.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Stock</p>
                        <p className={`text-sm font-semibold ${producto.stock <= producto.stock_minimo ? 'text-red-600' : 'text-green-600'}`}>
                          {producto.stock} unidades
                        </p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => abrirModalVer(producto)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Ver
                        </button>
                        <button
                          onClick={() => abrirModalVender(producto)}
                          className="flex-1 border border-blue-600 text-blue-600 hover:bg-blue-50 py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Vender
                        </button>
                      </div>
                      <button
                        onClick={() => abrirModalAgregarStock(producto)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Agregar Stock
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sin resultados */}
          {productosFiltrados.length === 0 && (
            <div className="bg-white shadow-md rounded-xl p-12 text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No se encontraron productos</p>
              <p className="text-gray-400 text-sm">Intenta ajustar tus filtros de búsqueda</p>
            </div>
          )}
        </>
      )}

      {/* Modal Agregar Producto */}
      {modalAgregar && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-800">Agregar Nuevo Producto</h2>
            </div>

            <form onSubmit={agregarProducto} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-gray-700 font-medium mb-2">
                    Nombre del Producto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ej: Gafas Aviador Classic"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Marca</label>
                  <input
                    type="text"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ej: Ray-Ban"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Categoría</label>
                  <select
                    value={formData.categoria_id}
                    onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Precio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Stock Inicial <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Stock Mínimo</label>
                  <input
                    type="number"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Código de Barras</label>
                  <input
                    type="text"
                    value={formData.codigo_barras}
                    onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="123456789"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-gray-700 font-medium mb-2">Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                    rows={3}
                    placeholder="Descripción del producto..."
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setModalAgregar(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Producto */}
      {modalVer && productoSeleccionado && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="bg-blue-600 text-white p-6">
              <h2 className="text-2xl font-bold">Detalles del Producto</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="text-lg font-semibold text-gray-800">{productoSeleccionado.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Marca</p>
                  <p className="text-lg font-semibold text-gray-800">{productoSeleccionado.marca || 'Sin marca'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Categoría</p>
                  <p className="text-lg font-semibold text-gray-800">{productoSeleccionado.categoria?.nombre || 'Sin categoría'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Precio</p>
                  <p className="text-lg font-semibold text-green-600">${productoSeleccionado.precio.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Stock Actual</p>
                  <p className={`text-lg font-semibold ${productoSeleccionado.stock <= productoSeleccionado.stock_minimo ? 'text-red-600' : 'text-green-600'}`}>
                    {productoSeleccionado.stock} unidades
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Stock Mínimo</p>
                  <p className="text-lg font-semibold text-gray-800">{productoSeleccionado.stock_minimo} unidades</p>
                </div>
                {productoSeleccionado.codigo_barras && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Código de Barras</p>
                    <p className="text-lg font-semibold text-gray-800">{productoSeleccionado.codigo_barras}</p>
                  </div>
                )}
                {productoSeleccionado.descripcion && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Descripción</p>
                    <p className="text-gray-700">{productoSeleccionado.descripcion}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">Valor en Inventario</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${(productoSeleccionado.precio * productoSeleccionado.stock).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 flex justify-end">
              <button
                onClick={() => setModalVer(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Vender Producto */}
      {modalVender && productoSeleccionado && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-blue-600 text-white p-6">
              <h2 className="text-2xl font-bold">Registrar Venta</h2>
              <p className="text-blue-100 text-sm mt-1">{productoSeleccionado.nombre}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Precio unitario:</span>
                  <span className="font-semibold">${productoSeleccionado.precio.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Stock disponible:</span>
                  <span className="font-semibold">{productoSeleccionado.stock} unidades</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad a vender *
                </label>
                <input
                  type="number"
                  min="1"
                  max={productoSeleccionado.stock}
                  value={cantidadVenta}
                  onChange={(e) => setCantidadVenta(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Total:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${(productoSeleccionado.precio * cantidadVenta).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 flex justify-end gap-3">
              <button
                onClick={() => setModalVender(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={realizarVenta}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                Confirmar Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Stock */}
      {modalAgregarStock && productoSeleccionado && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-green-600 text-white p-6">
              <h2 className="text-2xl font-bold">Agregar Stock</h2>
              <p className="text-green-100 text-sm mt-1">{productoSeleccionado.nombre}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Stock actual:</span>
                  <span className="font-semibold">{productoSeleccionado.stock} unidades</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Stock mínimo:</span>
                  <span className="font-semibold">{productoSeleccionado.stock_minimo} unidades</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad a agregar *
                </label>
                <input
                  type="number"
                  min="1"
                  value={cantidadAgregar}
                  onChange={(e) => setCantidadAgregar(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Nuevo stock:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {productoSeleccionado.stock + cantidadAgregar} unidades
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 flex justify-end gap-3">
              <button
                onClick={() => setModalAgregarStock(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={agregarStock}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
