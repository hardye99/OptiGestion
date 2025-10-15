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

  // Función auxiliar para obtener la ruta de forma segura
  const getPathname = () => {
    return typeof window !== 'undefined' ? window.location.pathname : '';
  };
  
  const pathname = getPathname();
  const isPublicRoute = pathname.startsWith('/login') || pathname.startsWith('/registro');

  // --- LÓGICA DE REDIRECCIÓN EN useEffect (NIVEL SUPERIOR) ---
  useEffect(() => {
    // Si estamos en el servidor o cargando, ignorar la redirección
    if (typeof window === 'undefined' || loading) {
      return;
    }

    // A. Redirigir a /login si no hay usuario y no estamos en ruta pública
    if (!user && !isPublicRoute) {
      router.replace("/login"); 
      return;
    }

    // B. Redirigir a / si hay usuario y estamos en una ruta pública
    if (user && isPublicRoute) {
      router.replace("/");
      return;
    }
  }, [loading, user, isPublicRoute, router]); 
  // -------------------------------------------------------------

  // --- RENDERING PROTECTION ---

  // 1. Si está cargando O el usuario está autenticado pero el perfil NO (estado crítico)
  if (loading || (user && !profile)) {
      return <div className="flex items-center justify-center min-h-screen bg-gray-50">Cargando datos de la aplicación...</div>;
  }
  
  // 2. Si no hay usuario y el useEffect no ha redirigido (sólo debería ser en /login o /registro)
  if (!user) {
     return <>{children}</>;
  }
  
  // 3. Renderizado Final para Usuarios Autenticados y Cargados (user y profile garantizados)
  // Nota: Si el usuario ya está autenticado pero recarga en /login, la lógica del useEffect
  // ya inició la redirección a "/", por lo que este bloque no se renderiza hasta el siguiente ciclo.
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
