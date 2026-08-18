"use client";

import React, { useState } from "react";
import { useGravWatch } from "@/context/GravWatchContext";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { OverviewTab } from "@/components/overview/OverviewTab";
import { AccountsTab } from "@/components/accounts/AccountsTab";
import { PromptSimulator } from "@/components/simulator/PromptSimulator";
import { AgyIntegrationTab } from "@/components/agy/AgyIntegrationTab";
import { GooglePairingModal } from "@/components/accounts/GooglePairingModal";
import { AddManualAccountModal } from "@/components/accounts/AddManualAccountModal";

// ============================================================================
// TODO: [BACKEND INTEGRATION] - GravWatch Main Telemetry Shell & Routing
//
// 1. Core Views & Dynamic Tabs:
//    - `OverviewTab`: Telemetry KPIs, Twin Quota Matrices, Usage Timelines, and Live Activity Streams.
//    - `AccountsTab`: Full CRUD management of Docker container sandboxes (`GET /api/v1/accounts`).
//    - `PromptSimulator`: Interactive load balancer simulator invoking `agy` inside containers (`POST /api/v1/router/execute`).
//    - `AgyIntegrationTab`: Developer setup guides, CLI configs, and dynamic `docker-compose.yml` generation.
//
// 2. Modals:
//    - `GooglePairingModal`: Interactive OAuth onboarding daemon (`setup-auth.sh`).
//    - `AddManualAccountModal`: Manual bearer token container provisioning.
//
// 3. TODO - URL Query Param State Sync:
//    - Sync `activeTab` with `?tab=overview|accounts|simulator|integration` URL param.
//    - Sync selected account in AccountsTab with `?account={id}` for direct deep-links.
//    - On mount: read `useSearchParams()` to initialize state from URL (enables shareable dashboard URLs).
//
// 4. TODO - SSR / Server-Side Prefetch:
//    - Convert to a Server Component shell with `generateMetadata()` for proper OG tags per tab.
//    - Prefetch initial `GET /api/v1/accounts` and `GET /api/v1/usage/latest` on server to avoid client-only loading flash.
//
// 5. Edge Cases:
//    - [ ] Browser Back/Forward: Keep tab navigation history-aware using `router.push()` instead of state-only switching.
//    - [ ] Session Expiry: If WebSocket drops and re-auth fails, display a full-screen reconnect banner over the dashboard.
// ============================================================================

export default function DashboardPage() {
  const { activeTab, setActiveTab } = useGravWatch();
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] h-[100dvh] w-full max-w-[100vw] flex-col bg-dark-950 bg-grid-pattern text-slate-100 overflow-hidden">
      {/* Top Header */}
      <Header
        onOpenGooglePairing={() => setIsGoogleModalOpen(true)}
        onOpenManualAdd={() => setIsManualModalOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      {/* Main Container */}
      <div className="flex flex-1 flex-col lg:flex-row h-[calc(100dvh-60px)] sm:h-[calc(100dvh-68px)] w-full max-w-[100vw] overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic Content Area */}
        <main className="flex-1 p-4 pb-28 sm:p-6 sm:pb-20 lg:p-8 lg:pb-16 overflow-y-auto w-full min-w-0 h-full">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "accounts" && <AccountsTab />}
          {activeTab === "simulator" && <PromptSimulator />}
          {activeTab === "integration" && <AgyIntegrationTab />}
        </main>
      </div>

      {/* Global Modals */}
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
