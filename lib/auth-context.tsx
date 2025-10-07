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
      console.log('🔍 Intentando obtener perfil para userId:', userId);

      // Agregar timeout de 5 segundos
      const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve({ data: null, error: null, timedOut: true }), 5000)
      );

      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .then(result => ({ ...result, timedOut: false }));

      const result = await Promise.race([queryPromise, timeoutPromise]) as any;

      // Si hubo timeout, refrescar sesión y reintentar
      if (result.timedOut) {
        console.log('⏱️ TIMEOUT DETECTADO después de 5 segundos');
        console.log('🔄 Intentando refrescar sesión...');

        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          console.error('❌ Error al refrescar sesión:', refreshError);
          setProfile(null);
          return;
        }

        if (session) {
          console.log('✅ Sesión refrescada exitosamente');
          console.log('🔄 Reintentando cargar perfil...');

          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (!error && data) {
            console.log('✅ ÉXITO: Perfil cargado después de refrescar sesión:', data);
            setProfile(data as UserProfile);
            return;
          } else if (error) {
            console.error('❌ FALLO: Error al cargar perfil después de refrescar sesión:', {
              code: error.code,
              message: error.message,
              details: error.details
            });
            setProfile(null);
            return;
          }
        } else {
          console.error('❌ No se pudo obtener sesión después de refrescar');
          setProfile(null);
          return;
        }
      }

      const { data, error } = result;

      console.log('📦 Respuesta de Supabase:', { data, error, hasData: !!data, hasError: !!error });

      if (error) {
        console.error('❌ Error al obtener perfil:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          userId: userId,
        });

        // Si es error PGRST116 (no encontrado), el perfil no existe
        if (error.code === 'PGRST116') {
          console.warn('⚠️ Perfil no encontrado para userId:', userId);
          console.warn('Esperando 2 segundos para que el trigger cree el perfil...');
        } else if (error.code === 'PGRST301') {
          console.error('❌ Error de políticas RLS - el usuario no tiene permiso para leer su perfil');
          console.error('👉 Ejecuta el script supabase-FIX-SELECT-POLICY.sql');
        }

        // Reintentar una vez después de un delay
        setTimeout(async () => {
          console.log('🔄 Reintentando obtener perfil...');
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (!retryError && retryData) {
            console.log('✅ Perfil cargado exitosamente en reintento:', retryData);
            setProfile(retryData as UserProfile);
          } else {
            console.error('❌ Error al reintentar obtener perfil:', {
              code: retryError?.code,
              message: retryError?.message,
              userId: userId,
            });
            setProfile(null);
          }
        }, 2000);
        return;
      }

      console.log('✅ Perfil cargado exitosamente:', data);
      setProfile(data as UserProfile);
    } catch (error) {
      console.error('❌ Error inesperado al obtener perfil:', error);
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

    // Refrescar sesión cada 4 minutos para evitar expiración
    const refreshInterval = setInterval(async () => {
      console.log('🔄 Refrescando sesión automáticamente...');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('❌ Error al refrescar sesión:', error);
      } else if (session) {
        console.log('✅ Sesión refrescada automáticamente');
      }
    }, 4 * 60 * 1000); // 4 minutos

    // Refrescar sesión cuando la pestaña vuelve a estar activa
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        console.log('👀 Pestaña activa - Verificando sesión...');

        // Crear un timeout que recargue la página si tarda más de 2 segundos
        const reloadTimeout = setTimeout(() => {
          console.log('⏱️ Timeout detectado al volver, recargando página...');
          window.location.reload();
        }, 2000);

        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();

          clearTimeout(reloadTimeout); // Cancelar recarga si la sesión se obtuvo a tiempo

          if (currentSession?.user) {
            console.log('✅ Sesión válida encontrada, cargando perfil...');
            await fetchProfile(currentSession.user.id);
          } else {
            console.log('⚠️ No hay sesión válida, recargando página...');
            window.location.reload();
          }
        } catch (err) {
          clearTimeout(reloadTimeout);
          console.error('❌ Error al verificar sesión:', err);
          window.location.reload();
        }
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
