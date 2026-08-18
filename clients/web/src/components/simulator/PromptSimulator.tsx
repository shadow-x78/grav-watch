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
  const [specificModel, setSpecificModel] = useState("Gemini 3.6 Flash (High)");
  const [strategy, setStrategy] = useState<"least" | "round">("least");
  const [prompt, setPrompt] = useState(
    "Antigravity CLI workspace analysis with multi-account quota balancing..."
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    accountAlias: string;
    tokensUsed: number;
    timestamp: string;
  } | null>(null);

  const presets = [
    {
      title: "Workspace Indexing",
      group: "Gemini Models" as const,
      model: "Gemini 3.6 Flash (High)",
      prompt: "Recursive file analysis and codebase symbol table extraction...",
    },
    {
      title: "Reasoning Architecture",
      group: "Claude & GPT Models" as const,
      model: "Claude Sonnet 4.6 (Thinking)",
      prompt: "Deep architectural refactoring of isolated Docker container telemetry pipes...",
    },
    {
      title: "Formal Verification",
      group: "Gemini Models" as const,
      model: "Gemini 3.1 Pro (High)",
      prompt: "Formal mathematical verification of Antigravity pooled quota distribution...",
    },
    {
      title: "Heavy Benchmark Suite",
      group: "Claude & GPT Models" as const,
      model: "Claude Opus 4.6 (Thinking)",
      prompt: "Execute end-to-end evaluation suite across all subagents in parallel...",
    },
  ];

  // ==========================================================================
  // TODO: [BACKEND INTEGRATION] - agy CLI Subprocess Execution & Live Quota Balancing
  //
  // 1. Simulator Presets & Logic:
  //    - `presets`: Preset prompt templates for testing load balancing across Gemini and Claude tiers.
  //    - `executePromptSimulation`: In-memory sandbox selection and random token deduction.
  //
  // 2. Required Backend Endpoint & Payload:
  //    - `POST http://localhost:8000/api/v1/router/execute`
  //    - Request Payload:
  //      {
  //        "model_group": "Gemini Models" | "Claude & GPT Models",
  //        "specific_model": "Gemini 3.6 Flash (High)" | "Claude Sonnet 4.6 (Thinking)",
  //        "prompt": "Recursive file analysis and codebase symbol table extraction...",
  //        "strategy": "least" | "round", // "least" (Lowest 5-hour quota drain) | "round" (Round-robin)
  //        "stream": true
  //      }
  //
  // 3. Backend Execution Pipeline:
  //    - 1. Selection: Evaluates live quotas and picks the optimal container to avoid 429 quota exhaustion.
  //    - 2. Invocation: Runs `docker exec {container} agy -p "{prompt}" --model "{specificModel}"`.
  //    - 3. Streaming: Streams stdout/stderr chunks back to UI via SSE or WebSocket.
  //    - 4. Persistence: Parses consumed input/output tokens and commits usage event to database and Prometheus.
  //
  // 4. Edge Cases & Resilience Strategies:
  //    - [ ] Mid-Stream 429 Failover: If a node exhausts its rate limit mid-prompt, abort and auto-retry on fallback node.
  //    - [ ] Command Timeout: Enforce 120-second timeout on CLI executions to prevent dangling zombie processes.
  //    - [ ] All Nodes Depleted: Return HTTP 429 with payload detailing countdown until earliest 5-hour quota reset.
  // ==========================================================================
  const handleExecute = () => {
    if (!prompt) return;
    setIsExecuting(true);
    setLastResult(null);

    setTimeout(() => {
      const result = executePromptSimulation(modelGroup, specificModel, prompt, strategy);
      setLastResult({
        ...result,
        timestamp: new Date().toLocaleTimeString(),
      });
      setIsExecuting(false);
    }, 700);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PlayArrowIcon sx={{ fontSize: 28, color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#ffffff" }}>
            Antigravity CLI Prompt Router Simulator
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
          Send mock prompts to test how GravWatch automatically routes requests to the optimal Google account sandbox and drains quota in real time
        </Typography>
      </Box>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Prompt Editor & Config */}
        <div className="lg:col-span-2 space-y-4">
          <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(13, 19, 34, 0.75)" }}>
            <CardHeader
              title={<Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#ffffff" }}>Configure Mock Request</Typography>}
              subheader={<Typography variant="caption" sx={{ color: "text.secondary" }}>Select target Antigravity model group and load balancing algorithm</Typography>}
              sx={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)", pb: 1.5 }}
            />

            <CardContent sx={{ p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
              {/* Presets */}
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

              {/* Model Category & Specific Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: "0.85rem" }}>Antigravity Model Category</InputLabel>
                  <Select
                    value={modelGroup}
                    label="Antigravity Model Category"
                    onChange={(e) => {
                      const grp = e.target.value as "Gemini Models" | "Claude & GPT Models";
                      setModelGroup(grp);
                      setSpecificModel(
                        grp === "Gemini Models"
                          ? "Gemini 3.6 Flash (High)"
                          : "Claude Sonnet 4.6 (Thinking)"
                      );
                    }}
                    sx={{ backgroundColor: "rgba(9, 13, 22, 0.7)", borderRadius: 2, fontSize: "0.8rem" }}
                  >
                    <MenuItem value="Gemini Models">Gemini Models (Flash / Pro)</MenuItem>
                    <MenuItem value="Claude & GPT Models">Claude & GPT models (Sonnet / Opus / OSS)</MenuItem>
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
                    {modelGroup === "Gemini Models" ? (
                      [
                        <MenuItem key="1" value="Gemini 3.6 Flash (High)">Gemini 3.6 Flash (High)</MenuItem>,
                        <MenuItem key="2" value="Gemini 3.6 Flash (Medium)">Gemini 3.6 Flash (Medium)</MenuItem>,
                        <MenuItem key="3" value="Gemini 3.5 Flash (High)">Gemini 3.5 Flash (High)</MenuItem>,
                        <MenuItem key="4" value="Gemini 3.1 Pro (High)">Gemini 3.1 Pro (High)</MenuItem>,
                      ]
                    ) : (
                      [
                        <MenuItem key="5" value="Claude Sonnet 4.6 (Thinking)">Claude Sonnet 4.6 (Thinking)</MenuItem>,
                        <MenuItem key="6" value="Claude Opus 4.6 (Thinking)">Claude Opus 4.6 (Thinking)</MenuItem>,
                        <MenuItem key="7" value="GPT-OSS 120B (Medium)">GPT-OSS 120B (Medium)</MenuItem>,
                      ]
                    )}
                  </Select>
                </FormControl>
              </div>

              {/* Strategy */}
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: "0.85rem" }}>Routing Strategy (Load Balancer)</InputLabel>
                <Select
                  value={strategy}
                  label="Routing Strategy (Load Balancer)"
                  onChange={(e) => setStrategy(e.target.value as "least" | "round")}
                  sx={{ backgroundColor: "rgba(9, 13, 22, 0.7)", borderRadius: 2, fontSize: "0.8rem" }}
                >
                  <MenuItem value="least">Least Used 5-Hour Quota (Recommended)</MenuItem>
                  <MenuItem value="round">Round Robin (Even Distribution)</MenuItem>
                </Select>
              </FormControl>

              {/* Prompt Textarea */}
              <TextField
                fullWidth
                multiline
                rows={3.5}
                label="Command or Prompt"
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

              {/* Execute Button */}
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
                {isExecuting ? "Routing & Executing..." : "Execute & Drain Quota"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Routing Output */}
        <div className="space-y-4">
          <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(13, 19, 34, 0.75)" }}>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TerminalIcon sx={{ fontSize: 18, color: "primary.main" }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#ffffff" }}>Live Routing Output</Typography>
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
                        {lastResult.success ? "Routed & Executed" : "Routing Failed (Quota Depleted)"}
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", opacity: 0.8, fontSize: "0.68rem" }}>
                        {lastResult.timestamp}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, fontFamily: "monospace", fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                        <span style={{ opacity: 0.7 }}>Selected Node:</span>
                        <strong style={{ color: "#10b981" }}>{lastResult.accountAlias}</strong>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                        <span style={{ opacity: 0.7 }}>Model:</span>
                        <strong style={{ color: "#06b6d4" }}>{specificModel}</strong>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                        <span style={{ opacity: 0.7 }}>Tokens Drained:</span>
                        <strong style={{ color: "#f59e0b" }}>-{formatTokens(lastResult.tokensUsed)}</strong>
                      </Box>
                    </Box>
                  </Alert>

                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                    💡 Tokens were drained from the target container node's 5-hour quota and reflected live in all progress rings and charts.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
                  <DnsIcon sx={{ fontSize: 36, opacity: 0.4, mb: 1 }} />
                  <Typography variant="caption" sx={{ display: "block", fontFamily: "monospace" }}>
                    Click Execute to test load routing across accounts
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Quick Pool Status Mini Card */}
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
              Antigravity Pool Status
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted-foreground)" }}>Gemini 5-Hour Cap:</span>
              <strong style={{ color: "#06b6d4" }}>{pooledTelemetry.geminiFiveHourPooledPercent}%</strong>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted-foreground)" }}>Claude/GPT 5-Hour Cap:</span>
              <strong style={{ color: "#8b5cf6" }}>{pooledTelemetry.claudeGptFiveHourPooledPercent}%</strong>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted-foreground)" }}>Active Docker Nodes:</span>
              <strong style={{ color: "#10b981" }}>{pooledTelemetry.activeContainers} / {pooledTelemetry.totalAccounts}</strong>
            </Box>
          </Paper>
        </div>
      </div>
    </Box>
  );
};
