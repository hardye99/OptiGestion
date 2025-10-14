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

  // Redirección simple: si no está cargando y no hay usuario, ir a login
  useEffect(() => {
    if (!loading && !user) {
      // Usar replace para evitar volver a la página anterior después del login
      router.replace("/login"); 
    }
  }, [loading, user, router]);

  // Si está cargando o no hay usuario autenticado, muestra solo el login o una pantalla de carga
  if (loading || !user) {
    // Si la ruta es /login, renderiza el contenido (para que el formulario aparezca)
    // De lo contrario, muestra una pantalla de carga para evitar destellos
    if (window.location.pathname.startsWith('/login') || window.location.pathname.startsWith('/registro')) {
       return <>{children}</>;
    }
    
    // El Sidebar no se renderiza hasta que el usuario es conocido
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Cargando sesión...</div>;
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
