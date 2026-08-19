"use client";

import React, { useState } from "react";
import { useGravWatch } from "@/context/GravWatchContext";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import BoltIcon from "@mui/icons-material/Bolt";
import TerminalIcon from "@mui/icons-material/Terminal";
import DnsIcon from "@mui/icons-material/Dns";
import { formatTokens } from "@/lib/utils";

export const PromptSimulator: React.FC = () => {
  const { executePromptSimulation, pooledTelemetry } = useGravWatch();

  const [modelGroup, setModelGroup] = useState<"Gemini Models" | "Claude & GPT Models">("Gemini Models");
  const [specificModel, setSpecificModel] = useState("gemini-3.7-flash-high");
  const [strategy, setStrategy] = useState<"least" | "round">("least");
  const [prompt, setPrompt] = useState("Explain how GravWatch load balances Google Antigravity quotas in 2 sentences.");
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    accountAlias: string;
    tokensUsed: number;
    response?: string;
    timestamp: string;
  } | null>(null);

  const presets = [
    {
      title: "Model Identification",
      group: "Gemini Models" as const,
      model: "gemini-3.7-flash-high",
      prompt: "What model are you and who built you?",
    },
    {
      title: "Architecture Analysis",
      group: "Gemini Models" as const,
      model: "gemini-3.1-pro-high",
      prompt: "Explain how multi-account quota monitoring works in 2 sentences.",
    },
    {
      title: "Claude Reasoning",
      group: "Claude & GPT Models" as const,
      model: "claude-sonnet-4-6",
      prompt: "Write 1 line of poetry about the night sky.",
    },
  ];

  const handleExecute = async () => {
    if (!prompt.trim()) return;
    setIsExecuting(true);
    setLastResult(null);

    try {
      const result = await executePromptSimulation(modelGroup, specificModel, prompt.trim(), strategy);
      setLastResult({
        ...result,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      setLastResult({
        success: false,
        accountAlias: "acc-1",
        tokensUsed: 0,
        response: `Error: ${err.message || err}`,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PlayArrowIcon sx={{ fontSize: 28, color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#ffffff" }}>
            Antigravity CLI Live Prompt Execution
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
          Execute real prompts against Google Gemini via the official Antigravity CLI container and observe live token drain.
        </Typography>
      </Box>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(13, 19, 34, 0.75)" }}>
            <CardHeader
              title={<Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#ffffff" }}>Configure Live Request</Typography>}
              subheader={<Typography variant="caption" sx={{ color: "text.secondary" }}>Target official agy CLI binary with live Google Gemini session</Typography>}
              sx={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)", pb: 1.5 }}
            />

            <CardContent sx={{ p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", mb: 1, display: "block" }}>
                  Quick Presets:
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {presets.map((p, idx) => (
                    <Chip
                      key={idx}
                      label={`⚡ ${p.title}`}
                      onClick={() => {
                        setPrompt(p.prompt);
                        setModelGroup(p.group);
                        setSpecificModel(p.model);
                      }}
                      variant="outlined"
                      sx={{
                        fontSize: { xs: "0.68rem", sm: "0.72rem" },
                        fontFamily: "monospace",
                        borderColor: "rgba(255, 255, 255, 0.12)",
                        "&:hover": { borderColor: "primary.main", color: "primary.main" },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: "0.85rem" }}>Antigravity Model Category</InputLabel>
                  <Select
                    value={modelGroup}
                    label="Antigravity Model Category"
                    onChange={(e) => {
                      const grp = e.target.value as "Gemini Models" | "Claude & GPT Models";
                      setModelGroup(grp);
                      setSpecificModel(grp === "Gemini Models" ? "gemini-3.7-flash-high" : "claude-sonnet-4-6");
                    }}
                    sx={{ backgroundColor: "rgba(9, 13, 22, 0.7)", borderRadius: 2, fontSize: "0.8rem" }}
                  >
                    <MenuItem value="Gemini Models">Gemini Models (Flash / Pro)</MenuItem>
                    <MenuItem value="Claude & GPT Models">Claude & GPT Models</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: "0.85rem" }}>Specific Model (agy CLI)</InputLabel>
                  <Select
                    value={specificModel}
                    label="Specific Model (agy CLI)"
                    onChange={(e) => setSpecificModel(e.target.value)}
                    sx={{ backgroundColor: "rgba(9, 13, 22, 0.7)", borderRadius: 2, fontSize: "0.8rem", fontFamily: "monospace" }}
                  >
                    {modelGroup === "Gemini Models" ? [
                      <MenuItem key="gemini-3.7-flash-high" value="gemini-3.7-flash-high">gemini-3.7-flash-high (Gemini 3.7 Flash)</MenuItem>,
                      <MenuItem key="gemini-3.7-flash-medium" value="gemini-3.7-flash-medium">gemini-3.7-flash-medium</MenuItem>,
                      <MenuItem key="gemini-3.1-pro-high" value="gemini-3.1-pro-high">gemini-3.1-pro-high (Gemini 3.1 Pro)</MenuItem>,
                      <MenuItem key="gemini-3.5-flash-high" value="gemini-3.5-flash-high">gemini-3.5-flash-high</MenuItem>,
                    ] : [
                      <MenuItem key="claude-sonnet-4-6" value="claude-sonnet-4-6">claude-sonnet-4-6 (Claude Sonnet 4.6)</MenuItem>,
                      <MenuItem key="claude-opus-4-6-thinking" value="claude-opus-4-6-thinking">claude-opus-4-6-thinking (Claude Opus 4.6)</MenuItem>,
                      <MenuItem key="gpt-oss-120b-medium" value="gpt-oss-120b-medium">gpt-oss-120b-medium (GPT-OSS 120B)</MenuItem>,
                    ]}
                  </Select>
                </FormControl>
              </div>

              <TextField
                fullWidth
                multiline
                rows={3.5}
                label="Live Command or Prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "rgba(9, 13, 22, 0.7)",
                    borderRadius: 2,
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                  },
                }}
              />

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleExecute}
                disabled={isExecuting}
                startIcon={isExecuting ? <CircularProgress size={18} color="inherit" /> : <BoltIcon />}
                sx={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  fontWeight: 800,
                  py: 1.2,
                  fontSize: { xs: "0.82rem", sm: "0.9rem" },
                }}
              >
                {isExecuting ? "Executing live in Google Antigravity..." : "Execute Live via agy CLI"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(13, 19, 34, 0.75)" }}>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TerminalIcon sx={{ fontSize: 18, color: "primary.main" }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#ffffff" }}>Live CLI Response</Typography>
                </Box>
              }
              sx={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)", pb: 1.5 }}
            />

            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              {lastResult ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Alert
                    severity={lastResult.success ? "success" : "error"}
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      backgroundColor: lastResult.success ? "rgba(16, 185, 129, 0.08)" : "rgba(244, 63, 94, 0.08)",
                      borderColor: lastResult.success ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)",
                      p: { xs: 1.25, sm: 2 },
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                        {lastResult.success ? "Executed Successfully" : "Execution Failed"}
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", opacity: 0.8, fontSize: "0.68rem" }}>
                        {lastResult.timestamp}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, fontFamily: "monospace", fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                        <span style={{ opacity: 0.7 }}>Executed On:</span>
                        <strong style={{ color: "#10b981" }}>{lastResult.accountAlias}</strong>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                        <span style={{ opacity: 0.7 }}>Tokens:</span>
                        <strong style={{ color: "#f59e0b" }}>~{formatTokens(lastResult.tokensUsed)}</strong>
                      </Box>
                    </Box>

                    {lastResult.response && (
                      <Box
                        sx={{
                          mt: 1.5,
                          p: 1.5,
                          bgcolor: "#0b0e14",
                          borderRadius: 1.5,
                          border: "1px solid #21262d",
                          fontFamily: "monospace",
                          fontSize: "12.5px",
                          color: "#e4e6eb",
                          whiteSpace: "pre-wrap",
                          maxHeight: 250,
                          overflowY: "auto",
                        }}
                      >
                        {lastResult.response}
                      </Box>
                    )}
                  </Alert>
                </Box>
              ) : (
                <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
                  <DnsIcon sx={{ fontSize: 36, opacity: 0.4, mb: 1 }} />
                  <Typography variant="caption" sx={{ display: "block", fontFamily: "monospace" }}>
                    Click Execute to run a real query on Google Antigravity
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              backgroundColor: "rgba(9, 13, 22, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 2.5,
              fontFamily: "monospace",
              fontSize: "0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", color: "text.secondary", letterSpacing: "0.05em" }}>
              Antigravity Node Pool
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted-foreground)" }}>Active Nodes:</span>
              <strong style={{ color: "#10b981" }}>{pooledTelemetry.activeContainers} / {pooledTelemetry.totalAccounts}</strong>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted-foreground)" }}>Pool Status:</span>
              <strong style={{ color: "#06b6d4" }}>{pooledTelemetry.activeContainers > 0 ? "Online" : "No Active Nodes"}</strong>
            </Box>
          </Paper>
        </div>
      </div>
    </Box>
  );
};
