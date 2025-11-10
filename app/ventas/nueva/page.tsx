"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ShoppingCart, DollarSign, User, Plus, Trash2, CheckCircle, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Cliente, ProductoConCategoria } from "@/lib/types"; // Importar tipos necesarios
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext"; // Para obtener el usuario que realiza la venta

// Definición local para el carrito de compras
interface CartItem {
  producto_id: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  stock_disponible: number;
}

export default function NuevaVentaPage() {
  const { user } = useAuth(); // Obtener el usuario autenticado
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState<ProductoConCategoria[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // 1. Cargar Productos activos y con stock
      const { data: productosData, error: prodError } = await supabase
        .from('productos')
        .select(`*, categoria:categorias_productos(*)`)
        .eq('activo', true)
        .gt('stock', 0) 
        .order('nombre');

      if (prodError) throw prodError;
      setProductos(productosData || []);

      // 2. Cargar Clientes
      const { data: clientesData, error: clientError } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre');

      if (clientError) throw clientError;
      setClientes(clientesData || []);

    } catch (error) {
      console.error('Error al cargar datos de venta:', error);
      toast.error('Error al cargar productos y clientes');
    } finally {
      setLoading(false);
    }
  };
  
  // Calcula totales en tiempo real (Subtotal, IVA, Total)
  const { subtotal, totalIVA, total } = useMemo(() => {
    const sub = carrito.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0);
    const iva = sub * 0.16; // Asumimos 16% de IVA
    const finalTotal = sub + iva;
    
    return { subtotal: sub, totalIVA: iva, total: finalTotal };
  }, [carrito]);


  const agregarAlCarrito = (productoId: string) => {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;

    setCarrito(prev => {
      const existe = prev.find(item => item.producto_id === productoId);

      if (existe) {
        // Aumentar cantidad si hay stock disponible
        if (existe.cantidad < existe.stock_disponible) {
          return prev.map(item =>
            item.producto_id === productoId ? { ...item, cantidad: item.cantidad + 1 } : item
          );
        } else {
          toast.warning(`Stock máximo (${existe.stock_disponible}) alcanzado para este producto.`);
          return prev;
        }
      } else {
        // Agregar nuevo producto
        if (producto.stock > 0) {
          return [
            ...prev,
            {
              producto_id: producto.id,
              nombre: producto.nombre,
              precio_unitario: producto.precio,
              cantidad: 1,
              stock_disponible: producto.stock,
            },
          ];
        } else {
          toast.error("Producto sin stock disponible.");
          return prev;
        }
      }
    });
  };

  const actualizarCantidad = (productoId: string, nuevaCantidad: number) => {
    setCarrito(prev => {
      const item = prev.find(i => i.producto_id === productoId);
      if (!item || nuevaCantidad <= 0) {
        return prev.filter(i => i.producto_id !== productoId); // Eliminar si la cantidad es 0 o menor
      }
      
      if (nuevaCantidad > item.stock_disponible) {
        toast.warning("No hay suficiente stock disponible.");
        return prev;
      }

      return prev.map(i =>
        i.producto_id === productoId ? { ...i, cantidad: nuevaCantidad } : i
      );
    });
  };

  const removerDelCarrito = (productoId: string) => {
    setCarrito(prev => prev.filter(item => item.producto_id !== productoId));
  };
  
  const registrarVenta = async () => {
    if (carrito.length === 0) {
      toast.error('El carrito está vacío.');
      return;
    }

    setLoading(true);

    try {
      // 1. Iniciar transacción: Insertar VENTA
      const ventaData = {
        cliente_id: clienteSeleccionado || null,
        fecha: new Date().toISOString(),
        total: total,
        metodo_pago: metodoPago,
        estado: 'completada', 
      };

      const { data: ventaResult, error: ventaError } = await supabase
        .from('ventas')
        .insert([ventaData])
        .select('id');

      if (ventaError || !ventaResult || ventaResult.length === 0) throw ventaError;
      
      const nuevaVentaId = ventaResult[0].id;

      // 2. Preparar DETALLE DE VENTA
      const detallesVenta = carrito.map(item => ({
        venta_id: nuevaVentaId,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.precio_unitario * item.cantidad,
      }));
      
      const { error: detalleError } = await supabase
        .from('detalle_ventas')
        .insert(detallesVenta);

      if (detalleError) throw detalleError;

      // 3. Registrar MOVIMIENTOS_INVENTARIO (Salida de stock)
      // Esto actualiza el stock en la tabla 'productos' vía trigger SQL
      const movimientosSalida = carrito.map(item => ({
        producto_id: item.producto_id,
        tipo: 'salida',
        cantidad: item.cantidad,
        motivo: 'Venta registrada: ' + nuevaVentaId.substring(0, 8),
        usuario: user?.email || 'Venta Terminal', 
      }));
      
      const { error: movimientosError } = await supabase
        .from('movimientos_inventario')
        .insert(movimientosSalida);
      
      if (movimientosError) throw movimientosError;


      toast.success(`Venta #${nuevaVentaId.substring(0, 8)} registrada exitosamente.`);
      
      // Limpiar estado y recargar datos para reflejar el nuevo stock
      setCarrito([]);
      setClienteSeleccionado('');
      cargarDatos();

    } catch (error: any) {
      console.error('Error al registrar la venta:', error);
      toast.error('Error al registrar la venta. Verifique el stock y la conexión.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && productos.length === 0) {
      return <div className="text-center py-12">Cargando catálogo...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Terminal de Venta (POS)</h1>
          <p className="text-gray-500">Registra ventas y salidas de stock rápidamente.</p>
        </div>
        <Link href="/productos">
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition">
            <ArrowLeft className="h-5 w-5" />
            Volver a Productos
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna de Productos (Selector) */}
        <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-gray-800">1. Catálogo de Productos</h2>
            
            {/* Grid de Productos */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {productos.map(producto => (
                  <div 
                    key={producto.id} 
                    className="bg-white border rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition"
                    onClick={() => agregarAlCarrito(producto.id)}
                  >
                      <p className="text-sm font-semibold text-gray-800 truncate">{producto.nombre}</p>
                      <p className="text-xs text-gray-500">{producto.categoria?.nombre || 'S/C'}</p>
                      <p className="text-lg font-bold text-green-600 mt-2">
                        ${producto.precio.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-700">Stock: {producto.stock}</p>
                  </div>
              ))}
            </div>
            
            {productos.length === 0 && (
                <div className="text-center py-8 bg-white rounded-xl shadow-md">
                    <p className="text-gray-500">No hay productos en stock para vender.</p>
                </div>
            )}
        </div>

        {/* Columna de Carrito y Pago */}
        <div className="lg:col-span-1 bg-white shadow-xl rounded-xl p-6 space-y-6 sticky top-4">
            
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
                2. Carrito y Pago
            </h2>

            {/* Selector de Cliente */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cliente (Opcional)</label>
                <select
                    value={clienteSeleccionado}
                    onChange={(e) => setClienteSeleccionado(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
                >
                    <option value="">-- Cliente Anónimo --</option>
                    {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>
                    ))}
                </select>
            </div>


            {/* Lista del Carrito */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {carrito.length === 0 ? (
                    <div className="text-center py-8 border-dashed border-2 rounded-lg text-gray-500">
                        Añade productos del catálogo.
                    </div>
                ) : (
                    carrito.map(item => (
                        <div key={item.producto_id} className="flex items-center justify-between border-b pb-2">
                            <div className="flex-1">
                                <p className="font-semibold text-gray-800 text-sm truncate">{item.nombre}</p>
                                <p className="text-xs text-gray-500">Precio: ${item.precio_unitario.toFixed(2)}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {/* Control de Cantidad */}
                                <input
                                    type="number"
                                    min="1"
                                    max={item.stock_disponible}
                                    value={item.cantidad}
                                    onChange={(e) => actualizarCantidad(item.producto_id, parseInt(e.target.value) || 0)}
                                    className="w-16 text-center border rounded-lg py-1 text-gray-900"
                                />
                                
                                {/* Botón Eliminar */}
                                <button
                                    onClick={() => removerDelCarrito(item.producto_id)}
                                    className="text-red-500 hover:text-red-700 p-1 rounded-full transition"
                                    title="Eliminar"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Resumen de Totales */}
            <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-700">
                    <span>Subtotal:</span>
                    <span className="font-medium">${subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-700 border-b pb-2">
                    <span>IVA (16%):</span>
                    <span className="font-medium">${totalIVA.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold text-gray-800 pt-2">
                    <span>TOTAL:</span>
                    <span className="text-blue-600">${total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            </div>
            
            {/* Opciones de Pago */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
                >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                    <option value="transferencia">Transferencia</option>
                </select>
            </div>

            {/* Botón de Finalizar Venta */}
            <button
                onClick={registrarVenta}
                disabled={carrito.length === 0 || loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl shadow-md font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <CheckCircle className="h-5 w-5" />
                {loading ? 'Procesando...' : `Finalizar Venta - $${total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </button>
            
        </div>
      </div>
    </div>
  );
}