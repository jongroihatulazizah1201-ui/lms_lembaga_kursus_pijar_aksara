import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
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
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Rute yang diproteksi berdasarkan peran
  const isAdminRoute = path.startsWith('/admin');
  const isInstrukturRoute = path.startsWith('/instruktur');
  const isPesertaRoute = path.startsWith('/kursus-saya') || path.startsWith('/belajar');
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/register');

  if (isAdminRoute || isInstrukturRoute || isPesertaRoute) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(redirectUrl);
    }

    // Ambil peran pengguna dari profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('peran, aktif')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.aktif) {
      // Akun tidak aktif / tidak ditemukan
      return NextResponse.redirect(new URL('/login?error=inactive', request.url));
    }

    const peran = profile.peran;

    if (isAdminRoute && peran !== 'admin') {
      return new NextResponse('403 Forbidden - Anda tidak memiliki hak akses Admin.', { status: 403 });
    }

    if (isInstrukturRoute && peran !== 'instruktur' && peran !== 'admin') {
      return new NextResponse('403 Forbidden - Anda tidak memiliki hak akses Instruktur.', { status: 403 });
    }
  }

  // Jika sudah login dan membuka /login atau /register, redirect ke halaman utama masing-masing peran
  if (isAuthRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('peran')
      .eq('id', user.id)
      .single();

    if (profile?.peran === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else if (profile?.peran === 'instruktur') {
      return NextResponse.redirect(new URL('/instruktur/kursus', request.url));
    } else {
      return NextResponse.redirect(new URL('/kursus-saya', request.url));
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
