// ─────────────────────────────────────────────
// GravWatch - Container Toggle API Proxy
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/app/api/v1/proxy";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("account_id") || "acc-1";

    const response = await backendFetch(
      `/api/v1/auth/container/toggle?account_id=${encodeURIComponent(accountId)}`,
      { method: "POST" }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Container toggle proxy error:", error);
    return NextResponse.json(
      { success: false, error: "Proxy error" },
      { status: 500 }
    );
  }
}
