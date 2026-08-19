import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "gravwatch-server",
    version: "2.4.1",
    engine: "FastAPI + Docker multi-account daemon",
    containers_online: 5,
    timestamp: new Date().toISOString(),
  });
}
