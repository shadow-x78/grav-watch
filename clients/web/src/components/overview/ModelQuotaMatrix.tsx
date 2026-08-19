"use client";

import React, { useState } from "react";
import { useGravWatch } from "@/context/GravWatchContext";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Paper from "@mui/material/Paper";
import { ProgressRing } from "@/components/ui/progress-ring";
import RefreshIcon from "@mui/icons-material/Refresh";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export const ModelQuotaMatrix: React.FC = () => {
  const { accounts, selectedAccountId, refreshAllAccounts, pooledTelemetry } = useGravWatch();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedAccount =
    selectedAccountId === "all"
      ? null
      : accounts.find((a) => a.id === selectedAccountId);

  const displayPlan = selectedAccount ? selectedAccount.plan : "Google AI Pro (Pooled Cluster)";

  const geminiWeeklyPct = selectedAccount
    ? selectedAccount.geminiQuota.weekly.percentRemaining
    : pooledTelemetry.geminiWeeklyPooledPercent;

  const geminiWeeklyCountdown = selectedAccount
    ? selectedAccount.geminiQuota.weekly.refreshCountdown
    : accounts[0]?.geminiQuota.weekly.refreshCountdown || "Active";

  const gemini5hPct = selectedAccount
    ? selectedAccount.geminiQuota.fiveHour.percentRemaining
    : pooledTelemetry.geminiFiveHourPooledPercent;

  const gemini5hCountdown = selectedAccount
    ? selectedAccount.geminiQuota.fiveHour.refreshCountdown
    : accounts[0]?.geminiQuota.fiveHour.refreshCountdown || "Active";

  const claudeWeeklyPct = selectedAccount
    ? selectedAccount.claudeGptQuota.weekly.percentRemaining
    : pooledTelemetry.claudeGptWeeklyPooledPercent;

  const claudeWeeklyCountdown = selectedAccount
    ? selectedAccount.claudeGptQuota.weekly.refreshCountdown
    : accounts[0]?.claudeGptQuota.weekly.refreshCountdown || "Active";

  const claude5hPct = selectedAccount
    ? selectedAccount.claudeGptQuota.fiveHour.percentRemaining
    : pooledTelemetry.claudeGptFiveHourPooledPercent;

  const claude5hCountdown = selectedAccount
    ? selectedAccount.claudeGptQuota.fiveHour.refreshCountdown
    : accounts[0]?.claudeGptQuota.fiveHour.refreshCountdown || "Active";

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
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
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
          </Paper>
        </Box>

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
