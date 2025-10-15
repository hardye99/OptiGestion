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

  // --- LÓGICA DE REDIRECCIÓN EN useEffect (NIVEL SUPERIOR) ---
  useEffect(() => {
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
  // -------------------------------------------------------------

  // Renderizado de Carga Inicial
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Cargando sesión...</div>;
  }
  
  // Renderizado para Rutas Públicas (Login/Registro)
  if (!user && isPublicRoute) {
     return <>{children}</>;
  }
  
  // Renderizado Condicional para Rutas de Aplicación Protegidas
  
  // Caso 1: Usuario NO autenticado, pero NO estamos en una ruta pública.
  // Esto significa que el useEffect está intentando redirigir.
  if (!user && !isPublicRoute) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Redirigiendo a Login...</div>;
  }

  // Caso 2: Usuario autenticado, pero el perfil aún no se ha cargado.
  // Evitamos que el Sidebar o las páginas fallen por falta de datos.
  if (user && !profile) { 
      return <div className="flex items-center justify-center min-h-screen bg-gray-50">Cargando datos de usuario...</div>;
  }

  // Caso 3: Usuario autenticado Y en ruta pública.
  // El useEffect ya inició la redirección a "/", mostramos un mensaje temporal.
  if (user && isPublicRoute) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Acceso concedido, redirigiendo...</div>;
  }
  
  // Caso 4: Renderizado Final (Usuario y Perfil cargados, en ruta privada)
  // Aquí sabemos que user y profile existen.
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
