"use client";

import React, { useState } from "react";
import { useGravWatch } from "@/context/GravWatchContext";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Paper from "@mui/material/Paper";
import { ProgressRing } from "@/components/ui/progress-ring";
import RefreshIcon from "@mui/icons-material/Refresh";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

// ============================================================================
// TODO: [BACKEND INTEGRATION] - Models & Quota Matrix (Twin-Tier Telemetry)
//
// 1. Client-Side State & Fallback Values:
//    - `displayPlan`: Current account plan (Google AI Pro / Ultra / Enterprise) or "Pooled Cluster".
//    - `displayOverages`: Boolean toggle state for "Use AI Credits after limit reached".
//    - `geminiWeeklyPct` / `gemini5hPct`: Twin-tier quota levels for Gemini models (Flash 3.6 / Pro 3.1).
//    - `claudeWeeklyPct` / `claude5hPct`: Twin-tier quota levels for Claude & GPT models (Sonnet 4.6 / Opus 4.6).
//    - `refreshCountdown`: Formatted countdown strings for 5-hour rolling window and weekly resets.
//
// 2. Required Backend Endpoints & Mutations:
//    - `GET   /api/v1/accounts/{id}/quota`             -> Fetches precise rolling quota limits from container SQLite cache.
//    - `PATCH /api/v1/accounts/{id}/credits-overage`   -> Toggles AI credit fallback on 429 exhaustion (`{ enable: boolean }`).
//    - `POST  /api/v1/billing/checkout-session`        -> Creates Stripe / Google Cloud billing checkout session for plan upgrade.
//    - `WS    /api/v1/accounts/{id}/quota-stream`      -> Subscribes to live quota deductions and push reset events.
//
// 3. Purpose / Why Needed:
//    - Accurately mirrors Antigravity IDE native quota behavior and provides reset countdowns to prevent agent starvation.
// ============================================================================

export const ModelQuotaMatrix: React.FC = () => {
  const { accounts, selectedAccountId, refreshAllAccounts, pooledTelemetry } = useGravWatch();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [overagesEnabled, setOveragesEnabled] = useState(false);

  const selectedAccount =
    selectedAccountId === "all"
      ? null
      : accounts.find((a) => a.id === selectedAccountId);

  const displayPlan = selectedAccount ? selectedAccount.plan : "Google AI Pro (Pooled Cluster)";
  const displayOverages = selectedAccount ? selectedAccount.enableAiCredits : overagesEnabled;

  const geminiWeeklyPct = selectedAccount
    ? selectedAccount.geminiQuota.weekly.percentRemaining
    : pooledTelemetry.geminiWeeklyPooledPercent;

  const geminiWeeklyCountdown = selectedAccount
    ? selectedAccount.geminiQuota.weekly.refreshCountdown
    : "3 days, 20 hours";

  const gemini5hPct = selectedAccount
    ? selectedAccount.geminiQuota.fiveHour.percentRemaining
    : pooledTelemetry.geminiFiveHourPooledPercent;

  const gemini5hCountdown = selectedAccount
    ? selectedAccount.geminiQuota.fiveHour.refreshCountdown
    : "3 hours, 57 minutes";

  const claudeWeeklyPct = selectedAccount
    ? selectedAccount.claudeGptQuota.weekly.percentRemaining
    : pooledTelemetry.claudeGptWeeklyPooledPercent;

  const claudeWeeklyCountdown = selectedAccount
    ? selectedAccount.claudeGptQuota.weekly.refreshCountdown
    : "6 days, 21 hours";

  const claude5hPct = selectedAccount
    ? selectedAccount.claudeGptQuota.fiveHour.percentRemaining
    : pooledTelemetry.claudeGptFiveHourPooledPercent;

  const claude5hCountdown = selectedAccount
    ? selectedAccount.claudeGptQuota.fiveHour.refreshCountdown
    : "2 hours, 14 minutes";

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    refreshAllAccounts();
    setTimeout(() => setIsRefreshing(false), 700);
  };

  return (
    <Card
      sx={{
        border: "1px solid rgba(255, 255, 255, 0.08)",
        background: "rgba(13, 19, 34, 0.75)",
        backdropFilter: "blur(20px)",
        borderRadius: 3.5,
      }}
    >
      {/* Header matching Antigravity IDE Settings */}
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#ffffff" }}>
              Models & Usage
            </Typography>
            <Tooltip title="Refresh Quota Telemetry">
              <IconButton
                size="small"
                onClick={handleManualRefresh}
                sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}
              >
                <RefreshIcon
                  sx={{
                    fontSize: 18,
                    animation: isRefreshing ? "spin 1s linear infinite" : "none",
                  }}
                />
              </IconButton>
            </Tooltip>
          </Box>
        }
        subheader={
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {selectedAccount
              ? `Managing quota & credits for ${selectedAccount.alias} (${selectedAccount.email})`
              : "Manage your pooled multi-account model quota and credits across all Docker sandboxes."}
          </Typography>
        }
        action={
          <Chip
            label={selectedAccount ? selectedAccount.containerName : "Multi-Account Pool"}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontFamily: "monospace", fontSize: "0.75rem", mt: 1 }}
          />
        }
        sx={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)", pb: 2 }}
      />

      <CardContent sx={{ p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Plan Section */}
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              textTransform: "uppercase",
              color: "text.secondary",
              letterSpacing: "0.05em",
              mb: 1,
              display: "block",
            }}
          >
            Plan
          </Typography>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.75, sm: 2.5 },
              border: "1px solid rgba(255, 255, 255, 0.06)",
              backgroundColor: "rgba(9, 13, 22, 0.6)",
              borderRadius: 2.5,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: "#ffffff", fontSize: { xs: "0.85rem", sm: "0.95rem" } }}
                >
                  Your Plan: {displayPlan}
                </Typography>
                <Chip
                  label="ACTIVE"
                  size="small"
                  color="success"
                  sx={{ height: 20, fontSize: "0.65rem", fontWeight: 800 }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", mt: 0.5, display: "block", fontSize: { xs: "0.72rem", sm: "0.78rem" } }}
              >
                You can upgrade to a Google AI Ultra plan to receive higher rate limits.
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="small"
              sx={{
                background: "#2563eb",
                "&:hover": { background: "#1d4ed8" },
                px: 2.5,
                py: 0.8,
                fontSize: "0.8rem",
                alignSelf: { xs: "stretch", sm: "auto" },
              }}
            >
              Upgrade
            </Button>
          </Paper>
        </Box>

        {/* Model Credits Section */}
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              textTransform: "uppercase",
              color: "text.secondary",
              letterSpacing: "0.05em",
              mb: 1,
              display: "block",
            }}
          >
            Model Credits
          </Typography>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.75, sm: 2.5 },
              border: "1px solid rgba(255, 255, 255, 0.06)",
              backgroundColor: "rgba(9, 13, 22, 0.6)",
              borderRadius: 2.5,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "flex-start" },
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: "#ffffff", fontSize: { xs: "0.85rem", sm: "0.95rem" } }}
              >
                Enable AI Credit Overages
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  mt: 0.5,
                  display: "block",
                  lineHeight: 1.5,
                  fontSize: { xs: "0.72rem", sm: "0.78rem" },
                }}
              >
                When toggled on, Antigravity IDE will use your AI credits to fulfill model requests once you're out of model quota. Antigravity IDE will always use your model quota first before using AI credits.
              </Typography>
            </Box>

            <Switch
              checked={displayOverages}
              onChange={(e) => setOveragesEnabled(e.target.checked)}
              color="primary"
            />
          </Paper>
        </Box>

        {/* Gemini Models Section (Antigravity Exact Card Style) */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.85rem" }}>
              Gemini Models
            </Typography>
            <Tooltip title="Flash and Pro models share this quota pool">
              <InfoOutlinedIcon sx={{ fontSize: 15, color: "text.secondary", cursor: "pointer" }} />
            </Tooltip>
          </Box>

          <Paper
            elevation={0}
            sx={{
              border: "1px solid rgba(255, 255, 255, 0.08)",
              backgroundColor: "rgba(18, 22, 34, 0.75)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            {/* Gemini Weekly Row */}
            <Box
              sx={{
                p: { xs: 2, sm: 2.25 },
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#ffffff", fontSize: { xs: "0.85rem", sm: "0.9rem" } }}
                >
                  Weekly Limit Remaining
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: { xs: "0.72rem", sm: "0.78rem" },
                    display: "block",
                    mt: 0.3,
                  }}
                >
                  {geminiWeeklyPct < 100
                    ? `You have used some of your weekly limit, it will fully refresh in ${geminiWeeklyCountdown}.`
                    : "You have full weekly limit capacity available."}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 }, flexShrink: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: "#ffffff",
                    fontSize: { xs: "0.85rem", sm: "0.95rem" },
                  }}
                >
                  {geminiWeeklyPct}%
                </Typography>
                <ProgressRing value={geminiWeeklyPct} size={30} thickness={3.5} />
              </Box>
            </Box>

            <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.06)" }} />

            {/* Gemini 5-Hour Row */}
            <Box
              sx={{
                p: { xs: 2, sm: 2.25 },
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#ffffff", fontSize: { xs: "0.85rem", sm: "0.9rem" } }}
                >
                  Five Hour Limit Remaining
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: { xs: "0.72rem", sm: "0.78rem" },
                    display: "block",
                    mt: 0.3,
                  }}
                >
                  {gemini5hPct < 100
                    ? `You have used some of your 5-hour limit, it will fully refresh in ${gemini5hCountdown}.`
                    : "You have full 5-hour limit capacity available."}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 }, flexShrink: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: "#ffffff",
                    fontSize: { xs: "0.85rem", sm: "0.95rem" },
                  }}
                >
                  {gemini5hPct}%
                </Typography>
                <ProgressRing value={gemini5hPct} size={30} thickness={3.5} />
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Claude and GPT Models Section (Antigravity Exact Card Style) */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.85rem" }}>
              Claude and GPT models
            </Typography>
            <Tooltip title="Sonnet 4.6, Opus 4.6, and GPT-OSS share this quota pool">
              <InfoOutlinedIcon sx={{ fontSize: 15, color: "text.secondary", cursor: "pointer" }} />
            </Tooltip>
          </Box>

          <Paper
            elevation={0}
            sx={{
              border: "1px solid rgba(255, 255, 255, 0.08)",
              backgroundColor: "rgba(18, 22, 34, 0.75)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            {/* Claude Weekly Row */}
            <Box
              sx={{
                p: { xs: 2, sm: 2.25 },
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#ffffff", fontSize: { xs: "0.85rem", sm: "0.9rem" } }}
                >
                  Weekly Limit Remaining
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: { xs: "0.72rem", sm: "0.78rem" },
                    display: "block",
                    mt: 0.3,
                  }}
                >
                  {claudeWeeklyPct < 100
                    ? `You have used some of your weekly limit, it will fully refresh in ${claudeWeeklyCountdown}.`
                    : "You have full weekly limit capacity available."}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 }, flexShrink: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: "#ffffff",
                    fontSize: { xs: "0.85rem", sm: "0.95rem" },
                  }}
                >
                  {claudeWeeklyPct}%
                </Typography>
                <ProgressRing value={claudeWeeklyPct} size={30} thickness={3.5} />
              </Box>
            </Box>

            <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.06)" }} />

            {/* Claude 5-Hour Row */}
            <Box
              sx={{
                p: { xs: 2, sm: 2.25 },
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#ffffff", fontSize: { xs: "0.85rem", sm: "0.9rem" } }}
                >
                  Five Hour Limit Remaining
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: { xs: "0.72rem", sm: "0.78rem" },
                    display: "block",
                    mt: 0.3,
                  }}
                >
                  {claude5hPct < 100
                    ? `You have used some of your 5-hour limit, it will fully refresh in ${claude5hCountdown}.`
                    : "You have full 5-hour limit capacity available."}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 }, flexShrink: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: "#ffffff",
                    fontSize: { xs: "0.85rem", sm: "0.95rem" },
                  }}
                >
                  {claude5hPct}%
                </Typography>
                <ProgressRing value={claude5hPct} size={30} thickness={3.5} />
              </Box>
            </Box>
          </Paper>
        </Box>
      </CardContent>
    </Card>
  );
};

