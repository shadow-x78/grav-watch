"use client";

import React, { useState } from "react";
import { useGravWatch } from "@/context/GravWatchContext";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Tooltip from "@mui/material/Tooltip";
import ButtonGroup from "@mui/material/ButtonGroup";
import Chip from "@mui/material/Chip";
import LayersIcon from "@mui/icons-material/Layers";
import PublicIcon from "@mui/icons-material/Public";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import MenuIcon from "@mui/icons-material/Menu";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import TranslateIcon from "@mui/icons-material/Translate";
import { TimeRangeFilter } from "@/types/gravwatch";
import { useLanguage } from "@/context/LanguageContext";

interface HeaderProps {
  onOpenGooglePairing: () => void;
  onOpenManualAdd?: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenGooglePairing,
  onOpenManualAdd,
  onToggleMobileSidebar,
}) => {
  const {
    accounts,
    selectedAccountId,
    setSelectedAccountId,
    refreshAllAccounts,
    isLiveStreaming,
    setIsLiveStreaming,
    timeRange,
    setTimeRange,
  } = useGravWatch();
  const { language, toggleLanguage, direction, t } = useLanguage();

  const [isSpinning, setIsSpinning] = useState(false);

  const handleManualRefresh = () => {
    setIsSpinning(true);
    refreshAllAccounts();
    setTimeout(() => setIsSpinning(false), 700);
  };

  const timeRanges: TimeRangeFilter[] = ["1h", "24h", "7d", "30d"];

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: "#070b14",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        color: "#ffffff",
        zIndex: 1100,
        p: 0,
        m: 0,
        width: "100%",
        maxWidth: "100vw",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: { xs: 60, sm: 68 },
          height: { xs: 60, sm: 68 },
          p: 0,
          m: 0,
          width: "100%",
          maxWidth: "100vw",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            width: { xs: "auto", lg: 250 },
            minWidth: { xs: "auto", lg: 250 },
            height: { xs: 60, sm: 68 },
            display: "flex",
            alignItems: "center",
            px: { xs: 1, sm: 2, lg: 2.5 },
            borderRight: { xs: "none", lg: direction === "rtl" ? "none" : "1px solid rgba(255, 255, 255, 0.08)" },
            borderLeft: { xs: "none", lg: direction === "rtl" ? "1px solid rgba(255, 255, 255, 0.08)" : "none" },
            flexShrink: 0,
            gap: { xs: 0.75, sm: 1.25 },
          }}
        >
          <IconButton
            id="mobile-menu-toggle"
            onClick={onToggleMobileSidebar}
            size="small"
            aria-label={t("layout.header.mobileMenuAria")}
            sx={{
              display: { xs: "flex", lg: "none" },
              color: "#94a3b8",
              p: { xs: 0.5, sm: 0.75 },
              "&:hover": { color: "#ffffff" },
            }}
          >
            <MenuIcon sx={{ fontSize: { xs: 22, sm: 24 } }} />
          </IconButton>

          <Box
            sx={{
              width: { xs: 28, sm: 32 },
              height: { xs: 28, sm: 32 },
              borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <LayersIcon sx={{ color: "#ffffff", fontSize: { xs: 16, sm: 18 } }} />
          </Box>

          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.01em",
              fontSize: "1.05rem",
              display: { xs: "none", sm: "block" },
            }}
          >
            {t("layout.header.title")}
          </Typography>

          <Chip
            label="v2.4.1"
            size="small"
            sx={{
              height: 20,
              fontSize: "0.65rem",
              fontWeight: 700,
              fontFamily: "monospace",
              color: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              display: { xs: "none", sm: "inline-flex" },
            }}
          />
        </Box>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: { xs: 1, sm: 2, lg: 3 },
            height: { xs: 60, sm: 68 },
            minWidth: 0,
            gap: { xs: 0.75, sm: 1.5 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", minWidth: 0, flex: { xs: 1, sm: "initial" } }}>
            <FormControl
              size="small"
              sx={{
                width: { xs: "100%", sm: "auto" },
                minWidth: 0,
                maxWidth: { xs: 145, sm: 220, md: 270 },
              }}
            >
              <Select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                renderValue={(value) => {
                  if (value === "all") {
                    return (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <PublicIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: "#38bdf8", flexShrink: 0 }} />
                        <Typography
                          component="span"
                          sx={{
                            fontSize: { xs: "0.72rem", sm: "0.82rem" },
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "#cbd5e1",
                          }}
                        >
                          <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                            {t("layout.header.allPooledShort")}
                          </Box>
                          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                            {t("layout.header.allAccountsPooled")}
                          </Box>
                        </Typography>
                      </Box>
                    );
                  }
                  const acc = accounts.find((a) => a.id === value);
                  return (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          flexShrink: 0,
                          backgroundColor:
                            acc?.status === "active"
                              ? "#10b981"
                              : acc?.status === "warning"
                              ? "#f59e0b"
                              : acc?.status === "depleted"
                              ? "#f43f5e"
                              : "#94a3b8",
                        }}
                      />
                      <Typography
                        component="span"
                        sx={{
                          fontSize: { xs: "0.72rem", sm: "0.82rem" },
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "#cbd5e1",
                        }}
                      >
                        {acc ? acc.alias : value}
                      </Typography>
                    </Box>
                  );
                }}
                sx={{
                  backgroundColor: "#0b1220",
                  color: "#cbd5e1",
                  borderRadius: 2,
                  fontSize: { xs: "0.72rem", sm: "0.82rem" },
                  fontWeight: 600,
                  height: { xs: 34, sm: 38 },
                  "& .MuiSelect-select": {
                    py: 0,
                    px: { xs: 0.75, sm: 1.25 },
                    pr: direction === "rtl" ? { xs: "8px !important", sm: "12px !important" } : { xs: "22px !important", sm: "30px !important" },
                    pl: direction === "rtl" ? { xs: "22px !important", sm: "30px !important" } : { xs: "8px !important", sm: "12px !important" },
                    display: "flex",
                    alignItems: "center",
                    height: "100%",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255, 255, 255, 0.12)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(16, 185, 129, 0.4)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#10b981",
                  },
                  "& .MuiSelect-icon": {
                    color: "#94a3b8",
                    right: direction === "rtl" ? "auto" : { xs: 3, sm: 7 },
                    left: direction === "rtl" ? { xs: 3, sm: 7 } : "auto",
                    fontSize: { xs: 18, sm: 20 },
                  },
                }}
              >
                <MenuItem value="all" sx={{ fontSize: "0.82rem" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PublicIcon sx={{ fontSize: 16, color: "#38bdf8" }} />
                    <span>{t("layout.header.allAccountsPooled")}</span>
                  </Box>
                </MenuItem>
                {accounts.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id} sx={{ fontSize: "0.82rem" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor:
                            acc.status === "active"
                              ? "#10b981"
                              : acc.status === "warning"
                              ? "#f59e0b"
                              : acc.status === "depleted"
                              ? "#f43f5e"
                              : "#94a3b8",
                        }}
                      />
                      <span>{acc.alias}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.35, sm: 0.75, lg: 1.5 }, flexShrink: 0 }}>
            <ButtonGroup
              size="small"
              sx={{
                backgroundColor: "#0b1220",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "9999px",
                p: "3px",
                display: { xs: "none", sm: "inline-flex" },
                alignItems: "center",
              }}
            >
              {timeRanges.map((range) => {
                const isActive = timeRange === range;
                const label = t(`layout.header.timeRanges.${range}`);
                return (
                  <Button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    sx={{
                      textTransform: "uppercase",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      py: 0.35,
                      px: 1.3,
                      border: "none !important",
                      borderRadius: "9999px !important",
                      backgroundColor: isActive ? "#10b981" : "transparent",
                      color: isActive ? "#ffffff" : "#94a3b8",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: isActive ? "#059669" : "rgba(255, 255, 255, 0.05)",
                        color: isActive ? "#ffffff" : "#f8fafc",
                      },
                    }}
                  >
                    {label}
                  </Button>
                );
              })}
            </ButtonGroup>

            <Tooltip title={isLiveStreaming ? t("layout.header.liveRunningTooltip") : t("layout.header.livePausedTooltip")}>
              <Box sx={{ display: { xs: "flex", lg: "none" } }}>
                <IconButton
                  size="small"
                  onClick={() => setIsLiveStreaming(!isLiveStreaming)}
                  aria-label="Toggle live telemetry streaming"
                  sx={{
                    color: isLiveStreaming ? "#10b981" : "#64748b",
                    p: { xs: 0.5, sm: 0.8 },
                    width: { xs: 30, sm: 34 },
                    height: { xs: 30, sm: 34 },
                    "&:hover": { color: "#10b981" },
                  }}
                >
                  {isLiveStreaming
                    ? <RadioButtonCheckedIcon sx={{ fontSize: { xs: 17, sm: 20 }, animation: "pulse 1.5s infinite" }} />
                    : <RadioButtonUncheckedIcon sx={{ fontSize: { xs: 17, sm: 20 } }} />}
                </IconButton>
              </Box>
            </Tooltip>
            <Tooltip title={isLiveStreaming ? t("layout.header.liveRunningTooltip") : t("layout.header.livePausedTooltip")}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setIsLiveStreaming(!isLiveStreaming)}
                startIcon={
                  isLiveStreaming
                    ? <RadioButtonCheckedIcon sx={{ fontSize: 13, color: "#10b981", animation: "pulse 1.5s infinite" }} />
                    : <RadioButtonUncheckedIcon sx={{ fontSize: 13, color: "#64748b" }} />
                }
                sx={{
                  display: { xs: "none", lg: "inline-flex" },
                  borderColor: isLiveStreaming ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.1)",
                  backgroundColor: isLiveStreaming ? "rgba(16, 185, 129, 0.08)" : "transparent",
                  color: isLiveStreaming ? "#10b981" : "#94a3b8",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 1.5,
                  "&:hover": {
                    borderColor: "#10b981",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                  },
                }}
              >
                {t("layout.header.liveStream")}
              </Button>
            </Tooltip>

            <Tooltip title={t("layout.header.switchLangTooltip")}>
              <Button
                size="small"
                onClick={toggleLanguage}
                aria-label="Toggle language"
                startIcon={<TranslateIcon sx={{ fontSize: 15 }} />}
                sx={{
                  color: "#94a3b8",
                  backgroundColor: "#0b1220",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 2,
                  px: { xs: 0.8, sm: 1.2 },
                  height: { xs: 30, sm: 34 },
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  "&:hover": {
                    color: "#38bdf8",
                    borderColor: "rgba(56, 189, 248, 0.4)",
                    backgroundColor: "#0d1527",
                  },
                }}
              >
                {language === "ar" ? "EN" : "عربي"}
              </Button>
            </Tooltip>

            <Tooltip title={t("layout.header.refreshTooltip")}>
              <IconButton
                size="small"
                onClick={handleManualRefresh}
                aria-label={t("layout.header.refreshTooltip")}
                sx={{
                  color: "#94a3b8",
                  backgroundColor: "#0b1220",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 2,
                  p: { xs: 0.5, sm: 0.8 },
                  width: { xs: 30, sm: 34 },
                  height: { xs: 30, sm: 34 },
                  "&:hover": {
                    color: "#10b981",
                    borderColor: "rgba(16, 185, 129, 0.4)",
                    backgroundColor: "#0d1527",
                  },
                }}
              >
                <RefreshIcon sx={{ fontSize: { xs: 16, sm: 18 }, animation: isSpinning ? "spin 1s linear infinite" : "none" }} />
              </IconButton>
            </Tooltip>

            <Tooltip title={t("layout.header.pairGoogleTooltip")}>
              <Box sx={{ display: { xs: "flex", lg: "none" } }}>
                <IconButton
                  size="small"
                  onClick={onOpenGooglePairing}
                  aria-label={t("layout.header.pairGoogleTooltip")}
                  sx={{
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    width: { xs: 30, sm: 34 },
                    height: { xs: 30, sm: 34 },
                    borderRadius: 2,
                    p: { xs: 0.5, sm: 0.8 },
                    "&:hover": {
                      background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    },
                  }}
                >
                  <AddCircleIcon sx={{ fontSize: { xs: 17, sm: 20 } }} />
                </IconButton>
              </Box>
            </Tooltip>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddCircleIcon sx={{ fontSize: 18 }} />}
              onClick={onOpenGooglePairing}
              aria-label={t("layout.header.pairGoogleTooltip")}
              sx={{
                display: { xs: "none", lg: "inline-flex" },
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.8rem",
                px: 2,
                py: 0.8,
                borderRadius: 2,
                boxShadow: "none",
                "&:hover": {
                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  boxShadow: "none",
                },
              }}
            >
              {t("layout.header.pairGoogleBtn")}
            </Button>

            <Tooltip title={t("layout.header.systemConfigTooltip")}>
              <IconButton
                size="small"
                sx={{
                  color: "#64748b",
                  p: 0.8,
                  display: { xs: "none", sm: "flex" },
                  "&:hover": { color: "#ffffff" },
                }}
              >
                <SettingsOutlinedIcon sx={{ fontSize: 19 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
