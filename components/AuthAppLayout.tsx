"use client";

import { ReactNode, Suspense, useEffect } from "react";
import { Sidebar } from "@/components/SideBar";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

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
    // Si estamos en el servidor o la carga aún no termina, ignorar la redirección
    if (typeof window === 'undefined' || loading) {
      return;
    }

    // Caso 1: Usuario NO autenticado y en ruta privada -> Redirigir a /login
    if (!user && !isPublicRoute) {
      router.replace("/login"); 
      return;
    }

    // Caso 2: Usuario autenticado y en ruta pública (/login, /registro) -> Redirigir a /
    if (user && isPublicRoute) {
      router.replace("/");
      return;
    }
  }, [loading, user, isPublicRoute, router, profile]); 
  // ---------------------------------------------------------------------------------

  // --- RENDERING PROTECTION ---
  if (loading || (user && !profile)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        Cargando datos de la aplicación...
      </div>
    );
  }
  
  if (!user && isPublicRoute) {
     return <>{children}</>;
  }
  
  if (!user && !isPublicRoute) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Redirigiendo a Login...</div>;
  }

  if (user && isPublicRoute) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Acceso concedido, redirigiendo...</div>;
  }
  
  // 4. Renderizado Final para Usuarios Autenticados (Sidebar siempre visible)
  return (
    // FIX MOBILE LAYOUT: Se elimina la clase 'hidden' y el Sidebar siempre se renderiza
    <div className="flex min-h-screen bg-gray-50">
      
      {/* El Sidebar estará visible por defecto. En producción, se debería usar un menú hamburguesa */}
      {/* Se mantiene la clase w-64/w-20 de Sidebar para la disposición general */}
      <Sidebar /> 
      
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto"> {/* p-4 en móvil, p-8 en desktop */}
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
