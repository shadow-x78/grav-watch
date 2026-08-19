"use client";

import React, { useState, useEffect } from "react";
import { useGravWatch } from "@/context/GravWatchContext";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import TerminalIcon from "@mui/icons-material/Terminal";
import SecurityIcon from "@mui/icons-material/Security";
import AddIcon from "@mui/icons-material/Add";

interface GooglePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GooglePairingModal: React.FC<GooglePairingModalProps> = ({ isOpen, onClose }) => {
  const { accounts, refreshAllAccounts } = useGravWatch();

  const [targetAccountId, setTargetAccountId] = useState("acc-2");
  const [authCode, setAuthCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  // Auto-calculate next available account node ID
  useEffect(() => {
    if (isOpen) {
      const existingIds = new Set(accounts.map((a) => a.id));
      let nextNum = 1;
      while (existingIds.has(`acc-${nextNum}`)) {
        nextNum++;
      }
      setTargetAccountId(`acc-${nextNum}`);
      setAuthCode("");
      setErrorMsg(null);
      setSuccessEmail(null);
      setAuthUrl(null);
    }
  }, [isOpen, accounts]);

  const handleOpenGoogle = async () => {
    if (!targetAccountId.trim()) {
      setErrorMsg("Please provide a valid Target Account ID.");
      return;
    }

    setLoadingUrl(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/v1/auth/url?account_id=${encodeURIComponent(targetAccountId.trim())}`);
      const data = await res.json();
      if (data.auth_url) {
        setAuthUrl(data.auth_url);
        window.open(data.auth_url, "_blank", "noopener,noreferrer");
      } else {
        window.open(`/api/v1/auth/start?account_id=${encodeURIComponent(targetAccountId.trim())}`, "_blank");
      }
    } catch (e: any) {
      window.open(`/api/v1/auth/start?account_id=${encodeURIComponent(targetAccountId.trim())}`, "_blank");
    } finally {
      setLoadingUrl(false);
    }
  };

  const handleExchangeCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authCode.trim()) {
      setErrorMsg("Please paste the authorization code from Google.");
      return;
    }
    if (!targetAccountId.trim()) {
      setErrorMsg("Please provide a valid Target Account ID.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/auth/exchange-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          account_id: targetAccountId.trim(),
          code: authCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.detail || "Authentication failed. Please try again.");
      }

      setSuccessEmail(data.email || `Account ${targetAccountId}`);
      await refreshAllAccounts();

      setTimeout(() => {
        setSuccessEmail(null);
        setAuthCode("");
        setLoading(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to exchange authorization code.");
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setErrorMsg(null);
    setSuccessEmail(null);
    setAuthCode("");
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: "#161b22",
            backgroundImage: "none",
            border: "1px solid #30363d",
            borderRadius: 3,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          },
        },
      }}
    >
      <DialogTitle sx={{ p: 3, pb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: "primary.main",
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SecurityIcon sx={{ color: "#fff", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
              Pair Google Antigravity Account
            </Typography>
            <Typography variant="caption" sx={{ color: "#9ca3af" }}>
              Dynamic On-Demand Isolated Container Provisioning
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 1 }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2, bgcolor: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", color: "#fca5a5" }}>
            {errorMsg}
          </Alert>
        )}

        {successEmail ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 56, color: "#22c55e", mb: 1.5 }} />
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, mb: 0.5 }}>
              Successfully Authenticated!
            </Typography>
            <Typography variant="body2" sx={{ color: "#86efac" }}>
              Container <strong>gravwatch-{targetAccountId}</strong> provisioned for <strong>{successEmail}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: "#9ca3af", display: "block", mt: 2 }}>
              Streaming live quota telemetry...
            </Typography>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleExchangeCode}>
            {/* Target Account ID Input with Quick Select */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="subtitle2" sx={{ color: "#e4e6eb", fontWeight: 600, mb: 0.8 }}>
                Target Container ID (Unlimited Dynamic Nodes)
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={targetAccountId}
                onChange={(e) => setTargetAccountId(e.target.value)}
                placeholder="e.g. acc-2, acc-3, my-node"
                disabled={loading}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#0b0e14",
                    color: "#fff",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    borderRadius: 2,
                    "& fieldset": { borderColor: "#30363d" },
                    "&:hover fieldset": { borderColor: "#38bdf8" },
                  },
                }}
              />
              <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap", alignItems: "center" }}>
                <Typography variant="caption" sx={{ color: "#6b7280" }}>Quick suggestions:</Typography>
                {accounts.map((a) => (
                  <Chip
                    key={a.id}
                    label={`${a.id} (Re-auth)`}
                    size="small"
                    clickable
                    onClick={() => setTargetAccountId(a.id)}
                    sx={{
                      fontSize: "11px",
                      bgcolor: targetAccountId === a.id ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.05)",
                      color: targetAccountId === a.id ? "#38bdf8" : "#9ca3af",
                      borderColor: targetAccountId === a.id ? "#38bdf8" : "transparent",
                    }}
                  />
                ))}
                <Chip
                  icon={<AddIcon sx={{ fontSize: "14px !important" }} />}
                  label={`acc-${accounts.length + 1} (New Node)`}
                  size="small"
                  clickable
                  onClick={() => setTargetAccountId(`acc-${accounts.length + 1}`)}
                  sx={{
                    fontSize: "11px",
                    bgcolor: targetAccountId === `acc-${accounts.length + 1}` ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.05)",
                    color: targetAccountId === `acc-${accounts.length + 1}` ? "#22c55e" : "#9ca3af",
                    borderColor: targetAccountId === `acc-${accounts.length + 1}` ? "#22c55e" : "transparent",
                  }}
                />
              </Box>
            </Box>

            <Paper
              sx={{
                p: 2,
                mb: 2.5,
                bgcolor: "#0b0e14",
                border: "1px solid #21262d",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <TerminalIcon sx={{ color: "#38bdf8", fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontFamily: "monospace", color: "#38bdf8", fontSize: "13px" }}>
                $ agy auth login --target [{targetAccountId}]
              </Typography>
            </Paper>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ color: "#e4e6eb", fontWeight: 600, mb: 1 }}>
                Step 1: Open Google Sign-in Page
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={handleOpenGoogle}
                disabled={loadingUrl || loading || !targetAccountId.trim()}
                startIcon={<OpenInNewIcon />}
                sx={{
                  py: 1.3,
                  bgcolor: "#2563eb",
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#1d4ed8" },
                }}
              >
                {loadingUrl ? "Generating Google Sign-in Link..." : `1. Open Google Sign-in for [${targetAccountId}] →`}
              </Button>
              {authUrl ? (
                <Typography variant="caption" sx={{ color: "#38bdf8", display: "block", mt: 1, wordBreak: "break-all" }}>
                  Popup blocked? <a href={authUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#38bdf8", textDecoration: "underline" }}>Click here to open Google OAuth directly</a>
                </Typography>
              ) : (
                <Typography variant="caption" sx={{ color: "#9ca3af", display: "block", mt: 0.8 }}>
                  Opens the official Google Antigravity OAuth prompt in a new window.
                </Typography>
              )}
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: "#e4e6eb", fontWeight: 600, mb: 1 }}>
                Step 2: Paste Authorization Code
              </Typography>
              <TextField
                fullWidth
                placeholder="4/0AeanS... or ya29..."
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                disabled={loading}
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#0b0e14",
                    color: "#fff",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    borderRadius: 2,
                    "& fieldset": { borderColor: "#30363d" },
                    "&:hover fieldset": { borderColor: "#38bdf8" },
                  },
                }}
              />
            </Box>

            <DialogActions sx={{ px: 0, pt: 2 }}>
              <Button onClick={handleClose} disabled={loading} sx={{ color: "#9ca3af" }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !authCode.trim() || !targetAccountId.trim()}
                sx={{
                  bgcolor: "#22c55e",
                  color: "#000",
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 3,
                  "&:hover": { bgcolor: "#16a34a" },
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : `Complete Pairing [${targetAccountId}]`}
              </Button>
            </DialogActions>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
