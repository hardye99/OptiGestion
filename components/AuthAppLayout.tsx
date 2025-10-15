"use client";

import { ReactNode, Suspense, useEffect } from "react";
import { Sidebar } from "@/components/SideBar";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { MobileMenu } from "./MobileMenu";

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

  // --- LÓGICA DE REDIRECCIÓN EN useEffect ---
  useEffect(() => {
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
  }, [loading, user, isPublicRoute, router, profile]); 
  // ---------------------------------------------------------------------------------

  // --- RENDERING PROTECTION ---

  // 1. Loading Protection (Espera el estado inicial Y la carga del perfil)
  if (loading || (user && !profile)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        Cargando datos de la aplicación...
      </div>
    );
  }
  
  // 2. Unauthenticated State (user is null, loading is false)
  if (!user && isPublicRoute) {
     return <>{children}</>;
  }

  // 3. Authenticated State but Profile is NULL (Fail-safe render)
  // Si el usuario existe pero el perfil falló al cargarse (debido a RLS, tabla DB, etc.).
  // Renderizamos el contenido directamente, mostrando un error, pero EVITANDO el Sidebar.
  if (user && !profile) {
    return (
        <div className="flex min-h-screen bg-gray-50 flex-col">
            <div className="p-4 bg-yellow-100 text-yellow-800 text-center font-semibold">
                ⚠️ Error de perfil: No se pudo cargar el perfil del usuario. La funcionalidad puede estar limitada.
            </div>
            <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                <Suspense fallback={<div>Cargando contenido...</div>}>
                    {children}
                </Suspense>
            </main>
        </div>
    );
  }
  
  // 4. Renderizado Final para Usuarios Autenticados y Cargados (user y profile garantizados)
  // Esta es la ruta que se toma cuando la carga es 100% exitosa.
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Menu Móvil Flotante */}
      <MobileMenu />

      {/* Sidebar Fijo (Desktop) */}
      <aside className="hidden lg:flex"> 
        <Sidebar />
      </aside>
      
      {/* Contenido Principal */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        <Suspense fallback={<div>Cargando contenido...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}

export function AuthAppLayout({ children }: AuthLayoutProps) {
  return (
    <AuthProvider>
      <AppStructure>{children}</AppStructure>
    </AuthProvider>
  );
}
