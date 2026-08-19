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
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { formatCountdownWithDays } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface AccountListItemCardProps {
  account: GravAccount;
  onEdit: (account: GravAccount) => void;
  onDelete: (account: GravAccount) => void;
}

export const AccountListItemCard: React.FC<AccountListItemCardProps> = ({
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, minWidth: { lg: 280 }, flex: { lg: "0 0 280px" } }}>
            <Avatar
              src={account.avatarUrl || undefined}
              alt={account.alias}
              sx={{
                width: 44,
                height: 44,
                border: "1.5px solid rgba(255, 255, 255, 0.15)",
                flexShrink: 0,
                background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "1.15rem",
              }}
            >
              {account.alias ? account.alias.charAt(0).toUpperCase() : "S"}
            </Avatar>
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
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontFamily: "monospace",
                  display: "block",
                  fontSize: "0.72rem",
                  mt: 0.25,
                }}
                noWrap
              >
                {account.email}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexWrap: "wrap",
              minWidth: { md: 200 },
            }}
          >
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
              sx={{ height: 22, fontSize: "0.68rem", fontWeight: 800, textTransform: "capitalize" }}
            />
            {account.tags.slice(0, 2).map((tag, idx) => (
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

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1.5,
              flex: 1,
            }}
          >
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
                    {t("accounts.card.geminiModels")}
                  </Typography>
                  <Tooltip title={t("accounts.card.geminiTooltip")}>
                    <InfoOutlinedIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                  </Tooltip>
                </Box>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem", fontFamily: "monospace" }}>
                  {t("accounts.card.refreshesIn", { time: formatCountdownWithDays(account.geminiQuota.fiveHour.refreshCountdown, language) })}
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
                      {t("accounts.card.label5h")}
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
                      {t("accounts.card.labelWeekly")}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>

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
                    {t("accounts.card.claudeGptModels")}
                  </Typography>
                  <Tooltip title={t("accounts.card.claudeTooltip")}>
                    <InfoOutlinedIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                  </Tooltip>
                </Box>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem", fontFamily: "monospace" }}>
                  {t("accounts.card.refreshesIn", { time: formatCountdownWithDays(account.claudeGptQuota.fiveHour.refreshCountdown, language) })}
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
                      {t("accounts.card.label5h")}
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
                      {t("accounts.card.labelWeekly")}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>

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
              sx={{ height: 22, fontSize: "0.68rem", fontWeight: 800, textTransform: "capitalize" }}
            />

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
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
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
