"use client";

import React, { useState } from "react";
import { GravAccount } from "@/types/gravwatch";
import { useGravWatch } from "@/context/GravWatchContext";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import { ProgressRing } from "@/components/ui/progress-ring";
import RefreshIcon from "@mui/icons-material/Refresh";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DnsIcon from "@mui/icons-material/Dns";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

interface AccountListItemCardProps {
  account: GravAccount;
  onEdit: (account: GravAccount) => void;
  onDelete: (account: GravAccount) => void;
}

// ============================================================================
// TODO: [BACKEND INTEGRATION] - Account List Card View (Compact Cards Alternative)
//
// 1. Account Metrics Display:
//    - Real Docker container memory & CPU percentage streamed from Docker daemon socket.
//    - Twin Quotas: 5-hour rolling limit and weekly quota percentages for Gemini & Claude tiers.
//    - AI Credits Balance: Available financial credit balance in USD for model overages.
//
// 2. Action Endpoints:
//    - `POST   /api/v1/accounts/{id}/sync`          -> Instantly re-scrapes quotas for this account node.
//    - `POST   /api/v1/accounts/{id}/toggle-status` -> Pauses / unpauses container (`docker pause / unpause`).
//    - `PATCH  /api/v1/accounts/{id}`               -> Opens edit dialog and persists modifications to DB.
//    - `DELETE /api/v1/accounts/{id}`               -> Destroys sandbox container and removes account.
// ============================================================================

export const AccountListItemCard: React.FC<AccountListItemCardProps> = ({
  account,
  onEdit,
  onDelete,
}) => {
  const { toggleAccountStatus, refreshAccount } = useGravWatch();
  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefresh = () => {
    setIsSpinning(true);
    refreshAccount(account.id);
    setTimeout(() => setIsSpinning(false), 700);
  };

  const getPlanBadgeColor = (plan: string) => {
    if (plan.toLowerCase().includes("ultra")) {
      return {
        bg: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
        color: "#ffffff",
      };
    }
    if (plan.toLowerCase().includes("pro")) {
      return {
        bg: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
        color: "#ffffff",
      };
    }
    return {
      bg: "rgba(148, 163, 184, 0.2)",
      color: "#94a3b8",
    };
  };

  const planStyle = getPlanBadgeColor(account.plan);

  return (
    <Card
      sx={{
        border: "1px solid rgba(255, 255, 255, 0.08)",
        background: "rgba(13, 19, 34, 0.75)",
        backdropFilter: "blur(16px)",
        borderRadius: 3,
        transition: "border-color 0.2s ease, transform 0.2s ease",
        "&:hover": {
          borderColor: "rgba(16, 185, 129, 0.35)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.25 }, "&:last-child": { pb: { xs: 2, md: 2.25 } } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            alignItems: { xs: "stretch", lg: "center" },
            justifyContent: "space-between",
            gap: 2.5,
          }}
        >
          {/* Account Identity & Plan (Image 2 style) */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, minWidth: { lg: 280 }, flex: { lg: "0 0 280px" } }}>
            <Avatar
              src={account.avatarUrl}
              alt={account.alias}
              sx={{
                width: 44,
                height: 44,
                border: "1.5px solid rgba(255, 255, 255, 0.15)",
                flexShrink: 0,
              }}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#ffffff", fontSize: "0.92rem" }} noWrap>
                  {account.alias}
                </Typography>
                <Chip
                  label={account.plan}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    background: planStyle.bg,
                    color: planStyle.color,
                    border: "none",
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontFamily: "monospace",
                  display: "block",
                  fontSize: "0.75rem",
                  mt: 0.2,
                }}
                noWrap
              >
                {account.email}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                <Typography variant="caption" sx={{ fontFamily: "monospace", color: "primary.main", fontSize: "0.68rem" }}>
                  {account.containerName}
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary", fontSize: "0.68rem" }}>
                  • {account.ramUsageMb}MB RAM
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Antigravity Quotas Section (Gemini & Claude/GPT Compact Cards) */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1.5,
              flex: 1,
            }}
          >
            {/* Gemini Models Antigravity Compact Box */}
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                p: 1.5,
                border: "1px solid rgba(255, 255, 255, 0.08)",
                backgroundColor: "rgba(18, 22, 34, 0.75)",
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#ffffff", fontSize: "0.75rem" }}>
                    Gemini Models
                  </Typography>
                  <Tooltip title="Flash & Pro Quota">
                    <InfoOutlinedIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                  </Tooltip>
                </Box>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem", fontFamily: "monospace" }}>
                  Refreshes {account.geminiQuota.fiveHour.refreshCountdown}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-around", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ProgressRing value={account.geminiQuota.fiveHour.percentRemaining} size={26} thickness={3.5} />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "#ffffff", display: "block", lineHeight: 1 }}>
                      {account.geminiQuota.fiveHour.percentRemaining}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.62rem" }}>
                      5-Hour
                    </Typography>
                  </Box>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255, 255, 255, 0.06)" }} />

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ProgressRing value={account.geminiQuota.weekly.percentRemaining} size={26} thickness={3.5} />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "#ffffff", display: "block", lineHeight: 1 }}>
                      {account.geminiQuota.weekly.percentRemaining}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.62rem" }}>
                      Weekly
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* Claude and GPT Models Antigravity Compact Box */}
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                p: 1.5,
                border: "1px solid rgba(255, 255, 255, 0.08)",
                backgroundColor: "rgba(18, 22, 34, 0.75)",
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#ffffff", fontSize: "0.75rem" }}>
                    Claude and GPT models
                  </Typography>
                  <Tooltip title="Sonnet & Opus 4.6 Quota">
                    <InfoOutlinedIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                  </Tooltip>
                </Box>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem", fontFamily: "monospace" }}>
                  Refreshes {account.claudeGptQuota.fiveHour.refreshCountdown}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-around", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ProgressRing value={account.claudeGptQuota.fiveHour.percentRemaining} size={26} thickness={3.5} />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "#ffffff", display: "block", lineHeight: 1 }}>
                      {account.claudeGptQuota.fiveHour.percentRemaining}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.62rem" }}>
                      5-Hour
                    </Typography>
                  </Box>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255, 255, 255, 0.06)" }} />

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ProgressRing value={account.claudeGptQuota.weekly.percentRemaining} size={26} thickness={3.5} />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "#ffffff", display: "block", lineHeight: 1 }}>
                      {account.claudeGptQuota.weekly.percentRemaining}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.62rem" }}>
                      Weekly
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>

          {/* Status & Actions Section */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: { xs: "space-between", lg: "flex-end" },
              gap: 1.5,
              flexShrink: 0,
            }}
          >
            <Chip
              label={account.status}
              size="small"
              color={
                account.status === "active"
                  ? "success"
                  : account.status === "warning"
                  ? "warning"
                  : account.status === "depleted"
                  ? "error"
                  : "default"
              }
              sx={{ height: 22, fontSize: "0.68rem", fontWeight: 800, textTransform: "capitalize" }}
            />

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Tooltip title="Scrape & Refresh Quota">
                <IconButton size="small" onClick={handleRefresh} sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}>
                  <RefreshIcon sx={{ fontSize: 16, animation: isSpinning ? "spin 1s linear infinite" : "none" }} />
                </IconButton>
              </Tooltip>

              <Tooltip title={account.status === "paused" ? "Resume Sandbox" : "Pause Sandbox"}>
                <IconButton
                  size="small"
                  onClick={() => toggleAccountStatus(account.id)}
                  sx={{
                    color: "text.secondary",
                    "&:hover": { color: account.status === "paused" ? "success.main" : "warning.main" },
                  }}
                >
                  <PowerSettingsNewIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Edit Node Settings">
                <IconButton size="small" onClick={() => onEdit(account)} sx={{ color: "text.secondary", "&:hover": { color: "secondary.main" } }}>
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete Node">
                <IconButton size="small" onClick={() => onDelete(account)} sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}>
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
