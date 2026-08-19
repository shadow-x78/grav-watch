"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Drawer from "@mui/material/Drawer";
import GridViewIcon from "@mui/icons-material/GridView";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import DnsIcon from "@mui/icons-material/Dns";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useGravWatch } from "@/context/GravWatchContext";
import { TabView } from "@/types/gravwatch";
import { SystemIssuesModal } from "@/components/diagnostics/SystemIssuesModal";
import { useLanguage } from "@/context/LanguageContext";

interface SidebarProps {
  activeTab?: TabView;
  onTabChange?: (tab: TabView) => void;
  onCloseMobile?: () => void;
  isMobileOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab: propActiveTab,
  onTabChange: propOnTabChange,
  onCloseMobile,
  isMobileOpen = false,
}) => {
  const { accounts, activeTab: contextActiveTab, setActiveTab } = useGravWatch();
  const { t, direction } = useLanguage();
  const [isIssuesModalOpen, setIsIssuesModalOpen] = useState(false);

  const currentTab = propActiveTab || contextActiveTab;
  const handleTabChange = (tab: TabView) => {
    if (propOnTabChange) {
      propOnTabChange(tab);
    } else {
      setActiveTab(tab);
    }
    if (onCloseMobile) onCloseMobile();
  };

  const navItems = [
    {
      id: "overview" as const,
      label: t("layout.sidebar.navOverview"),
      icon: GridViewIcon,
    },
    {
      id: "accounts" as const,
      label: t("layout.sidebar.navAccounts"),
      icon: PeopleAltOutlinedIcon,
      badge: `${accounts.length}`,
    },
  ];

  const activeSandboxesCount = accounts.filter((a) => a.status !== "paused").length;
  const totalSandboxesCount = accounts.length;

  const warningCount = accounts.filter(
    (a) => a.status === "depleted" || a.status === "warning"
  ).length;

  const sidebarContent = (
    <Box
      sx={{
        width: 250,
        minWidth: 250,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        p: 2.5,
        backgroundColor: "#070b14",
        borderRight: direction === "rtl" ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
        borderLeft: direction === "rtl" ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
        flexShrink: 0,
        overflowY: "auto",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      <Box>
        <Typography
          variant="caption"
          sx={{
            color: "#64748b",
            fontSize: "0.65rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            display: "block",
            mb: 2,
            px: 0.5,
          }}
        >
          {t("layout.sidebar.navTitle")}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <Box
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleTabChange(item.id)}
                sx={{
                  cursor: "pointer",
                  borderRadius: 2.5,
                  p: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: isActive ? "rgba(16, 185, 129, 0.08)" : "transparent",
                  border: "1px solid",
                  borderColor: isActive ? "rgba(16, 185, 129, 0.45)" : "transparent",
                  color: isActive ? "#10b981" : "#94a3b8",
                  boxShadow: "none",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: isActive ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.03)",
                    color: isActive ? "#10b981" : "#ffffff",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Icon sx={{ fontSize: 20, color: isActive ? "#10b981" : "#64748b" }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isActive ? 700 : 500,
                      fontSize: "0.82rem",
                      whiteSpace: "pre-line",
                      lineHeight: 1.25,
                      color: "inherit",
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>

                {item.badge && (
                  <Box
                    sx={{
                      px: 1,
                      py: 0.2,
                      borderRadius: 10,
                      backgroundColor: isActive ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.06)",
                      border: "1px solid",
                      borderColor: isActive ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.1)",
                      color: isActive ? "#10b981" : "#94a3b8",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      fontFamily: "monospace",
                    }}
                  >
                    {item.badge}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>

        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 1.5,
            backgroundColor: "#0b101c",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <DnsIcon sx={{ fontSize: 16, color: "#10b981" }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#ffffff", fontSize: "0.78rem" }}>
                {t("layout.sidebar.dockerCard.title")}
              </Typography>
            </Box>

            <Chip
              label={`${activeSandboxesCount} / ${totalSandboxesCount}`}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.68rem",
                fontWeight: 800,
                fontFamily: "monospace",
                color: "#10b981",
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: 1,
              }}
            />
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, fontSize: "0.7rem", fontFamily: "monospace" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>{t("layout.sidebar.dockerCard.image")}</span>
              <span style={{ color: "#cbd5e1" }}>debian:bookworm</span>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>{t("layout.sidebar.dockerCard.memoryCap")}</span>
              <span style={{ color: "#cbd5e1" }}>{t("layout.sidebar.dockerCard.memoryValue")}</span>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>{t("layout.sidebar.dockerCard.fastApiHub")}</span>
              <span style={{ color: "#10b981", fontWeight: 700 }}>{t("layout.sidebar.dockerCard.fastApiLive")}</span>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)", mx: -2.5, mb: 0.5 }} />

        <Typography
          variant="caption"
          sx={{
            color: "#64748b",
            fontSize: "0.68rem",
            lineHeight: 1.35,
            display: "block",
            px: 0.5,
          }}
        >
          {t("layout.sidebar.subtitle")}
        </Typography>

        <Tooltip title={t("layout.sidebar.issuesTooltip")} arrow>
          <Box
            id="sidebar-issues-button"
            onClick={() => setIsIssuesModalOpen(true)}
            sx={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 1.5,
              py: 0.8,
              borderRadius: 2,
              backgroundColor: warningCount > 0 ? "rgba(244, 63, 94, 0.14)" : "rgba(16, 185, 129, 0.1)",
              border: "1px solid",
              borderColor: warningCount > 0 ? "rgba(244, 63, 94, 0.35)" : "rgba(16, 185, 129, 0.25)",
              color: warningCount > 0 ? "#fb7185" : "#10b981",
              fontSize: "0.72rem",
              fontWeight: 700,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: warningCount > 0 ? "rgba(244, 63, 94, 0.22)" : "rgba(16, 185, 129, 0.18)",
                borderColor: warningCount > 0 ? "#f43f5e" : "#10b981",
                transform: "translateY(-1px)",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: 1,
                  backgroundColor: warningCount > 0 ? "#f43f5e" : "#10b981",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.65rem",
                  fontWeight: 800,
                }}
              >
                {warningCount > 0 ? "!" : "✓"}
              </Box>
              <span>{warningCount > 0 ? t("layout.sidebar.issuesDetected", { count: warningCount }) : t("layout.sidebar.allHealthy")}</span>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 0.4,
                borderRadius: 1,
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                color: warningCount > 0 ? "#fda4af" : "#86efac",
              }}
            >
              <OpenInNewIcon sx={{ fontSize: 13, transform: direction === "rtl" ? "scaleX(-1)" : "none" }} />
            </Box>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <>
      <Box
        sx={{
          display: { xs: "none", lg: "flex" },
          flexDirection: "column",
          width: 250,
          minWidth: 250,
          height: "100%",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {sidebarContent}
      </Box>

      <Drawer
        anchor={direction === "rtl" ? "right" : "left"}
        open={isMobileOpen}
        onClose={onCloseMobile}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": {
            width: 250,
            backgroundColor: "#070b14",
            backgroundImage: "none",
            borderRight: direction === "rtl" ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
            borderLeft: direction === "rtl" ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
            boxSizing: "border-box",
          },
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
          },
        }}
      >
        <Box sx={{ pt: { xs: "60px", sm: "68px" }, height: "100%" }}>
          {sidebarContent}
        </Box>
      </Drawer>

      <SystemIssuesModal
        isOpen={isIssuesModalOpen}
        onClose={() => setIsIssuesModalOpen(false)}
      />
    </>
  );
};
