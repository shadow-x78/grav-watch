"use client";

import React, { useState } from "react";
import { GravAccount } from "@/types/gravwatch";
import { useGravWatch } from "@/context/GravWatchContext";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
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
import { formatCountdownWithDays } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface AccountCardProps {
  account: GravAccount;
  onEdit: (account: GravAccount) => void;
  onDelete: (account: GravAccount) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onEdit,
  onDelete,
}) => {
  const { toggleAccountStatus, refreshAccount } = useGravWatch();
  const { t, language } = useLanguage();
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
        borderRadius: 3.5,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "transform 0.2s ease, border-color 0.25s ease",
        "&:hover": {
          borderColor: "rgba(16, 185, 129, 0.4)",
          transform: "translateY(-2px)",
          boxShadow: "none",
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, pb: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flex: 1 }}>
            <Avatar
              src={account.avatarUrl || undefined}
              alt={account.alias}
              sx={{
                width: 42,
                height: 42,
                border: "1.5px solid rgba(255, 255, 255, 0.15)",
                flexShrink: 0,
                background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "1.1rem",
              }}
            >
              {account.alias ? account.alias.charAt(0).toUpperCase() : "S"}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 800, color: "#ffffff", fontSize: { xs: "0.88rem", sm: "0.95rem" } }}
                  noWrap
                >
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
                  fontSize: { xs: "0.7rem", sm: "0.75rem" },
                  mt: 0.2,
                }}
                noWrap
              >
                {account.email}
              </Typography>
            </Box>
          </Box>

          <Chip
            label={t(`common.${account.status}`)}
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
            sx={{ height: 22, fontSize: "0.68rem", fontWeight: 800, flexShrink: 0, textTransform: "capitalize" }}
          />
        </Box>

        {account.tags.length > 0 && (
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 2 }}>
            {account.tags.map((tag, idx) => (
              <Chip
                key={idx}
                label={tag}
                size="small"
                variant="outlined"
                sx={{
                  height: 18,
                  fontSize: "0.62rem",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  color: "text.secondary",
                }}
              />
            ))}
          </Box>
        )}

        <Box sx={{ mb: 1.75 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.75 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.75rem" }}>
              {t("accounts.card.geminiModels")}
            </Typography>
            <Tooltip title={t("accounts.card.geminiTooltip")}>
              <InfoOutlinedIcon sx={{ fontSize: 13, color: "text.secondary", cursor: "pointer" }} />
            </Tooltip>
          </Box>

          <Paper
            elevation={0}
            sx={{
              border: "1px solid rgba(255, 255, 255, 0.08)",
              backgroundColor: "rgba(18, 22, 34, 0.75)",
              borderRadius: 2.5,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                p: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "#ffffff", display: "block", fontSize: "0.78rem" }}>
                  {t("accounts.card.weeklyRemaining")}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem", display: "block" }} noWrap>
                  {account.geminiQuota.weekly.percentRemaining < 100
                    ? t("accounts.card.refreshesIn", { time: formatCountdownWithDays(account.geminiQuota.weekly.refreshCountdown, language) })
                    : t("accounts.card.fullCapacity")}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexShrink: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: "monospace", color: "#ffffff", fontSize: "0.82rem" }}>
                  {account.geminiQuota.weekly.percentRemaining}%
                </Typography>
                <ProgressRing value={account.geminiQuota.weekly.percentRemaining} size={26} thickness={3.5} />
              </Box>
            </Box>

            <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.06)" }} />

            <Box
              sx={{
                p: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "#ffffff", display: "block", fontSize: "0.78rem" }}>
                  {t("accounts.card.fiveHourRemaining")}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem", display: "block" }} noWrap>
                  {account.geminiQuota.fiveHour.percentRemaining < 100
                    ? t("accounts.card.refreshesIn", { time: formatCountdownWithDays(account.geminiQuota.fiveHour.refreshCountdown, language) })
                    : t("accounts.card.fullCapacity")}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexShrink: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: "monospace", color: "#ffffff", fontSize: "0.82rem" }}>
                  {account.geminiQuota.fiveHour.percentRemaining}%
                </Typography>
                <ProgressRing value={account.geminiQuota.fiveHour.percentRemaining} size={26} thickness={3.5} />
              </Box>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ mb: 1.75 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.75 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.75rem" }}>
              {t("accounts.card.claudeGptModels")}
            </Typography>
            <Tooltip title={t("accounts.card.claudeTooltip")}>
              <InfoOutlinedIcon sx={{ fontSize: 13, color: "text.secondary", cursor: "pointer" }} />
            </Tooltip>
          </Box>

          <Paper
            elevation={0}
            sx={{
              border: "1px solid rgba(255, 255, 255, 0.08)",
              backgroundColor: "rgba(18, 22, 34, 0.75)",
              borderRadius: 2.5,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                p: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "#ffffff", display: "block", fontSize: "0.78rem" }}>
                  {t("accounts.card.weeklyRemaining")}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem", display: "block" }} noWrap>
                  {account.claudeGptQuota.weekly.percentRemaining < 100
                    ? t("accounts.card.refreshesIn", { time: formatCountdownWithDays(account.claudeGptQuota.weekly.refreshCountdown, language) })
                    : t("accounts.card.fullCapacity")}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexShrink: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: "monospace", color: "#ffffff", fontSize: "0.82rem" }}>
                  {account.claudeGptQuota.weekly.percentRemaining}%
                </Typography>
                <ProgressRing value={account.claudeGptQuota.weekly.percentRemaining} size={26} thickness={3.5} />
              </Box>
            </Box>

            <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.06)" }} />

            <Box
              sx={{
                p: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "#ffffff", display: "block", fontSize: "0.78rem" }}>
                  {t("accounts.card.fiveHourRemaining")}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem", display: "block" }} noWrap>
                  {account.claudeGptQuota.fiveHour.percentRemaining < 100
                    ? t("accounts.card.refreshesIn", { time: formatCountdownWithDays(account.claudeGptQuota.fiveHour.refreshCountdown, language) })
                    : t("accounts.card.fullCapacity")}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexShrink: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: "monospace", color: "#ffffff", fontSize: "0.82rem" }}>
                  {account.claudeGptQuota.fiveHour.percentRemaining}%
                </Typography>
                <ProgressRing value={account.claudeGptQuota.fiveHour.percentRemaining} size={26} thickness={3.5} />
              </Box>
            </Box>
          </Paper>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 1.25,
            backgroundColor: "rgba(9, 13, 22, 0.5)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <DnsIcon sx={{ fontSize: 15, color: "primary.main" }} />
            <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary", fontSize: "0.72rem" }}>
              {account.containerName} ({account.ramUsageMb}MB)
            </Typography>
          </Box>
          <Chip
            label={account.containerStatus === "running" ? t("common.online") : t("common.offline")}
            size="small"
            color={account.containerStatus === "running" ? "success" : "default"}
            variant="outlined"
            sx={{ height: 18, fontSize: "0.62rem", fontWeight: 700 }}
          />
        </Paper>
      </CardContent>

      <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.06)" }} />

      <CardActions sx={{ px: 2, py: 1.25, justifyContent: "space-between" }}>
        <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace", fontSize: "0.7rem" }}>
          {t("accounts.card.nodeId", { id: account.id })}
        </Typography>

        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title={t("accounts.card.tooltips.refresh")}>
            <IconButton size="small" onClick={handleRefresh} sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}>
              <RefreshIcon sx={{ fontSize: 16, animation: isSpinning ? "spin 1s linear infinite" : "none" }} />
            </IconButton>
          </Tooltip>

          <Tooltip title={account.status === "paused" ? t("accounts.card.tooltips.resume") : t("accounts.card.tooltips.pause")}>
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

          <Tooltip title={t("accounts.card.tooltips.edit")}>
            <IconButton size="small" onClick={() => onEdit(account)} sx={{ color: "text.secondary", "&:hover": { color: "secondary.main" } }}>
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title={t("accounts.card.tooltips.delete")}>
            <IconButton size="small" onClick={() => onDelete(account)} sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}>
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};
