import { NextResponse } from "next/server";
import { INITIAL_ACCOUNTS, INITIAL_TIMELINE_DATA } from "@/lib/mockGravWatchData";

// ============================================================================
// TODO: [BACKEND INTEGRATION] - Next.js Edge Proxy Route → FastAPI Usage Hub
//
// 1. Static Fallback Payload (currently returned):
//    - Hardcoded `pooled_percent: 74.2`, mock model token counts, and INITIAL_TIMELINE_DATA.
//    - All values must be replaced with live data from the FastAPI backend.
//
// 2. Production Implementation:
//    - Proxy downstream to `http://localhost:8000/api/v1/usage/latest`.
//    - Add SWR cache headers so the browser reuses the previous response for 10 seconds:
//      `NextResponse.headers.set('Cache-Control', 's-maxage=10, stale-while-revalidate=59')`
//    - Normalize field names if the FastAPI response schema differs from the frontend contract.
//
// 3. Response Contract (expected FastAPI payload):
//    {
//      "pooled_percent": 68.4,
//      "total_tokens_limit": 12000000,
//      "total_tokens_used": 3841200,
//      "active_containers": 5,
//      "models": { "gemini-flash": { "used_tokens": 820000, "limit_tokens": 3000000, "rpm": 45 } },
//      "timeline": [ { "time": "00:00", "usage": 12.3 } ],
//      "timestamp": "2025-01-01T00:00:00Z"
//    }
//
// 4. Purpose / Why Needed:
//    - Exposes a unified edge API for external observability tools (Grafana, Prometheus) without exposing the raw FastAPI port.
//
// 5. Edge Cases:
//    - [ ] FastAPI Unreachable: Return HTTP 503 with `{ "error": "upstream_unavailable" }` instead of crashing the page.
//    - [ ] Timeout Safeguard: Abort upstream fetch after 5 seconds to avoid Next.js edge function timeouts.
//    - [ ] Schema Mismatch: Validate the upstream response shape before forwarding; log & fallback on validation failure.
// ============================================================================

export async function GET() {
  return NextResponse.json({
    status: "ok",
    pooled_percent: 74.2,
    total_tokens_limit: 12000000,
    total_tokens_used: 3100000,
    active_containers: INITIAL_ACCOUNTS.length,
    models: {
      "gemini-flash": { used_tokens: 820000, limit_tokens: 3000000, rpm: 45 },
      "gemini-pro": { used_tokens: 610000, limit_tokens: 2000000, rpm: 18 },
      "claude-sonnet": { used_tokens: 950000, limit_tokens: 2500000, rpm: 22 },
      "claude-opus": { used_tokens: 280000, limit_tokens: 600000, rpm: 5 },
      "gpt-oss": { used_tokens: 440000, limit_tokens: 2000000, rpm: 20 },
    },
    timeline: INITIAL_TIMELINE_DATA,
    timestamp: new Date().toISOString(),
  });
}
