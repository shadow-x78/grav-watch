"use client";

import React from "react";
import { motion } from "framer-motion";
import { MetricCardsGrid } from "./MetricCardsGrid";
import { ModelQuotaMatrix } from "./ModelQuotaMatrix";
import { ClusterNodesSummary } from "./ClusterNodesSummary";

export const OverviewTab: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-5 w-full pb-4"
    >
      <MetricCardsGrid />
      <ModelQuotaMatrix />
      <ClusterNodesSummary />
    </motion.div>
  );
};
