// ─────────────────────────────────────────────
// GravWatch - UI State Context Provider
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

"use client";

import React, { createContext, useContext, useState } from "react";
import { TabView } from "@/types/gravwatch";

interface UIContextType {
  selectedAccountId: string;
  activeTab: TabView;
  setSelectedAccountId: (id: string) => void;
  setActiveTab: (tab: TabView) => void;
  toggleAccountStatus: (id: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<TabView>("overview");

  const toggleAccountStatus = async (id: string) => {
    try {
      await fetch(`/api/v1/auth/container/toggle?account_id=${encodeURIComponent(id)}`, {
        method: "POST",
      });
    } catch (err) {
      console.warn("Failed to toggle container on server:", err);
    }
  };

  return (
    <UIContext.Provider
      value={{
        selectedAccountId,
        activeTab,
        setSelectedAccountId,
        setActiveTab,
        toggleAccountStatus,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
};