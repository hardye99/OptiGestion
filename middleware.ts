import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({
            request: req,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Obtener la sesión
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/registro'];
  const isPublicRoute = publicRoutes.some((route) => req.nextUrl.pathname.startsWith(route));

  console.log('🔍 Middleware:', {
    path: req.nextUrl.pathname,
    hasSession: !!session,
    isPublicRoute,
  });

  // Si el usuario está autenticado y trata de acceder a login/registro, redirigir al dashboard
  if (session && isPublicRoute) {
    console.log('✅ Usuario autenticado accediendo a ruta pública, redirigiendo a /');
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Si el usuario no está autenticado y trata de acceder a una ruta protegida, redirigir al login
  if (!session && !isPublicRoute) {
    console.log('❌ Usuario NO autenticado accediendo a ruta protegida, redirigiendo a /login');
    return NextResponse.redirect(new URL('/login', req.url));
  }

  console.log('✅ Permitiendo acceso a:', req.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
