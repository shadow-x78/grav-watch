"use client";

import React, { useState } from "react";
import { useGravWatch } from "@/context/GravWatchContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { OverviewTab } from "@/components/overview/OverviewTab";
import { AccountsTab } from "@/components/accounts/AccountsTab";
import { GooglePairingModal } from "@/components/accounts/GooglePairingModal";

export default function DashboardPage() {
  const { activeTab } = useGravWatch();
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] h-[100dvh] w-full flex-col bg-[#060911] text-slate-100 overflow-hidden justify-between">
      <Header
        onOpenGooglePairing={() => setIsGoogleModalOpen(true)}
      />

      <main className="flex-1 overflow-y-auto w-full min-w-0 px-4 py-4 sm:px-6 sm:py-5">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "accounts" && <AccountsTab />}
      </main>

      <Footer />

      <GooglePairingModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
      />
    </div>
  );
}
