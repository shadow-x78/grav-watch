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
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import CircularProgress from "@mui/material/CircularProgress";
import ShieldIcon from "@mui/icons-material/Security";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DnsIcon from "@mui/icons-material/Dns";
import { AntigravityPlan } from "@/types/gravwatch";

interface GooglePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GooglePairingModal: React.FC<GooglePairingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { pairGoogleAccount, accounts } = useGravWatch();

  const [step, setStep] = useState<"select_account" | "provisioning" | "success">("select_account");
  const [selectedProfile, setSelectedProfile] = useState<{
    name: string;
    email: string;
    avatarUrl: string;
    plan: AntigravityPlan;
  }>({
    name: "Mohamed Hegazy (Work Dev)",
    email: "mohamed.hegazy.dev@gmail.com",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    plan: "Google AI Pro",
  });
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [customPlan, setCustomPlan] = useState<AntigravityPlan>("Google AI Pro");
  const [useCustom, setUseCustom] = useState(false);
  const [provisionProgress, setProvisionProgress] = useState(0);
  const [provisionLog, setProvisionLog] = useState("");

  const sampleGoogleAccounts = [
    {
      name: "Mohamed Hegazy (Work Dev)",
      email: "mohamed.hegazy.dev@gmail.com",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      plan: "Google AI Pro" as AntigravityPlan,
    },
    {
      name: "Cloud Architecture Team",
      email: "cloud.team.antigravity@gmail.com",
      avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
      plan: "Google AI Ultra" as AntigravityPlan,
    },
    {
      name: "Research & Evals Lab",
      email: "evals.lab.research@gmail.com",
      avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
      plan: "Google AI Pro" as AntigravityPlan,
    },
  ];

  // ==========================================================================
  // TODO: [BACKEND INTEGRATION] - Google OAuth Interactive Authentication Flow
  //
  // 1. Wizard Mock State:
  //    - `sampleGoogleAccounts`: Preset profiles for quick testing.
  //    - `provisionProgress` / `setTimeout`: Client timer simulating container volume creation.
  //
  // 2. Required Backend Endpoints & Streaming Protocol:
  //    - `POST /api/v1/auth/google/initiate`: Starts OAuth session and spawns setup container.
  //    - `WS   ws://localhost:8000/api/v1/auth/google/terminal-stream?session_id={id}`: Streams real-time terminal stdout/stderr
  //            from `./scripts/setup-auth.sh` for interactive OAuth device code verification.
  //    - `GET  /api/v1/auth/google/status?session_id={id}`: Polling fallback to check if user authorized in browser.
  //
  // 3. Backend Execution Pipeline:
  //    - 1. Creates isolated directory `./data/acc-XX/` with restricted permissions (0700).
  //    - 2. Spawns temporary authentication container: `docker run -i --rm -v ./data/acc-XX:/root/.gemini debian:bookworm-slim ...`
  //    - 3. Runs `setup-auth.sh`, captures Google OAuth device code URL, and streams it to the UI modal.
  //    - 4. Once authenticated, saves refresh token, launches persistent container `gravwatch-acc-XX`, and registers node in DB.
  //
  // 4. Edge Cases & Error Handling:
  //    - [ ] User Aborts OAuth: If user closes modal, send abort signal (`DELETE /api/v1/auth/google/session/{id}`) to kill temp container.
  //    - [ ] OAuth Timeout: Timeout session after 300 seconds if no authorization code is received.
  //    - [ ] Host Mount Permission Issue: Verify backend has read/write permissions on `./data/` directory.
  // ==========================================================================
  const handleStartPairing = () => {
    setStep("provisioning");
    setProvisionProgress(15);
    setProvisionLog("Initializing ./scripts/setup-auth.sh interactive daemon...");

    setTimeout(() => {
      setProvisionProgress(40);
      setProvisionLog("Mounting isolated token volume -> ./data/acc-0" + (accounts.length + 1));
    }, 700);

    setTimeout(() => {
      setProvisionProgress(70);
      setProvisionLog("Starting lightweight Docker node (debian:bookworm 256MB cap)...");
    }, 1400);

    setTimeout(() => {
      setProvisionProgress(95);
      setProvisionLog("Verifying Google Antigravity OAuth tokens & connecting to FastAPI hub...");
    }, 2100);

    setTimeout(() => {
      setProvisionProgress(100);
      const profileToPair = useCustom && customEmail
        ? {
            name: customName || customEmail.split("@")[0],
            email: customEmail,
            avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
            plan: customPlan,
          }
        : selectedProfile;

      pairGoogleAccount(profileToPair);
      setStep("success");
    }, 2800);
  };

  const handleClose = () => {
    setStep("select_account");
    setProvisionProgress(0);
    setUseCustom(false);
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
            backgroundColor: "#0d1322",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: { xs: 3, sm: 4 },
            m: { xs: 1.5, sm: 2 },
            maxHeight: { xs: "calc(100% - 24px)", sm: "calc(100% - 64px)" },
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      <DialogTitle sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.75, sm: 2 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ bgcolor: "rgba(16, 185, 129, 0.12)", color: "primary.main", width: 34, height: 34, flexShrink: 0 }}>
            <ShieldIcon sx={{ fontSize: 20 }} />
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#ffffff", fontSize: { xs: "0.92rem", sm: "1.05rem" }, lineHeight: 1.3 }}>
              Pair Google OAuth Account (setup-auth.sh)
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: { xs: "0.7rem", sm: "0.75rem" }, display: "block" }}>
              Creates an isolated Docker container node and secures token storage
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: "rgba(255, 255, 255, 0.08)", px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 }, overflowY: "auto" }}>
        {step === "select_account" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Google Header Simulation */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.75, sm: 2.5 },
                border: "1px solid rgba(255, 255, 255, 0.08)",
                backgroundColor: "rgba(9, 13, 22, 0.7)",
                borderRadius: 2.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#ffffff" }}>
                    Google Identity Services
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Sign in to Google Antigravity Engine
                  </Typography>
                </Box>
              </Box>

              {!useCustom ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                    Choose an account to pair:
                  </Typography>
                  {sampleGoogleAccounts.map((acc, idx) => (
                    <Paper
                      key={idx}
                      onClick={() => setSelectedProfile(acc)}
                      sx={{
                        p: { xs: 1.25, sm: 1.5 },
                        cursor: "pointer",
                        border: "1px solid",
                        borderColor: selectedProfile.email === acc.email ? "primary.main" : "rgba(255, 255, 255, 0.08)",
                        backgroundColor: selectedProfile.email === acc.email ? "rgba(16, 185, 129, 0.08)" : "rgba(13, 19, 34, 0.5)",
                        borderRadius: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 1,
                        minWidth: 0,
                        flexShrink: 0,
                        transition: "all 0.2s",
                        "&:hover": {
                          borderColor: "primary.main",
                          backgroundColor: "rgba(16, 185, 129, 0.12)",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
                        <Avatar src={acc.avatarUrl} sx={{ width: 32, height: 32, flexShrink: 0 }} />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{
                              fontWeight: 700,
                              color: "#ffffff",
                              fontSize: { xs: "0.82rem", sm: "0.875rem" },
                            }}
                          >
                            {acc.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            noWrap
                            sx={{
                              color: "text.secondary",
                              fontFamily: "monospace",
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                              display: "block",
                            }}
                          >
                            {acc.email} • {acc.plan}
                          </Typography>
                        </Box>
                      </Box>
                      {selectedProfile.email === acc.email && (
                        <CheckCircleIcon sx={{ color: "primary.main", fontSize: 20, flexShrink: 0 }} />
                      )}
                    </Paper>
                  ))}

                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setUseCustom(true)}
                    sx={{ color: "primary.main", fontSize: "0.78rem", alignSelf: "flex-start", mt: 0.5 }}
                  >
                    + Enter custom Google account credentials
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Account Alias"
                    placeholder="e.g. Work Antigravity Core"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Google Email Address"
                    placeholder="developer@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                  />
                  <FormControl fullWidth size="small">
                    <InputLabel>Plan Tier</InputLabel>
                    <Select
                      value={customPlan}
                      label="Plan Tier"
                      onChange={(e) => setCustomPlan(e.target.value as AntigravityPlan)}
                    >
                      <MenuItem value="Google AI Pro">Google AI Pro</MenuItem>
                      <MenuItem value="Google AI Ultra">Google AI Ultra</MenuItem>
                      <MenuItem value="Google AI Free">Google AI Free Tier</MenuItem>
                      <MenuItem value="Enterprise">Enterprise</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setUseCustom(false)}
                    sx={{ color: "text.secondary", fontSize: "0.75rem", alignSelf: "flex-start" }}
                  >
                    ← Back to suggested accounts
                  </Button>
                </Box>
              )}
            </Paper>

            {/* Container Sandbox Notice */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.25, sm: 1.5 },
                border: "1px solid rgba(255, 255, 255, 0.06)",
                backgroundColor: "rgba(9, 13, 22, 0.5)",
                borderRadius: 2,
                display: "flex",
                gap: 1.25,
                alignItems: "center",
              }}
            >
              <DnsIcon sx={{ color: "primary.main", fontSize: 20, flexShrink: 0 }} />
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                This session will be sandboxed in an isolated container to prevent local OAuth token collisions.
              </Typography>
            </Paper>
          </Box>
        )}

        {step === "provisioning" && (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <CircularProgress size={52} sx={{ color: "primary.main", mb: 2 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#ffffff" }}>
              Provisioning Docker Sandbox...
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace", display: "block", my: 2 }}>
              {provisionLog}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={provisionProgress}
              sx={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
            />
          </Box>
        )}

        {step === "success" && (
          <Box sx={{ py: 3, textAlign: "center" }}>
            <Avatar sx={{ bgcolor: "rgba(16, 185, 129, 0.15)", color: "primary.main", width: 56, height: 56, mx: "auto", mb: 2 }}>
              <CheckCircleIcon sx={{ fontSize: 32 }} />
            </Avatar>

            <Typography variant="h6" sx={{ fontWeight: 800, color: "#ffffff", fontSize: "1.1rem" }}>
              Account Successfully Paired!
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2.5 }}>
              Container node is active and Gemini & Claude/GPT quota tiers are aggregated into the pool.
            </Typography>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                backgroundColor: "rgba(9, 13, 22, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 2,
                textAlign: "left",
                fontFamily: "monospace",
                fontSize: "0.75rem",
              }}
            >
              <Box sx={{ color: "primary.main" }}>✓ Container: gravwatch-acc-0{accounts.length}</Box>
              <Box sx={{ color: "text.secondary" }}>✓ Memory Cap: 256MB RAM / 0.25 vCPU</Box>
              <Box sx={{ color: "text.secondary" }}>✓ Telemetry Stream: Connected (FastAPI Hub)</Box>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 1.75 }, gap: 1.25, borderTop: "1px solid rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(9, 13, 22, 0.95)" }}>
        {step === "select_account" && (
          <>
            <Button variant="outlined" size="small" onClick={handleClose} sx={{ borderColor: "rgba(255, 255, 255, 0.15)", color: "#cbd5e1" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleStartPairing}
              sx={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#ffffff", fontWeight: 700 }}
            >
              Authorize & Pair
            </Button>
          </>
        )}
        {step === "success" && (
          <Button
            variant="contained"
            size="small"
            fullWidth
            onClick={handleClose}
            sx={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#ffffff", fontWeight: 700 }}
          >
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
