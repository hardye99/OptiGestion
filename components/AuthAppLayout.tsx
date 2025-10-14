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
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  // Función auxiliar para obtener la ruta de forma segura en el navegador
  const getPathname = () => {
    return typeof window !== 'undefined' ? window.location.pathname : '';
  };
  
  const pathname = getPathname();
  const isPublicRoute = pathname.startsWith('/login') || pathname.startsWith('/registro');

  // --- CORRECCIÓN: MOVER AMBOS useEffect AL NIVEL SUPERIOR ---
  useEffect(() => {
    // Esta lógica de redirección solo debe correr en el navegador
    if (typeof window === 'undefined' || loading) {
      return;
    }

    // Lógica 1: Si no hay usuario y NO estamos en una ruta pública, redirigir a /login
    if (!user && !isPublicRoute) {
      router.replace("/login"); 
      return;
    }

    // Lógica 2: Si el usuario SÍ existe y está en una ruta pública (login/registro), redirigir a /
    if (user && isPublicRoute) {
      router.replace("/");
      return;
    }
  }, [loading, user, isPublicRoute, router]); 
  // -----------------------------------------------------------

  // Renderizado de Carga Inicial
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Cargando sesión...</div>;
  }

  // Comprobar el perfil si el usuario existe antes de renderizar el layout completo
  if (user && !profile) { 
      return <div className="flex items-center justify-center min-h-screen bg-gray-50">Cargando datos de usuario...</div>;
  }
  
  // Renderizado para Rutas Públicas (Login/Registro)
  if (!user && isPublicRoute) {
     return <>{children}</>;
  }

  // Mostrar un cargando/redirigiendo si el useEffect está a punto de actuar
  if (!user && !isPublicRoute) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Redirigiendo a Login...</div>;
  }

  // Redirección de páginas públicas si ya está autenticado (user existe y isPublicRoute es true)
  if (user && isPublicRoute) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Acceso concedido, redirigiendo...</div>;
  }
  
  // Renderizado Final para Usuarios Autenticados y Cargados (user y profile son válidos aquí)
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
