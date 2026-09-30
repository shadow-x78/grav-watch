// ─────────────────────────────────────────────
// GravWatch - Usage Latest API Proxy
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

import { NextResponse } from "next/server";
import { backendFetch } from "@/app/api/v1/proxy";

export async function GET() {
  try {
    const res = await backendFetch("/api/v1/usage/latest");
    if (!res.ok) {
      return NextResponse.json({ error: "upstream_error", status: res.status }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: "upstream_unavailable", message: String(err) }, { status: 503 });
  }
}
