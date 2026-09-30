// ─────────────────────────────────────────────
// GravWatch - AGY Output API Proxy
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/app/api/v1/proxy";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("account_id") || "acc-1";

    const response = await backendFetch(
      `/api/v1/auth/agy-output?account_id=${encodeURIComponent(accountId)}`
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("AGY output proxy error:", error);
    return NextResponse.json(
      { success: false, error: "Proxy error" },
      { status: 500 }
    );
  }
}
