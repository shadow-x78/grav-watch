// ─────────────────────────────────────────────
// GravWatch - Start PTY Auth API Proxy
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ||
  (process.env.NODE_ENV === "production" ? "http://server:8000" : "http://localhost:8000");

export async function GET(request: NextRequest) {
  // Redirect GET to POST for compat
  return POST(request);
}

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get("account_id") || "acc-1";
    console.log("[start-pty proxy] account:", accountId);

    const url = `${BACKEND_URL}/api/v1/auth/start-pty?account_id=${encodeURIComponent(accountId)}`;
    console.log("[start-pty proxy] forwarding to:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // start-pty provisions a container and walks agy through onboarding
      // before the URL is captured; allow up to 2 minutes.
      signal: AbortSignal.timeout(120000),
    });

    console.log("[start-pty proxy] backend status:", response.status);

    const text = await response.text();
    console.log("[start-pty proxy] backend body:", text.substring(0, 100));

    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("[start-pty proxy] error:", error);
    return new NextResponse(
      JSON.stringify({ success: false, error: "Proxy error: " + (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

