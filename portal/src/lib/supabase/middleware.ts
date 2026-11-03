import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith("/login") || path.startsWith("/auth");
  // Public enrol redirects to the marketing form (avoid /app auth layout)
  const isPublic =
    path === "/" ||
    isAuthPage ||
    path.startsWith("/not-enrolled") ||
    path === "/enrol" ||
    path.startsWith("/enrol/");

  // Old bookmarks to /app/enrol: send to public /enrol (avoids auth layout → /login)
  if (!user && (path === "/app/enrol" || path.startsWith("/app/enrol/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/enrol";
    return NextResponse.redirect(url);
  }

  if (!user && !isPublic && path.startsWith("/app")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
