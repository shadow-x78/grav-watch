import { NextResponse } from "next/server";

export async function GET() {
  const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${backendUrl}/api/v1/usage/latest`, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: "upstream_error", status: res.status }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: "upstream_unavailable", message: String(err) }, { status: 503 });
  }
}
