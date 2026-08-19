"use client";

import React from "react";
import { useGravWatch } from "@/context/GravWatchContext";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import CloseIcon from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DnsIcon from "@mui/icons-material/Dns";
import TvIcon from "@mui/icons-material/Tv";

interface SystemIssuesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemIssuesModal: React.FC<SystemIssuesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { accounts, refreshAllAccounts, setActiveTab } = useGravWatch();

  const issueAccounts = accounts.filter(
    (a) => a.status === "depleted" || a.status === "warning"
  );

  const handleFixAndNavigate = () => {
    setActiveTab("accounts");
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: "#0b101d",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: { xs: 3, sm: 3.5 },
            backgroundImage: "none",
            p: 0,
            m: { xs: 1.5, sm: 2 },
            maxHeight: { xs: "calc(100% - 24px)", sm: "calc(100% - 64px)" },
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      <DialogTitle sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.75, sm: 2 }, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flex: 1 }}>
          <Avatar
            sx={{
              bgcolor: issueAccounts.length > 0 ? "rgba(244, 63, 94, 0.15)" : "rgba(16, 185, 129, 0.15)",
              color: issueAccounts.length > 0 ? "#f43f5e" : "#10b981",
              width: 36,
              height: 36,
              border: "1px solid",
              borderColor: issueAccounts.length > 0 ? "rgba(244, 63, 94, 0.3)" : "rgba(16, 185, 129, 0.3)",
              flexShrink: 0,
            }}
          >
            <TvIcon sx={{ fontSize: 20 }} />
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#ffffff", fontSize: { xs: "0.95rem", sm: "1.1rem" } }}>
                Cluster Diagnostics
              </Typography>
              <Chip
                label={issueAccounts.length > 0 ? `${issueAccounts.length} Issues` : "All Healthy"}
                color={issueAccounts.length > 0 ? "error" : "success"}
                size="small"
                sx={{ height: 20, fontSize: "0.65rem", fontWeight: 800, fontFamily: "monospace" }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", fontSize: { xs: "0.68rem", sm: "0.75rem" } }}>
              Docker sandbox quota limits & health checks
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary", "&:hover": { color: "#ffffff" }, flexShrink: 0 }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ my: 1, borderColor: "rgba(255, 255, 255, 0.08)" }} />

      <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 }, overflowY: "auto" }}>
        {issueAccounts.length === 0 ? (
          <Paper
            sx={{
              p: 4,
              textAlign: "center",
              backgroundColor: "rgba(16, 185, 129, 0.05)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: 3,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 48, color: "#10b981", mb: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#ffffff" }}>
              All 5 Docker Sandbox Nodes Are Healthy!
            </Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mt: 0.5 }}>
              No 429 rate limit errors or severe quota depletion detected across active accounts.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {issueAccounts.map((account) => {
              const isDepleted = account.status === "depleted";
              return (
                <Paper
                  key={account.id}
                  sx={{
                    p: { xs: 1.75, sm: 2.5 },
                    backgroundColor: isDepleted ? "rgba(244, 63, 94, 0.06)" : "rgba(245, 158, 11, 0.06)",
                    border: "1px solid",
                    borderColor: isDepleted ? "rgba(244, 63, 94, 0.3)" : "rgba(245, 158, 11, 0.3)",
                    borderRadius: 3,
                    flexShrink: 0,
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5, gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
                      <Avatar
                        src={account.avatarUrl}
                        alt={account.alias}
                        sx={{ width: 34, height: 34, border: "1px solid rgba(255, 255, 255, 0.15)", flexShrink: 0 }}
                      />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, color: "#ffffff", fontSize: { xs: "0.82rem", sm: "0.9rem" } }}>
                            {account.alias}
                          </Typography>
                          <Chip
                            label={account.plan}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: "0.62rem",
                              fontWeight: 700,
                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                              color: "#cbd5e1",
                            }}
                          />
                        </Box>
                        <Typography variant="caption" noWrap sx={{ color: "text.secondary", fontFamily: "monospace", fontSize: { xs: "0.68rem", sm: "0.75rem" }, display: "block" }}>
                          {account.email} • {account.containerName}
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      icon={isDepleted ? <ErrorIcon sx={{ fontSize: "14px !important" }} /> : <WarningAmberIcon sx={{ fontSize: "14px !important" }} />}
                      label={isDepleted ? "429 Rate Limit" : "Warning"}
                      color={isDepleted ? "error" : "warning"}
                      size="small"
                      sx={{ height: 22, fontSize: "0.68rem", fontWeight: 800, flexShrink: 0 }}
                    />
                  </Box>

                  <Box sx={{ pl: { xs: 0, sm: 5.5 } }}>
                    <Typography variant="body2" sx={{ color: "#e2e8f0", fontSize: { xs: "0.75rem", sm: "0.82rem" }, lineHeight: 1.4, mb: 1 }}>
                      {isDepleted
                        ? `The 5-hour rolling limit for Claude & GPT models on this node reached 0% (50,000 / 50,000 used). The Antigravity CLI will return HTTP 429 until the quota resets in ${account.claudeGptQuota.fiveHour.refreshCountdown}.`
                        : `Gemini and Claude 5-hour limits on this node are below 35% remaining. High token volume detected (${account.totalRequestsToday} requests today).`}
                    </Typography>

                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        backgroundColor: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: { xs: 1, sm: 2 },
                        fontSize: { xs: "0.68rem", sm: "0.72rem" },
                        fontFamily: "monospace",
                      }}
                    >
                      <div>
                        <span style={{ color: "#94a3b8" }}>Gemini 5h: </span>
                        <span style={{ color: "#ffffff", fontWeight: 700 }}>{account.geminiQuota.fiveHour.percentRemaining}%</span>
                      </div>
                      <div>
                        <span style={{ color: "#94a3b8" }}>Claude 5h: </span>
                        <span style={{ color: isDepleted ? "#f43f5e" : "#f59e0b", fontWeight: 700 }}>
                          {account.claudeGptQuota.fiveHour.percentRemaining}%
                        </span>
                      </div>
                      <div>
                        <span style={{ color: "#94a3b8" }}>RAM: </span>
                        <span style={{ color: "#cbd5e1" }}>{account.ramUsageMb}MB / 256MB</span>
                      </div>
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}

        <Box
          sx={{
            mt: 2,
            p: 1.25,
            borderRadius: 2,
            backgroundColor: "rgba(9, 13, 22, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 0.5,
            fontSize: "0.7rem",
            color: "#94a3b8",
            fontFamily: "monospace",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <DnsIcon sx={{ fontSize: 15, color: "#10b981" }} />
            <span>Docker Cluster: 5 / 5 Containers Online</span>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <span style={{ color: "#10b981" }}>• FastAPI Hub :8000 Live</span>
          </Box>
        </Box>
      </DialogContent>

      <Divider sx={{ my: 0, borderColor: "rgba(255, 255, 255, 0.08)" }} />

      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 1.75 }, gap: 1.25, flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, borderTop: "1px solid rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(9, 13, 22, 0.95)" }}>
        <Button
          startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
          onClick={refreshAllAccounts}
          sx={{ color: "#94a3b8", fontSize: "0.75rem", justifyContent: { xs: "center", sm: "flex-start" }, "&:hover": { color: "#ffffff" } }}
        >
          Re-scan Diagnostics
        </Button>

        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <Button onClick={onClose} variant="outlined" size="small" sx={{ borderColor: "rgba(255, 255, 255, 0.15)", color: "#cbd5e1", flex: { xs: 1, sm: "initial" } }}>
            Close
          </Button>

          <Button
            onClick={handleFixAndNavigate}
            variant="contained"
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
            sx={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#ffffff",
              fontWeight: 700,
              flex: { xs: 1, sm: "initial" },
            }}
          >
            Manage
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
