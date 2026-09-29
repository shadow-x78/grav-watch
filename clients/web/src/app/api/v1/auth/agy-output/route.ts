// ─────────────────────────────────────────────
// GravWatch - AGY Output API Proxy
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ||
  (process.env.NODE_ENV === "production" ? "http://server:8000" : "http://localhost:8000");

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get("account_id") || "acc-1";

    const response = await fetch(
      `${BACKEND_URL}/api/v1/auth/agy-output?account_id=${encodeURIComponent(accountId)}`,
      {
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      }
    );

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[agy-output proxy] error:", error);
    return new NextResponse(
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
