// components/AuthAppLayout.tsx

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

  // --- LÓGICA DE REDIRECCIÓN EN useEffect (NIVEL SUPERIOR) ---
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
  }, [loading, user, isPublicRoute, router]); 
  // -------------------------------------------------------------

  // --- RENDERING PROTECTION ---

  // 1. Renderizado de Carga Inicial (o si el usuario está a medio cargar)
  // Esperar a que 'loading' sea falso Y que si hay 'user', también haya 'profile'.
  if (loading || (user && !profile)) {
      return <div className="flex items-center justify-center min-h-screen bg-gray-50">Cargando datos de la aplicación...</div>;
  }
  
  // 2. Rutas Públicas (Login/Registro)
  // Si no hay usuario y estamos en una ruta pública (el useEffect no redirige)
  if (!user && isPublicRoute) {
     return <>{children}</>;
  }
  
  // 3. Mostrar pantalla de transición si la redirección ya fue iniciada
  // Si el useEffect inicia una redirección (ej. de / a /login, o de /login a /)
  if (!user && !isPublicRoute) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Redirigiendo a Login...</div>;
  }

  if (user && isPublicRoute) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Acceso concedido, redirigiendo...</div>;
  }
  
  // 4. Renderizado Final para Usuarios Autenticados y Cargados (user y profile garantizados)
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
