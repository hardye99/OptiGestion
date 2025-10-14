"use client";

import { ReactNode, Suspense } from "react";
import { Sidebar } from "@/components/SideBar";
import { AuthProvider, useAuth } from "@/lib/auth-context"; // Importa el Provider y el Hook
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

// Este componente aplica la lógica de redirección y la estructura visual
function AppStructure({ children }: AuthLayoutProps) {
  // Ahora destructuramos todo el contexto de autenticación
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  // Función auxiliar para obtener la ruta de forma segura en el servidor
  const getPathname = () => {
    // Es seguro llamar a window.location.pathname aquí porque AppStructure es "use client"
    return typeof window !== 'undefined' ? window.location.pathname : '';
  };
  
  const isPublicRoute = getPathname().startsWith('/login') || getPathname().startsWith('/registro');

  // --- LÓGICA DE REDIRECCIÓN Y CARGA SEGURA ---

  // 1. Renderizado de Carga Inicial
  if (loading) {
    // Renderizado simple mientras Supabase carga la sesión inicial
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Cargando sesión...</div>;
  }
  
  // 2. Redirección y Acceso a Páginas Públicas
  if (!user) {
    if (isPublicRoute) {
      // Permitir la carga del contenido de Login/Registro si no hay usuario
      return <>{children}</>;
    }
    
    // Si no hay usuario y no estamos en una ruta pública, redirigir
    // Este useEffect se encargará de la redirección al login
    useEffect(() => {
        router.replace("/login");
    }, [router]);
    
    // Mostrar un mensaje mientras el router redirige
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Redirigiendo a Login...</div>;
  }
  
  // 3. Renderizado de Aplicación Principal
  // Si llegamos aquí, 'user' existe. Verificamos que el perfil también esté cargado.
  if (user && !profile) { 
      // Retrasar la renderización del contenido completo hasta tener el perfil 
      return <div className="flex items-center justify-center min-h-screen bg-gray-50">Cargando datos de usuario...</div>;
  }
  
  // Redirección de páginas públicas si ya está autenticado (corrección del login)
  if (user && isPublicRoute) {
    // Si el usuario está autenticado y en una página pública (login/registro), redirigir a inicio
    useEffect(() => {
        router.replace("/");
    }, [router]);
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Acceso concedido, redirigiendo...</div>;
  }
  
  // 4. Renderizado Final para Usuarios Autenticados y Cargados
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

// Este es el componente que se usa en app/layout.tsx
export function AuthAppLayout({ children }: AuthLayoutProps) {
  return (
    <AuthProvider>
      <AppStructure>{children}</AppStructure>
    </AuthProvider>
  );
}
