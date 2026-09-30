// ─────────────────────────────────────────────
// GravWatch - Start PTY Auth API Proxy
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/app/api/v1/proxy";

export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get("account_id") || "acc-1";

    const response = await backendFetch(
      `/api/v1/auth/start-pty?account_id=${encodeURIComponent(accountId)}`,
      { method: "POST", signal: AbortSignal.timeout(120000) }
    );

    const text = await response.text();
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
