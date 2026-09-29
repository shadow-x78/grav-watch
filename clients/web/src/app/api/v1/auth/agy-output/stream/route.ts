// ─────────────────────────────────────────────
// GravWatch - AGY Output Stream API Proxy
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ||
  (process.env.NODE_ENV === "production" ? "http://server:8000" : "http://localhost:8000");

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get("account_id") || "acc-1";

    const upstream = await fetch(
      `${BACKEND_URL}/api/v1/auth/agy-output/stream?account_id=${encodeURIComponent(accountId)}`,
      {
        headers: {
          "Accept": "text/event-stream",
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      }
    );

    if (!upstream.ok || !upstream.body) {
      return new Response(
        JSON.stringify({ success: false, output: "", empty: true, error: `Upstream ${upstream.status}` }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[agy-output-stream proxy] error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        output: "",
        empty: true,
        error: "Proxy error: " + (error as Error).message,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
