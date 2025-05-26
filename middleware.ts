import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

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
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  if (user && pathname.startsWith('/learn')) {
    try {
      const { error: fetchLimitsError } = await supabase
        .from('user_limits')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (fetchLimitsError && fetchLimitsError.code === 'PGRST116') {
        console.log(`No user_limits found for user, creating one.`);
        const { error: insertLimitsError } = await supabase
          .from('user_limits')
          .insert({ user_id: user.id });

        if (insertLimitsError) {
          console.error(
            'Middleware: Error creating user_limits record:',
            insertLimitsError.message,
          );
        }
      } else if (fetchLimitsError) {
        console.error('Middleware: Error fetching user_limits:', fetchLimitsError.message);
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error(
          'Middleware: Unexpected error in ensureUserLimits logic (on /learn):',
          e.message,
        );
      } else {
        console.error(
          'Middleware: Unexpected error in ensureUserLimits logic (on /learn):',
          String(e),
        );
      }
    }
  }

  if (!user && pathname.startsWith('/learn')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (!user && pathname.startsWith('/my-flashcards')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (!user && pathname.startsWith('/profile')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/learn';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*?)',
  ],
};
