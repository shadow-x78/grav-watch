// ─────────────────────────────────────────────
// GravWatch - Submit Code PTY API Proxy
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ||
  (process.env.NODE_ENV === "production" ? "http://server:8000" : "http://localhost:8000");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[submit-code-pty proxy] body:", JSON.stringify(body).substring(0, 100));

    const url = `${BACKEND_URL}/api/v1/auth/submit-code-pty`;
    console.log("[submit-code-pty proxy] forwarding to:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });

    console.log("[submit-code-pty proxy] backend status:", response.status);
    const text = await response.text();
    console.log("[submit-code-pty proxy] backend body:", text.substring(0, 100));

    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("[submit-code-pty proxy] error:", error);
    return new NextResponse(
      JSON.stringify({ success: false, error: "Proxy error: " + (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

