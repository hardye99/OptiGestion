"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { useRouter } from "next/navigation";
import { UserProfile, UserRole } from "./types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, metadata?: { nombre?: string; empresa?: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Función para obtener el perfil del usuario
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error al obtener perfil:', error);
        setProfile(null);
        return;
      }

      setProfile(data as UserProfile);
    } catch (error) {
      console.error('Error inesperado al obtener perfil:', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    console.log('🚀 AuthProvider: Iniciando useEffect');

    // Obtener sesión inicial
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      console.log('📡 getSession resultado:', {
        hasSession: !!session,
        userId: session?.user?.id,
        error: error
      });

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log('👤 Usuario encontrado, cargando perfil...');
        await fetchProfile(session.user.id);
      } else {
        console.log('❌ No hay sesión de usuario');
      }

      setLoading(false);
    }).catch((err) => {
      console.error('❌ Error al obtener sesión:', err);
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    // Refrescar sesión cada 50 minutos
    const refreshInterval = setInterval(async () => {
      const { error } = await supabase.auth.refreshSession();
      if (!error) {
        console.log('✅ Sesión refrescada automáticamente');
      }
    }, 50 * 60 * 1000);

    // Recargar página cuando vuelves a la pestaña (solución simple y efectiva)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Volviste a la pestaña, recargando página...');
        window.location.reload();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Error al iniciar sesión:', error);
        return { error: error.message };
      }

      if (data.session) {
        console.log('✅ Sesión creada correctamente:', {
          user: data.user.email,
          sessionId: data.session.access_token.substring(0, 20) + '...'
        });
      }

      // No hacemos router.push aquí, dejamos que el middleware maneje la redirección
      return { error: null };
    } catch (error) {
      console.error('❌ Error inesperado al iniciar sesión:', error);
      return { error: "Error al iniciar sesión" };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: { nombre?: string; empresa?: string }
  ) => {
    try {
      console.log('🔄 Intentando registrar usuario:', { email, metadata });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: undefined, // Desactivar confirmación de email
        },
      });

      if (error) {
        console.error('❌ Error al registrar usuario:', error);
        return { error: error.message };
      }

      console.log('✅ Usuario registrado exitosamente:', data.user?.email);

      // Esperar un momento para que el trigger cree el perfil
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { error: null };
    } catch (error) {
      console.error('❌ Error inesperado al registrar:', error);
      return { error: "Error al crear la cuenta" };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    router.push("/login");
  };

  // Verificar si el usuario tiene un rol específico
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!profile) return false;

    if (Array.isArray(roles)) {
      return roles.includes(profile.role);
    }

    return profile.role === roles;
  };

  const value = {
    user,
    profile,
    session,
    loading,
    hasRole,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
