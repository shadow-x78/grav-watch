// ─────────────────────────────────────────────
// GravWatch - Accounts API Proxy
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/app/api/v1/proxy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email = body?.email;
    if (!email) {
      return NextResponse.json(
        { success: false, error: "email is required" },
        { status: 400 }
      );
    }

    const response = await backendFetch("/api/v1/auth/accounts", {
      method: "POST",
      body: JSON.stringify({
        alias: body.alias || "Account",
        email: email,
        plan: body.plan || "Google AI Pro",
        access_token: body.access_token,
        refresh_token: body.refresh_token,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Auth accounts proxy error:", error);
    return NextResponse.json(
      { success: false, error: "Proxy error" },
      { status: 500 }
    );
  }
}
