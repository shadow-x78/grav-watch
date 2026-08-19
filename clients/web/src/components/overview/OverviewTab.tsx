"use client";

import React from "react";
import { MetricCardsGrid } from "./MetricCardsGrid";
import { ModelQuotaMatrix } from "./ModelQuotaMatrix";
import { PoolDonutChart } from "./PoolDonutChart";

export const OverviewTab: React.FC = () => {
  return (
    <div className="space-y-6 pb-6">
      <MetricCardsGrid />

      <ModelQuotaMatrix />

      <div>
        <PoolDonutChart />
      </div>
    </div>
  );
};
