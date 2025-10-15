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
      
      // Si no hay datos (perfil no encontrado), establece explícitamente a null
      if (!data) {
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

    let refreshInterval: NodeJS.Timeout | null = null;
    
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
        // *** CAMBIO CLAVE: Esperar a que el perfil termine de cargar ***
        await fetchProfile(session.user.id);
      } else {
        console.log('❌ No hay sesión de usuario');
        setProfile(null); // Asegurar que el perfil es nulo si no hay sesión
      }

      // *** CAMBIO CLAVE: Mover setLoading(false) aquí ***
      setLoading(false); 
    }).catch((err) => {
      console.error('❌ Error al obtener sesión:', err);
      setLoading(false);
      setProfile(null);
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

    // === Lógica Específica del Navegador (Refresco de sesión) ===
    if (typeof window !== 'undefined') {
      refreshInterval = setInterval(async () => {
        const { error } = await supabase.auth.refreshSession();
        if (!error) {
          console.log('✅ Sesión refrescada automáticamente');
        }
      }, 50 * 60 * 1000);
    }
    // ==========================================================
    
    return () => {
      subscription.unsubscribe();
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  // ********* DEFINICIONES DE MÉTODOS DE AUTENTICACIÓN *********

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
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        console.error('❌ Error al registrar usuario:', error);
        return { error: error.message };
      }

      console.log('✅ Usuario registrado exitosamente:', data.user?.email);

      // Esperar un momento para que el trigger cree el perfil
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Lógica para enviar correo de bienvenida (requiere implementación en lib/email.ts)
      if (data.user) {
        console.log('📬 Correo de bienvenida (Email/Password) marcado para envío.');
      }

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

  // *****************************************************************************

  // Verificar si el usuario tiene un rol específico
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!profile) return false;

    if (Array.isArray(roles)) {
      return roles.includes(profile.role);
    }

    return (profile as any).role === roles; 
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
