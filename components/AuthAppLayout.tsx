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
  const { user, loading } = useAuth();
  const router = useRouter();

  // Función auxiliar para obtener la ruta de forma segura en el servidor
  const getPathname = () => {
    return typeof window !== 'undefined' ? window.location.pathname : '';
  };
  
  const isPublicRoute = getPathname().startsWith('/login') || getPathname().startsWith('/registro');

  // Redirección simple: si no está cargando y no hay usuario, ir a login
  useEffect(() => {
    // La redirección solo ocurre en el navegador
    if (typeof window !== 'undefined') {
      if (!loading && !user && !isPublicRoute) {
        router.replace("/login"); 
      } else if (!loading && user && isPublicRoute) {
        // Si el usuario está autenticado y en una página pública, redirige a '/'
        router.replace("/");
      }
    }
  }, [loading, user, router, isPublicRoute]); // isPublicRoute es segura aquí porque se usa en el chequeo

  // Renderizado para SSR/Client
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Cargando sesión...</div>;
  }
  
  // Si no hay usuario y estamos en una ruta pública, renderiza el contenido (Login/Registro)
  if (!user && isPublicRoute) {
     return <>{children}</>;
  }

  // Si no hay usuario y NO estamos en una ruta pública (e.g., /_not-found, /), 
  // mostramos un cargando mientras el useEffect hace la redirección a /login
  if (!user && !isPublicRoute) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Redirigiendo...</div>;
  }

  // Estructura de la aplicación para usuarios autenticados
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Suspense fallback={<div>Cargando contenido...</div>}>
          {children}
        </Suspense>
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
