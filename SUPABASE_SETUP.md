# 🔧 Configuración de Supabase para OptiGestión

## 📋 Paso 1: Crear Proyecto en Supabase

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Haz clic en **"New Project"**
3. Completa los datos:
   - **Name**: OptiGestion
   - **Database Password**: (guarda esta contraseña de forma segura)
   - **Region**: Elige la más cercana a tu ubicación
4. Espera a que el proyecto se cree (toma 2-3 minutos)

## 🔑 Paso 2: Obtener Credenciales

1. En tu proyecto de Supabase, ve a **Settings** (⚙️) → **API**
2. Copia estos valores:
   - **Project URL** → Será tu `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Será tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📁 Paso 3: Configurar Variables de Entorno

1. En la raíz del proyecto, crea un archivo `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edita `.env.local` y completa con tus valores reales:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## 🗄️ Paso 4: Crear las Tablas

### Opción A: Ejecutar el archivo SQL completo (Recomendado)

1. En Supabase, ve a **SQL Editor** (icono de código)
2. Haz clic en **"New query"**
3. Copia y pega todo el contenido del archivo `supabase/schema.sql`
4. Haz clic en **"Run"** (o presiona Ctrl/Cmd + Enter)
5. Verifica que todas las tablas se crearon correctamente en la pestaña **Table Editor**

### Opción B: Comandos SQL rápidos

Copia y pega este comando en el **SQL Editor** de Supabase:

```sql
-- Crear extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Crear tabla clientes
CREATE TABLE clientes (
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

-- 2. Crear tabla categorias_productos
CREATE TABLE categorias_productos (
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
  ('Accesorios', 'Accesorios para gafas y lentes');

-- 3. Crear tabla productos
CREATE TABLE productos (
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

-- 4. Crear tabla movimientos_inventario
CREATE TABLE movimientos_inventario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
  cantidad INT NOT NULL CHECK (cantidad != 0),
  motivo TEXT,
  usuario VARCHAR(100),
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Crear tabla citas
CREATE TABLE citas (
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

-- 6. Crear tabla recetas
CREATE TABLE recetas (
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

-- 7. Crear tabla ventas
CREATE TABLE ventas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  metodo_pago VARCHAR(50),
  estado VARCHAR(20) DEFAULT 'completada' CHECK (estado IN ('pendiente', 'completada', 'cancelada')),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Crear tabla detalle_ventas
CREATE TABLE detalle_ventas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_stock ON productos(stock);
CREATE INDEX idx_movimientos_producto ON movimientos_inventario(producto_id);
CREATE INDEX idx_citas_cliente ON citas(cliente_id);
CREATE INDEX idx_citas_fecha ON citas(fecha);
CREATE INDEX idx_recetas_cliente ON recetas(cliente_id);
CREATE INDEX idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX idx_detalle_ventas_venta ON detalle_ventas(venta_id);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_citas_updated_at BEFORE UPDATE ON citas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar stock automáticamente
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

-- Trigger para actualizar stock
CREATE TRIGGER trigger_actualizar_stock AFTER INSERT ON movimientos_inventario FOR EACH ROW EXECUTE FUNCTION actualizar_stock_producto();

-- Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_ventas ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo por ahora)
CREATE POLICY "Permitir todo en clientes" ON clientes FOR ALL USING (true);
CREATE POLICY "Permitir todo en productos" ON productos FOR ALL USING (true);
CREATE POLICY "Permitir todo en movimientos" ON movimientos_inventario FOR ALL USING (true);
CREATE POLICY "Permitir todo en citas" ON citas FOR ALL USING (true);
CREATE POLICY "Permitir todo en recetas" ON recetas FOR ALL USING (true);
CREATE POLICY "Permitir todo en ventas" ON ventas FOR ALL USING (true);
CREATE POLICY "Permitir todo en detalle_ventas" ON detalle_ventas FOR ALL USING (true);

-- Crear vistas útiles
CREATE OR REPLACE VIEW productos_stock_bajo AS
SELECT p.id, p.nombre, p.marca, c.nombre AS categoria, p.stock, p.stock_minimo, p.precio
FROM productos p
LEFT JOIN categorias_productos c ON p.categoria_id = c.id
WHERE p.stock <= p.stock_minimo AND p.activo = true;

CREATE OR REPLACE VIEW estadisticas_inventario AS
SELECT c.nombre AS categoria, COUNT(p.id) AS total_productos, SUM(p.stock) AS stock_total, SUM(p.precio * p.stock) AS valor_total
FROM productos p
LEFT JOIN categorias_productos c ON p.categoria_id = c.id
WHERE p.activo = true
GROUP BY c.nombre;

CREATE OR REPLACE VIEW citas_proximas AS
SELECT ci.id, ci.fecha, ci.hora, ci.estado, cl.nombre || ' ' || cl.apellido AS cliente, cl.telefono, cl.email
FROM citas ci
JOIN clientes cl ON ci.cliente_id = cl.id
WHERE ci.fecha >= CURRENT_DATE AND ci.estado = 'pendiente'
ORDER BY ci.fecha, ci.hora;
```

## ✅ Paso 5: Verificar la Conexión

Reinicia el servidor de desarrollo:
```bash
npm run dev
```

La aplicación ahora debería conectarse a Supabase correctamente.

---

## 📊 ESTRUCTURA COMPLETA DE BASE DE DATOS

### 1️⃣ Tabla: `clientes`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único (PK) |
| `nombre` | VARCHAR(100) | Nombre del cliente |
| `apellido` | VARCHAR(100) | Apellido del cliente |
| `email` | VARCHAR(255) | Correo electrónico (único) |
| `telefono` | VARCHAR(20) | Número de teléfono |
| `fecha_nacimiento` | DATE | Fecha de nacimiento |
| `direccion` | TEXT | Dirección completa |
| `ciudad` | VARCHAR(100) | Ciudad |
| `codigo_postal` | VARCHAR(10) | Código postal |
| `tipo_cliente` | VARCHAR(20) | 'regular', 'vip', 'mayorista' |
| `observaciones` | TEXT | Notas adicionales |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Fecha de última actualización |

---

### 2️⃣ Tabla: `categorias_productos`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único (PK) |
| `nombre` | VARCHAR(100) | Nombre de la categoría (único) |
| `descripcion` | TEXT | Descripción de la categoría |
| `created_at` | TIMESTAMP | Fecha de creación |

**Categorías por defecto:**
- Gafas de Sol
- Monturas
- Lentes
- Accesorios

---

### 3️⃣ Tabla: `productos`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único (PK) |
| `nombre` | VARCHAR(255) | Nombre del producto |
| `marca` | VARCHAR(100) | Marca del producto |
| `categoria_id` | UUID | ID de categoría (FK → categorias_productos) |
| `precio` | DECIMAL(10,2) | Precio del producto |
| `stock` | INT | Cantidad en stock |
| `stock_minimo` | INT | Stock mínimo (default: 10) |
| `descripcion` | TEXT | Descripción del producto |
| `codigo_barras` | VARCHAR(50) | Código de barras (único) |
| `imagen_url` | TEXT | URL de la imagen |
| `activo` | BOOLEAN | Si está activo (default: true) |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Fecha de última actualización |

---

### 4️⃣ Tabla: `movimientos_inventario`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único (PK) |
| `producto_id` | UUID | ID del producto (FK → productos) |
| `tipo` | VARCHAR(20) | 'entrada', 'salida', 'ajuste' |
| `cantidad` | INT | Cantidad del movimiento |
| `motivo` | TEXT | Motivo del movimiento |
| `usuario` | VARCHAR(100) | Usuario que realizó el movimiento |
| `fecha` | TIMESTAMP | Fecha del movimiento |

**⚡ Trigger automático:** Al insertar un movimiento, actualiza el stock del producto automáticamente.

---

### 5️⃣ Tabla: `citas`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único (PK) |
| `cliente_id` | UUID | ID del cliente (FK → clientes) |
| `fecha` | DATE | Fecha de la cita |
| `hora` | TIME | Hora de la cita |
| `motivo` | TEXT | Motivo de la cita |
| `estado` | VARCHAR(20) | 'pendiente', 'completada', 'cancelada' |
| `observaciones` | TEXT | Observaciones adicionales |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Fecha de última actualización |

---

### 6️⃣ Tabla: `recetas`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único (PK) |
| `cliente_id` | UUID | ID del cliente (FK → clientes) |
| `fecha` | DATE | Fecha de la receta |
| `ojo_derecho_esfera` | DECIMAL(5,2) | Esfera ojo derecho |
| `ojo_derecho_cilindro` | DECIMAL(5,2) | Cilindro ojo derecho |
| `ojo_derecho_eje` | INT | Eje ojo derecho (0-180) |
| `ojo_izquierdo_esfera` | DECIMAL(5,2) | Esfera ojo izquierdo |
| `ojo_izquierdo_cilindro` | DECIMAL(5,2) | Cilindro ojo izquierdo |
| `ojo_izquierdo_eje` | INT | Eje ojo izquierdo (0-180) |
| `distancia_pupilar` | DECIMAL(5,2) | Distancia pupilar |
| `observaciones` | TEXT | Observaciones adicionales |
| `created_at` | TIMESTAMP | Fecha de creación |

---

### 7️⃣ Tabla: `ventas`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único (PK) |
| `cliente_id` | UUID | ID del cliente (FK → clientes) |
| `fecha` | TIMESTAMP | Fecha de la venta |
| `total` | DECIMAL(10,2) | Total de la venta |
| `metodo_pago` | VARCHAR(50) | Método de pago |
| `estado` | VARCHAR(20) | 'pendiente', 'completada', 'cancelada' |
| `observaciones` | TEXT | Observaciones |
| `created_at` | TIMESTAMP | Fecha de creación |

---

### 8️⃣ Tabla: `detalle_ventas`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único (PK) |
| `venta_id` | UUID | ID de la venta (FK → ventas) |
| `producto_id` | UUID | ID del producto (FK → productos) |
| `cantidad` | INT | Cantidad vendida |
| `precio_unitario` | DECIMAL(10,2) | Precio unitario al momento de la venta |
| `subtotal` | DECIMAL(10,2) | Subtotal (cantidad × precio_unitario) |
| `created_at` | TIMESTAMP | Fecha de creación |

---

## 📈 VISTAS CREADAS

### Vista: `productos_stock_bajo`

Muestra productos que necesitan reabastecimiento.

| Columna | Descripción |
|---------|-------------|
| `id` | ID del producto |
| `nombre` | Nombre del producto |
| `marca` | Marca |
| `categoria` | Nombre de la categoría |
| `stock` | Stock actual |
| `stock_minimo` | Stock mínimo configurado |
| `precio` | Precio del producto |

---

### Vista: `estadisticas_inventario`

Resumen de inventario por categoría.

| Columna | Descripción |
|---------|-------------|
| `categoria` | Nombre de la categoría |
| `total_productos` | Cantidad de productos diferentes |
| `stock_total` | Suma de stock de todos los productos |
| `valor_total` | Valor total (stock × precio) |

---

### Vista: `citas_proximas`

Próximas citas pendientes ordenadas por fecha.

| Columna | Descripción |
|---------|-------------|
| `id` | ID de la cita |
| `fecha` | Fecha de la cita |
| `hora` | Hora de la cita |
| `estado` | Estado de la cita |
| `cliente` | Nombre completo del cliente |
| `telefono` | Teléfono del cliente |
| `email` | Email del cliente |

---

## 🔄 RELACIONES ENTRE TABLAS

```
clientes (1) ──────→ (N) citas
clientes (1) ──────→ (N) recetas
clientes (1) ──────→ (N) ventas

categorias_productos (1) ──→ (N) productos

productos (1) ──────→ (N) movimientos_inventario
productos (1) ──────→ (N) detalle_ventas

ventas (1) ──────→ (N) detalle_ventas
```

---

## 📝 Ejemplos de Datos para Insertar

### Insertar un cliente:
```sql
INSERT INTO clientes (nombre, apellido, email, telefono, tipo_cliente)
VALUES ('Juan', 'Pérez', 'juan.perez@email.com', '+1234567890', 'regular');
```

### Insertar un producto:
```sql
INSERT INTO productos (nombre, marca, precio, stock, categoria_id)
SELECT
  'Gafas Aviador Classic',
  'Ray-Ban',
  159.99,
  24,
  id
FROM categorias_productos
WHERE nombre = 'Gafas de Sol'
LIMIT 1;
```

### Insertar una cita:
```sql
INSERT INTO citas (cliente_id, fecha, hora, estado)
SELECT
  id,
  '2025-10-15',
  '10:00:00',
  'pendiente'
FROM clientes
WHERE email = 'juan.perez@email.com'
LIMIT 1;
```

### Registrar movimiento de inventario:
```sql
-- Esto actualizará automáticamente el stock
INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, usuario)
SELECT
  id,
  'entrada',
  20,
  'Compra a proveedor',
  'Admin'
FROM productos
WHERE nombre = 'Gafas Aviador Classic'
LIMIT 1;
```

---

## 🔐 Seguridad (Row Level Security)

El esquema incluye políticas RLS básicas. **IMPORTANTE**:
- Actualmente las políticas permiten acceso completo
- Debes configurar autenticación y ajustar las políticas según tus necesidades
- Consulta la documentación de Supabase Auth para implementar autenticación

---

## 🆘 Solución de Problemas

### Error: "Falta configurar las variables de entorno"
- Verifica que `.env.local` existe
- Verifica que las variables empiezan con `NEXT_PUBLIC_`
- Reinicia el servidor de desarrollo

### Error: "relation does not exist"
- Asegúrate de haber ejecutado el schema.sql completo
- Verifica en Table Editor que las tablas existen

### Error de conexión
- Verifica que la URL de Supabase es correcta
- Verifica que el anon key es correcto
- Verifica que tu proyecto de Supabase está activo

---

## 📚 Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase SQL Editor](https://supabase.com/docs/guides/database)
