"use client";

import React from "react";
import { MetricCardsGrid } from "./MetricCardsGrid";
import { ModelQuotaMatrix } from "./ModelQuotaMatrix";
import { UsageTimelineChart } from "./UsageTimelineChart";
import { PoolDonutChart } from "./PoolDonutChart";
import { LiveActivityFeed } from "./LiveActivityFeed";

// ============================================================================
// TODO: [BACKEND INTEGRATION] - Main Overview Telemetry Dashboard
//
// 1. Dashboard Layout Components:
//    - `MetricCardsGrid`: Renders top 4 aggregated KPI telemetry metrics (`GET /api/v1/usage/latest`).
//    - `ModelQuotaMatrix`: Displays twin-tier quota meters and rolling timers (`GET /api/v1/accounts/{id}/quota`).
//    - `UsageTimelineChart`: Visualizes historical token consumption trends (`GET /api/v1/metrics/timeline`).
//    - `PoolDonutChart`: Renders quota share breakdown per node (`GET /api/v1/telemetry/pool-distribution`).
//    - `LiveActivityFeed`: Subscribes to live WebSocket telemetry stream (`ws://localhost:8000/api/v1/telemetry/events/stream`).
// ============================================================================

export const OverviewTab: React.FC = () => {
  return (
    <div className="space-y-6 pb-6">
      {/* 4 Top KPI Cards */}
      <MetricCardsGrid />

      {/* 5-Model Antigravity Quota Matrix */}
      <ModelQuotaMatrix />

      {/* Split Row: 70% Usage Timeline + 30% Pool Donut */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UsageTimelineChart />
        </div>
        <div className="lg:col-span-1">
          <PoolDonutChart />
        </div>
      </div>

      {/* Live Telemetry Ticker */}
      <LiveActivityFeed />
    </div>
  );
};
