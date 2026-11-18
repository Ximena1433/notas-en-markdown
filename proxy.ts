import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  const requested = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (requested.startsWith("/") && !requested.startsWith("//")) {
    loginUrl.searchParams.set("next", requested);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/notas/:path*", "/versiones/:path*", "/papelera/:path*"],
};
