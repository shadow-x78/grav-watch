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
import { formatCountdownWithDays } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export const ModelQuotaMatrix: React.FC = () => {
  const { accounts, selectedAccountId, refreshAllAccounts, pooledTelemetry } = useGravWatch();
  const { t, language } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedAccount =
    selectedAccountId === "all"
      ? null
      : accounts.find((a) => a.id === selectedAccountId);

  const displayPlan = selectedAccount ? selectedAccount.plan : (language === "ar" ? "Google AI Pro (عنقود مجمع)" : "Google AI Pro (Pooled Cluster)");

  const geminiWeeklyPct = selectedAccount
    ? selectedAccount.geminiQuota.weekly.percentRemaining
    : pooledTelemetry.geminiWeeklyPooledPercent;

  const geminiWeeklyCountdown = formatCountdownWithDays(
    selectedAccount
      ? selectedAccount.geminiQuota.weekly.refreshCountdown
      : accounts[0]?.geminiQuota.weekly.refreshCountdown || "Active",
    language
  );

  const gemini5hPct = selectedAccount
    ? selectedAccount.geminiQuota.fiveHour.percentRemaining
    : pooledTelemetry.geminiFiveHourPooledPercent;

  const gemini5hCountdown = formatCountdownWithDays(
    selectedAccount
      ? selectedAccount.geminiQuota.fiveHour.refreshCountdown
      : accounts[0]?.geminiQuota.fiveHour.refreshCountdown || "Active",
    language
  );

  const claudeWeeklyPct = selectedAccount
    ? selectedAccount.claudeGptQuota.weekly.percentRemaining
    : pooledTelemetry.claudeGptWeeklyPooledPercent;

  const claudeWeeklyCountdown = formatCountdownWithDays(
    selectedAccount
      ? selectedAccount.claudeGptQuota.weekly.refreshCountdown
      : accounts[0]?.claudeGptQuota.weekly.refreshCountdown || "Active",
    language
  );

  const claude5hPct = selectedAccount
    ? selectedAccount.claudeGptQuota.fiveHour.percentRemaining
    : pooledTelemetry.claudeGptFiveHourPooledPercent;

  const claude5hCountdown = formatCountdownWithDays(
    selectedAccount
      ? selectedAccount.claudeGptQuota.fiveHour.refreshCountdown
      : accounts[0]?.claudeGptQuota.fiveHour.refreshCountdown || "Active",
    language
  );

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
              {t("overview.matrix.title")}
            </Typography>
            <Tooltip title={t("overview.matrix.refreshTooltip")}>
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
              ? t("overview.matrix.subheaderManaging", { alias: selectedAccount.alias, email: selectedAccount.email })
              : t("overview.matrix.subheaderPooled")}
          </Typography>
        }
        action={
          <Chip
            label={selectedAccount ? selectedAccount.containerName : t("overview.matrix.multiAccountPool")}
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
            {t("overview.matrix.planSection")}
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
                {t("overview.matrix.yourPlan", { plan: displayPlan })}
              </Typography>
              <Chip
                label={t("common.active").toUpperCase()}
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
              {t("overview.matrix.geminiModels")}
            </Typography>
            <Tooltip title={t("overview.matrix.geminiTooltip")}>
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
                  {t("overview.matrix.weeklyLimitRemaining")}
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
                    ? t("overview.matrix.weeklyPartialUsed", { time: geminiWeeklyCountdown })
                    : t("overview.matrix.fullWeeklyCapacity")}
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
                  {t("overview.matrix.fiveHourLimitRemaining")}
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
                    ? t("overview.matrix.fiveHourPartialUsed", { time: gemini5hCountdown })
                    : t("overview.matrix.fullFiveHourCapacity")}
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
              {t("overview.matrix.claudeGptModels")}
            </Typography>
            <Tooltip title={t("overview.matrix.claudeTooltip")}>
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
                  {t("overview.matrix.weeklyLimitRemaining")}
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
                    ? t("overview.matrix.weeklyPartialUsed", { time: claudeWeeklyCountdown })
                    : t("overview.matrix.fullWeeklyCapacity")}
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
                  {t("overview.matrix.fiveHourLimitRemaining")}
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
                    ? t("overview.matrix.fiveHourPartialUsed", { time: claude5hCountdown })
                    : t("overview.matrix.fullFiveHourCapacity")}
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
