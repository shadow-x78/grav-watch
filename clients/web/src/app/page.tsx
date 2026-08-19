"use client";

import React, { useState } from "react";
import { useGravWatch } from "@/context/GravWatchContext";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { OverviewTab } from "@/components/overview/OverviewTab";
import { AccountsTab } from "@/components/accounts/AccountsTab";
import { PromptSimulator } from "@/components/simulator/PromptSimulator";
import { GooglePairingModal } from "@/components/accounts/GooglePairingModal";
import { AddManualAccountModal } from "@/components/accounts/AddManualAccountModal";

export default function DashboardPage() {
  const { activeTab, setActiveTab } = useGravWatch();
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] h-[100dvh] w-full max-w-[100vw] flex-col bg-dark-950 bg-grid-pattern text-slate-100 overflow-hidden">
      <Header
        onOpenGooglePairing={() => setIsGoogleModalOpen(true)}
        onOpenManualAdd={() => setIsManualModalOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      <div className="flex flex-1 flex-col lg:flex-row h-[calc(100dvh-60px)] sm:h-[calc(100dvh-68px)] w-full max-w-[100vw] overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 p-4 pb-28 sm:p-6 sm:pb-20 lg:p-8 lg:pb-16 overflow-y-auto w-full min-w-0 h-full">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "accounts" && <AccountsTab />}
          {activeTab === "simulator" && <PromptSimulator />}
        </main>
      </div>

      <GooglePairingModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
      />

      <AddManualAccountModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
      />
    </div>
  );
}
