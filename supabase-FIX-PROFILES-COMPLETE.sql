-- ============================================
-- SOLUCIÓN COMPLETA: POLÍTICAS PARA TABLA PROFILES
-- ============================================

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Developers can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- ============================================
-- POLÍTICA SELECT: Todos pueden leer todos los perfiles
-- ============================================
CREATE POLICY "Allow authenticated users to read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- POLÍTICA INSERT: Los usuarios pueden crear su propio perfil
-- ============================================
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ============================================
-- POLÍTICA UPDATE: Los usuarios pueden actualizar su propio perfil
-- ============================================
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT
    '📋 ' || policyname as politica,
    cmd as comando,
    CASE
        WHEN qual IS NULL THEN '✅ Sin restricciones de lectura'
        ELSE '⚠️ Restricciones: ' || qual
    END as detalles_lectura,
    CASE
        WHEN with_check IS NULL THEN '✅ Sin restricciones de escritura'
        ELSE '⚠️ Restricciones: ' || with_check
    END as detalles_escritura
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- Resultado esperado:
-- 1. INSERT: Users can insert own profile (solo su propio perfil)
-- 2. SELECT: Allow authenticated users to read all profiles (sin restricciones)
-- 3. UPDATE: Users can update own profile (solo su propio perfil)
