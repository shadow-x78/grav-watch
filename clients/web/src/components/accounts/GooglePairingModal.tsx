"use client";

import React, { useState } from "react";
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
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import TerminalIcon from "@mui/icons-material/Terminal";
import SecurityIcon from "@mui/icons-material/Security";

interface GooglePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GooglePairingModal: React.FC<GooglePairingModalProps> = ({ isOpen, onClose }) => {
  const { accounts, refreshAllAccounts } = useGravWatch();

  const nextAccountId = `acc-${Math.max(1, accounts.length + 1)}`;
  const [targetAccountId, setTargetAccountId] = useState(accounts.length > 0 ? accounts[0].id : "acc-1");
  const [authCode, setAuthCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  const handleOpenGoogle = async () => {
    setLoadingUrl(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/v1/auth/url?account_id=${encodeURIComponent(targetAccountId)}`);
      const data = await res.json();
      if (data.auth_url) {
        setAuthUrl(data.auth_url);
        window.open(data.auth_url, "_blank", "noopener,noreferrer");
      } else {
        window.open(`/api/v1/auth/start?account_id=${encodeURIComponent(targetAccountId)}`, "_blank");
      }
    } catch (e: any) {
      window.open(`/api/v1/auth/start?account_id=${encodeURIComponent(targetAccountId)}`, "_blank");
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
          account_id: targetAccountId,
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
              Official Zero-Config Google Identity & Native CLI Authentication
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
              Node <strong>{targetAccountId}</strong> paired with <strong>{successEmail}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: "#9ca3af", display: "block", mt: 2 }}>
              Updating dashboard telemetry...
            </Typography>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleExchangeCode}>
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
                disabled={loadingUrl || loading}
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
                {loadingUrl ? "Generating Google Sign-in Link..." : "1. Open Google Sign-in Page →"}
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
                    "& fieldset": { borderColor: "#30363d" },
                    "&:hover fieldset": { borderColor: "#2563eb" },
                  },
                }}
              />
            </Box>
          </Box>
        )}
      </DialogContent>

      {!successEmail && (
        <DialogActions sx={{ p: 3, pt: 1, borderTop: "1px solid #21262d" }}>
          <Button onClick={handleClose} disabled={loading} sx={{ color: "#9ca3af", textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleExchangeCode}
            variant="contained"
            disabled={loading || !authCode.trim()}
            sx={{
              bgcolor: "#22c55e",
              color: "#fff",
              fontWeight: 600,
              textTransform: "none",
              px: 3,
              borderRadius: 2,
              "&:hover": { bgcolor: "#16a34a" },
              "&:disabled": { bgcolor: "#374151", color: "#9ca3af" },
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Complete Pairing"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};
