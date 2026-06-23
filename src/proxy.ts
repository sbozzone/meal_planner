import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const PUBLIC_API_PATHS = new Set([
  "/api/family/create",
  "/api/family/join",
]);

const SHARE_CODE_PATTERN = /^[A-Za-z0-9_-]{8}$/;
const AI_REQUEST_WINDOW_MS = 60_000;
const AI_REQUEST_LIMIT = 8;
const aiRequestBuckets = new Map<string, { count: number; resetAt: number }>();

function accessDenied() {
  return NextResponse.json(
    { error: "Join this family before accessing its data" },
    { status: 401 }
  );
}

// This is intentionally a best-effort in-process limit. It prevents casual
// runaway usage; production should also enforce a durable edge/Redis limit.
function allowAiRequest(request: NextRequest, familyId: string) {
  const now = Date.now();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `${familyId}:${ip}`;
  const bucket = aiRequestBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    aiRequestBuckets.set(key, { count: 1, resetAt: now + AI_REQUEST_WINDOW_MS });
    return true;
  }

  if (bucket.count >= AI_REQUEST_LIMIT) return false;
  bucket.count += 1;
  return true;
}

/**
 * A share code is the household's bearer credential. Keep it in an HttpOnly
 * cookie and resolve it to an internal family ID on the server. API handlers
 * never receive a client-controlled family ID.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (PUBLIC_API_PATHS.has(pathname)) {
      return NextResponse.next();
    }

    const shareCode = request.cookies.get("familyCode")?.value;
    if (!shareCode || !SHARE_CODE_PATTERN.test(shareCode)) {
      return accessDenied();
    }

    const supabase = createServerClient();
    const { data: family } = await supabase
      .from("families")
      .select("id")
      .eq("share_code", shareCode)
      .maybeSingle();

    if (!family) {
      return accessDenied();
    }

    if (pathname.startsWith("/api/ai/") && !allowAiRequest(request, family.id)) {
      return NextResponse.json(
        { error: "Too many AI requests. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const headers = new Headers(request.headers);
    // Deliberately overwrite any caller-provided value.
    headers.set("x-family-id", family.id);

    return NextResponse.next({ request: { headers } });
  }

  // Let a person opening a valid share link join the household without an
  // extra intermediate screen. The API proxy still verifies this code against
  // the database before it grants data access.
  const firstSegment = pathname.split("/")[1];
  if (firstSegment && SHARE_CODE_PATTERN.test(firstSegment)) {
    const response = NextResponse.next();
    response.cookies.set("familyCode", firstSegment, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/:familyCode"],
};
