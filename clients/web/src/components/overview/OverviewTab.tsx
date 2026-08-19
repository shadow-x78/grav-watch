"use client";

import React from "react";
import { MetricCardsGrid } from "./MetricCardsGrid";
import { ModelQuotaMatrix } from "./ModelQuotaMatrix";
import { UsageTimelineChart } from "./UsageTimelineChart";
import { PoolDonutChart } from "./PoolDonutChart";
import { LiveActivityFeed } from "./LiveActivityFeed";

export const OverviewTab: React.FC = () => {
  return (
    <div className="space-y-6 pb-6">
      <MetricCardsGrid />

      <ModelQuotaMatrix />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UsageTimelineChart />
        </div>
        <div className="lg:col-span-1">
          <PoolDonutChart />
        </div>
      </div>

      <LiveActivityFeed />
    </div>
  );
};
