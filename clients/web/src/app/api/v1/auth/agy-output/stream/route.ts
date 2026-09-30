// ─────────────────────────────────────────────
// GravWatch - AGY Output Stream API Proxy
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

import { NextRequest } from "next/server";
import { backendFetch } from "@/app/api/v1/proxy";

export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("account_id") || "acc-1";

  try {
    const response = await backendFetch(
      `/api/v1/auth/agy-output/stream?account_id=${encodeURIComponent(accountId)}`,
      { method: "GET" }
    );

    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("AGY stream proxy error:", error);
    return new Response("data: {\"success\":false,\"error\":\"stream proxy error\"}\n\n", {
      status: 500,
      headers: { "Content-Type": "text/event-stream" }
    });
  }
}
