// ============================================
// TIPOS PARA LAS TABLAS DE SUPABASE
// ============================================

// Tipos de roles de usuario
export type UserRole = 'desarrollador' | 'dueño' | 'empleado';

export interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  empresa?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fecha_nacimiento?: string;
  direccion?: string;
  ciudad?: string;
  codigo_postal?: string;
  tipo_cliente: 'regular' | 'vip' | 'mayorista';
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface CategoriaProducto {
  id: string;
  nombre: string;
  descripcion?: string;
  created_at: string;
}

export interface Producto {
  id: string;
  nombre: string;
  marca?: string;
  categoria_id?: string;
  precio: number;
  stock: number;
  stock_minimo: number;
  descripcion?: string;
  codigo_barras?: string;
  imagen_url?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface MovimientoInventario {
  id: string;
  producto_id: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  motivo?: string;
  usuario?: string;
  fecha: string;
}

export interface Cita {
  id: string;
  cliente_id: string;
  fecha: string;
  hora: string;
  motivo?: string;
  estado: 'pendiente' | 'completada' | 'cancelada';
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface Receta {
  id: string;
  cliente_id: string;
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
}

export interface Venta {
  id: string;
  cliente_id?: string;
  fecha: string;
  total: number;
  metodo_pago?: string;
  estado: 'pendiente' | 'completada' | 'cancelada';
  observaciones?: string;
  created_at: string;
}

export interface DetalleVenta {
  id: string;
  venta_id: string;
  producto_id?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at: string;
}

// Tipos para las vistas
export interface ProductoStockBajo {
  id: string;
  nombre: string;
  marca?: string;
  categoria?: string;
  stock: number;
  stock_minimo: number;
  precio: number;
}

export interface EstadisticaInventario {
  categoria?: string;
  total_productos: number;
  stock_total: number;
  valor_total: number;
}

export interface CitaProxima {
  id: string;
  fecha: string;
  hora: string;
  estado: string;
  cliente: string;
  telefono: string;
  email: string;
}

// Tipos extendidos con relaciones
export interface ProductoConCategoria extends Producto {
  categoria?: CategoriaProducto;
}

export interface MovimientoConProducto extends MovimientoInventario {
  producto?: Producto;
}

export interface CitaConCliente extends Cita {
  cliente?: Cliente;
}

export interface VentaConCliente extends Venta {
  cliente?: Cliente;
}
