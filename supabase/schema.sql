-- ============================================
-- ESQUEMA DE BASE DE DATOS PARA OPTIGESTION
-- Sistema de gestión para ópticas
-- ============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: clientes
-- ============================================
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  fecha_nacimiento DATE,
  direccion TEXT,
  ciudad VARCHAR(100),
  codigo_postal VARCHAR(10),
  tipo_cliente VARCHAR(20) DEFAULT 'regular' CHECK (tipo_cliente IN ('regular', 'vip', 'mayorista')),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para clientes
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_tipo ON clientes(tipo_cliente);

-- ============================================
-- TABLA: categorias_productos
-- ============================================
CREATE TABLE IF NOT EXISTS categorias_productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar categorías por defecto
INSERT INTO categorias_productos (nombre, descripcion) VALUES
  ('Gafas de Sol', 'Gafas para protección solar'),
  ('Monturas', 'Monturas para lentes graduados'),
  ('Lentes', 'Lentes de diferentes tipos'),
  ('Accesorios', 'Accesorios para gafas y lentes')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- TABLA: productos
-- ============================================
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  marca VARCHAR(100),
  categoria_id UUID REFERENCES categorias_productos(id) ON DELETE SET NULL,
  precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimo INT DEFAULT 10 CHECK (stock_minimo >= 0),
  descripcion TEXT,
  codigo_barras VARCHAR(50) UNIQUE,
  imagen_url TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para productos
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_productos_stock ON productos(stock);
CREATE INDEX idx_productos_codigo_barras ON productos(codigo_barras);

-- ============================================
-- TABLA: movimientos_inventario
-- ============================================
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
  cantidad INT NOT NULL CHECK (cantidad != 0),
  motivo TEXT,
  usuario VARCHAR(100),
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para movimientos
CREATE INDEX idx_movimientos_producto ON movimientos_inventario(producto_id);
CREATE INDEX idx_movimientos_tipo ON movimientos_inventario(tipo);
CREATE INDEX idx_movimientos_fecha ON movimientos_inventario(fecha);

-- ============================================
-- TABLA: citas
-- ============================================
CREATE TABLE IF NOT EXISTS citas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  motivo TEXT,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completada', 'cancelada')),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para citas
CREATE INDEX idx_citas_cliente ON citas(cliente_id);
CREATE INDEX idx_citas_fecha ON citas(fecha);
CREATE INDEX idx_citas_estado ON citas(estado);

-- ============================================
-- TABLA: recetas
-- ============================================
CREATE TABLE IF NOT EXISTS recetas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  ojo_derecho_esfera DECIMAL(5, 2),
  ojo_derecho_cilindro DECIMAL(5, 2),
  ojo_derecho_eje INT CHECK (ojo_derecho_eje >= 0 AND ojo_derecho_eje <= 180),
  ojo_izquierdo_esfera DECIMAL(5, 2),
  ojo_izquierdo_cilindro DECIMAL(5, 2),
  ojo_izquierdo_eje INT CHECK (ojo_izquierdo_eje >= 0 AND ojo_izquierdo_eje <= 180),
  distancia_pupilar DECIMAL(5, 2),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para recetas
CREATE INDEX idx_recetas_cliente ON recetas(cliente_id);
CREATE INDEX idx_recetas_fecha ON recetas(fecha);

-- ============================================
-- TABLA: ventas
-- ============================================
CREATE TABLE IF NOT EXISTS ventas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  metodo_pago VARCHAR(50),
  estado VARCHAR(20) DEFAULT 'completada' CHECK (estado IN ('pendiente', 'completada', 'cancelada')),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para ventas
CREATE INDEX idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_ventas_estado ON ventas(estado);

-- ============================================
-- TABLA: detalle_ventas
-- ============================================
CREATE TABLE IF NOT EXISTS detalle_ventas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para detalle de ventas
CREATE INDEX idx_detalle_ventas_venta ON detalle_ventas(venta_id);
CREATE INDEX idx_detalle_ventas_producto ON detalle_ventas(producto_id);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_citas_updated_at
  BEFORE UPDATE ON citas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar stock después de movimiento
CREATE OR REPLACE FUNCTION actualizar_stock_producto()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo = 'entrada' THEN
    UPDATE productos SET stock = stock + NEW.cantidad WHERE id = NEW.producto_id;
  ELSIF NEW.tipo = 'salida' THEN
    UPDATE productos SET stock = stock - NEW.cantidad WHERE id = NEW.producto_id;
  ELSIF NEW.tipo = 'ajuste' THEN
    UPDATE productos SET stock = stock + NEW.cantidad WHERE id = NEW.producto_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar stock automáticamente
CREATE TRIGGER trigger_actualizar_stock
  AFTER INSERT ON movimientos_inventario
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_stock_producto();

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_ventas ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar según tus necesidades de autenticación)
-- Por ahora, permitimos acceso completo (deberás ajustar esto con autenticación real)
CREATE POLICY "Permitir todo en clientes" ON clientes FOR ALL USING (true);
CREATE POLICY "Permitir todo en productos" ON productos FOR ALL USING (true);
CREATE POLICY "Permitir todo en movimientos" ON movimientos_inventario FOR ALL USING (true);
CREATE POLICY "Permitir todo en citas" ON citas FOR ALL USING (true);
CREATE POLICY "Permitir todo en recetas" ON recetas FOR ALL USING (true);
CREATE POLICY "Permitir todo en ventas" ON ventas FOR ALL USING (true);
CREATE POLICY "Permitir todo en detalle_ventas" ON detalle_ventas FOR ALL USING (true);

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de productos con stock bajo
CREATE OR REPLACE VIEW productos_stock_bajo AS
SELECT
  p.id,
  p.nombre,
  p.marca,
  c.nombre AS categoria,
  p.stock,
  p.stock_minimo,
  p.precio
FROM productos p
LEFT JOIN categorias_productos c ON p.categoria_id = c.id
WHERE p.stock <= p.stock_minimo AND p.activo = true;

-- Vista de estadísticas de inventario
CREATE OR REPLACE VIEW estadisticas_inventario AS
SELECT
  c.nombre AS categoria,
  COUNT(p.id) AS total_productos,
  SUM(p.stock) AS stock_total,
  SUM(p.precio * p.stock) AS valor_total
FROM productos p
LEFT JOIN categorias_productos c ON p.categoria_id = c.id
WHERE p.activo = true
GROUP BY c.nombre;

-- Vista de citas próximas
CREATE OR REPLACE VIEW citas_proximas AS
SELECT
  ci.id,
  ci.fecha,
  ci.hora,
  ci.estado,
  cl.nombre || ' ' || cl.apellido AS cliente,
  cl.telefono,
  cl.email
FROM citas ci
JOIN clientes cl ON ci.cliente_id = cl.id
WHERE ci.fecha >= CURRENT_DATE AND ci.estado = 'pendiente'
ORDER BY ci.fecha, ci.hora;

-- ============================================
-- COMENTARIOS EN TABLAS
-- ============================================

COMMENT ON TABLE clientes IS 'Información de clientes de la óptica';
COMMENT ON TABLE productos IS 'Catálogo de productos disponibles';
COMMENT ON TABLE movimientos_inventario IS 'Registro de movimientos de stock';
COMMENT ON TABLE citas IS 'Agenda de citas con clientes';
COMMENT ON TABLE recetas IS 'Recetas médicas de los clientes';
COMMENT ON TABLE ventas IS 'Registro de ventas realizadas';
COMMENT ON TABLE detalle_ventas IS 'Detalle de productos vendidos por venta';
