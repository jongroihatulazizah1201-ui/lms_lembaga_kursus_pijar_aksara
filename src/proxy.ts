import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', path);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Helper untuk redirect dengan mempertahankan seluruh cookie sesi terbaru
  const createRedirect = (url: URL | string) => {
    const redirectUrl = typeof url === 'string' ? new URL(url, request.url) : url;
    const redirectRes = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectRes;
  };

  const { data: { user } } = await supabase.auth.getUser();

  // Rute yang diproteksi berdasarkan peran
  const isAdminRoute = path.startsWith('/admin');
  const isInstrukturRoute = path.startsWith('/instruktur');
  const isPesertaRoute = path.startsWith('/kursus-saya') || path.startsWith('/belajar');
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/register');

  // 1. Jika pengguna sudah login mencoba membuka halaman auth (/login atau /register):
  // Segera alihkan ke halaman utama sesuai peran tanpa menampilkan halaman login
  if (isAuthRoute && user) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('peran')
        .eq('id', user.id)
        .single();

      if (profile?.peran === 'admin') {
        return createRedirect('/admin/dashboard');
      } else if (profile?.peran === 'instruktur') {
        return createRedirect('/instruktur');
      } else {
        return createRedirect('/kursus-saya');
      }
    } catch {
      return createRedirect('/kursus-saya');
    }
  }

  // 2. Proteksi rute terlindungi
  if (isAdminRoute || isInstrukturRoute || isPesertaRoute) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', path);
      return createRedirect(redirectUrl);
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('peran, aktif')
        .eq('id', user.id)
        .single();

      if (profile && profile.aktif === false) {
        return createRedirect('/login?error=inactive');
      }

      if (profile) {
        if (isAdminRoute && profile.peran !== 'admin') {
          return new NextResponse('403 Forbidden - Anda tidak memiliki hak akses Admin.', { status: 403 });
        }

        if (isInstrukturRoute && profile.peran !== 'instruktur' && profile.peran !== 'admin') {
          return new NextResponse('403 Forbidden - Anda tidak memiliki hak akses Instruktur.', { status: 403 });
        }
      }
    } catch {
      // Jika terjadi kendala jaringan sementara di proxy, izinkan request lolos
      // ke Server Component untuk diverifikasi ulang tanpa membuang sesi user secara keliru
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
