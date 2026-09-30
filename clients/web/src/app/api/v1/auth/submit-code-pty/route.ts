// ─────────────────────────────────────────────
// GravWatch - Submit Code PTY API Proxy
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/app/api/v1/proxy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await backendFetch("/api/v1/auth/submit-code-pty", {
      method: "POST",
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });

    const text = await response.text();
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
