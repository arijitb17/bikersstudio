// proxy.ts  (replaces middleware.ts in Next.js 15.3+)
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, getIdentifier, rateLimitHeaders } from "@/lib/rateLimiter";

// ─── Rate limit configs (inline to avoid edge-runtime import issues) ──────────
const RATE_LIMITS = {
  auth:  { limit: 10,  window: 60, prefix: "mw:auth" },
  admin: { limit: 120, window: 60, prefix: "mw:admin" },
  api:   { limit: 200, window: 60, prefix: "mw:api" },
} as const;

// ─── Combined proxy: rate limiting + auth/role protection ─────────────────────
export default withAuth(
  async function proxy(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const isAuth = !!token;

    // ── 1. Rate limiting for API routes ──────────────────────────────────────
    if (pathname.startsWith("/api/")) {
      const config =
        pathname.startsWith("/api/auth/")  ? RATE_LIMITS.auth  :
        pathname.startsWith("/api/admin/") ? RATE_LIMITS.admin :
        RATE_LIMITS.api;

      const id = getIdentifier(req as unknown as NextRequest, token?.sub ?? undefined);
      const result = await checkRateLimit(id, config);
      const headers = rateLimitHeaders(result);

      if (!result.success) {
        return NextResponse.json(
          { error: "Too many requests. Please slow down.", retryAfter: result.retryAfter },
          { status: 429, headers }
        );
      }

      // Pass rate-limit headers downstream
      const response = NextResponse.next();
      for (const [k, v] of Object.entries(headers)) {
        response.headers.set(k, v);
      }
      return response;
    }

    // ── 2. Page route protection ──────────────────────────────────────────────
    const isAuthPage =
      pathname.startsWith("/auth/signin") ||
      pathname.startsWith("/auth/signup");
    const isAdminPage    = pathname.startsWith("/admin");
    const isCheckoutPage = pathname.startsWith("/checkout");
    const isProfilePage  = pathname.startsWith("/profile");

    // Redirect already-authenticated users away from auth pages
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Protect checkout + profile
    if ((isCheckoutPage || isProfilePage) && !isAuth) {
      return NextResponse.redirect(
        new URL(`/auth/signin?callbackUrl=${encodeURIComponent(req.url)}`, req.url)
      );
    }

    // Protect admin pages
    if (isAdminPage) {
      if (!isAuth) {
        return NextResponse.redirect(new URL("/auth/signin", req.url));
      }
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true, // Auth logic handled above
    },
  }
);

export const config = {
  matcher: [
    // API routes (rate limiting)
    "/api/:path*",
    // Page routes (auth protection)
    "/admin/:path*",
    "/checkout/:path*",
    "/auth/:path*",
    "/profile/:path*",
  ],
};
