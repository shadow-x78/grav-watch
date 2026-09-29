// ─────────────────────────────────────────────
// GravWatch - Dashboard Main Page
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useGravWatch, useUI } from "@/context";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { OverviewTab } from "@/components/overview/OverviewTab";
import { AccountsTab } from "@/components/accounts/AccountsTab";
import { GooglePairingModal } from "@/components/accounts/GooglePairingModal";

const LoadingSkeleton = () => {
  return (
    <div className="w-full px-4 py-4 sm:px-6 sm:py-5 space-y-5">
      {/* Header skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl border border-white/10 bg-[#0b0f1d] p-4 animate-pulse"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-11 rounded-lg bg-white/5" />
            <div className="h-6 w-24 bg-white/5 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-32 bg-white/5 rounded-lg" />
            <div className="h-9 w-9 bg-white/5 rounded-lg" />
            <div className="h-9 w-24 bg-white/5 rounded-lg" />
          </div>
        </div>
      </motion.div>

      {/* Metric cards skeleton (3 cards) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full"
      >
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="rounded-xl border border-white/10 bg-[#0b0f1d] p-5 animate-pulse"
          >
            <div className="flex items-start justify-between mb-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#060911]" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1 h-4 w-2/3 bg-white/5 rounded" />
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black tracking-tight text-white leading-none h-8 w-1/2 bg-white/5 rounded" />
                  <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 h-4 w-1/3 bg-white/5 rounded" />
                </div>
                <div className="h-12 w-12 bg-white/5 rounded-full" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Model Quota Matrix skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-xl border border-white/10 bg-[#0b0f1d] overflow-hidden animate-pulse"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x rtl:lg:divide-x-reverse divide-white/[0.06]">
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between mb-1 h-8 w-1/3 bg-white/5 rounded" />
            <div className="h-12 w-full bg-white/5 rounded" />
            <div className="h-12 w-full bg-white/5 rounded" />
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between mb-1 h-8 w-1/3 bg-white/5 rounded" />
            <div className="h-12 w-full bg-white/5 rounded" />
            <div className="h-12 w-full bg-white/5 rounded" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function DashboardPage() {
  const { activeTab } = useUI();
  const { isLoading, accounts } = useGravWatch();
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] h-[100dvh] w-full flex-col bg-[#060911] text-slate-100 overflow-hidden justify-between">
        <Header />
        <main className="flex-1 overflow-y-auto w-full min-w-0 px-4 py-4 sm:px-6 sm:py-5">
          <LoadingSkeleton />
        </main>
        <Footer />
        <GooglePairingModal
          isOpen={isGoogleModalOpen}
          onClose={() => setIsGoogleModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] h-[100dvh] w-full flex-col bg-[#060911] text-slate-100 overflow-hidden justify-between">
      <Header />

      <main className="flex-1 overflow-y-auto w-full min-w-0 px-4 py-4 sm:px-6 sm:py-5">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "accounts" && <AccountsTab onOpenGooglePairing={() => setIsGoogleModalOpen(true)} />}
      </main>

      <Footer />

      <GooglePairingModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
      />
    </div>
  );
}