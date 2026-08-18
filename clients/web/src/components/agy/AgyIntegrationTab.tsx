"use client";

import React, { useState } from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import TerminalIcon from "@mui/icons-material/Terminal";
import DnsIcon from "@mui/icons-material/Dns";
import LayersIcon from "@mui/icons-material/Layers";
import MemoryIcon from "@mui/icons-material/Memory";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

// ============================================================================
// TODO: [BACKEND INTEGRATION] - agy CLI & Docker Cluster Integration Guide
//
// 1. Static Configuration Guides (all currently hardcoded):
//    - `setup-auth.sh`: Interactive Bash shell provisioning snippet — script content should be served dynamically.
//    - `docker-compose.yml`: Static Docker orchestration template for sandboxed nodes & FastAPI Hub.
//    - `FastAPI Telemetry Polling`: Reference client snippet for polling `GET /api/v1/usage/latest`.
//
// 2. Required Backend Endpoints:
//    - `GET  /api/v1/system/config`:
//         Returns host IP, port numbers, container volume base path, and active node count.
//         The snippet placeholders (e.g. `HOST_PORT`, `N_CONTAINERS`) should be dynamically replaced from this response.
//    - `POST /api/v1/system/generate-compose`:
//         Dynamically generates a tailored docker-compose.yml with exactly N services based on registered accounts.
//         Request: { "account_ids": ["acc-01", "acc-02"], "memory_limit": "256m", "port_base": 8100 }
//         Response: { "compose_yaml": "version: '3.9'\nservices: ..." }
//    - `GET  /api/v1/system/script/setup-auth`:
//         Serves the latest version of `setup-auth.sh` with the correct CONTAINER_NAME and VOLUME_PATH injected.
//
// 3. Purpose / Why Needed:
//    - Guides developers in setting up their local IDE to route `agy` invocations through GravWatch's load-balanced reverse proxy.
//
// 4. Edge Cases:
//    - [ ] Version Drift: Display the current agy CLI version from `GET /api/v1/system/config` to avoid stale snippet instructions.
//    - [ ] Port Conflicts: Validate that ports 8000 and 8100-8105 are free before generating compose file.
//    - [ ] Volume Path Permissions: Warn if `./data/` base directory does not exist or is not writable.
// ============================================================================

export const AgyIntegrationTab: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const codeSnippets = [
    {
      title: "1. Pair Google Account (Interactive OAuth Shell)",
      desc: "Run interactive setup-auth.sh to mount a fresh Google OAuth session into an isolated container directory without host token contamination.",
      code: `./scripts/setup-auth.sh
# Spawns a lightweight debian:bookworm-slim container
# Mounts ./data/acc-0X:/root/.gemini/
# Prompts for Google Device Code or OAuth URL
# Generates authenticated Antigravity credentials into isolated volume`,
    },
    {
      title: "2. Antigravity CLI Multi-Model Execution",
      desc: "Route agy CLI calls with specific reasoning models through GravWatch balanced sandboxes.",
      code: `# List available Antigravity models inside container:
agy models

# Run fast reasoning with Gemini 3.6 Flash:
agy -p "Recursive file analysis and codebase indexing" --model "Gemini 3.6 Flash (High)"

# Run heavy architecture reasoning with Claude Sonnet 4.6 Thinking:
agy -p "Deep architectural refactoring pass" --model "Claude Sonnet 4.6 (Thinking)"`,
    },
    {
      title: "3. GravWatch Docker Daemon Architecture",
      desc: "Isolated containers with resource caps (256MB RAM / 0.25 vCPU) and telemetry pipes.",
      code: `version: '3.8'
services:
  gravwatch-hub:
    image: python:3.11-slim
    ports:
      - "8000:8000"
    volumes:
      - ./data:/data
    command: uvicorn hub.main:app --host 0.0.0.0 --port 8000

  gravwatch-acc-01:
    image: debian:bookworm-slim
    deploy:
      resources:
        limits:
          cpus: '0.25'
          memory: 256M
    volumes:
      - ./data/acc-01:/root/.gemini`,
    },
    {
      title: "4. FastAPI Real-time Telemetry Polling (Python SDK)",
      desc: "Fetch aggregated twin-tier quotas (Gemini & Claude/GPT) programmatically via FastAPI.",
      code: `import requests

res = requests.get("http://localhost:8000/api/v1/usage/latest")
telemetry = res.json()

print(f"Pooled Gemini 5h Quota: {telemetry['gemini_5h_pooled_percent']}%")
print(f"Pooled Claude/GPT 5h Quota: {telemetry['claude_gpt_5h_pooled_percent']}%")
print(f"Active Containers: {telemetry['active_sandboxes']}")`,
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TerminalIcon sx={{ fontSize: 26, color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#ffffff" }}>
            Google Antigravity (`agy`) CLI & Docker Architecture
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
          Technical specifications, container orchestration patterns, and integration snippets for GravWatch
        </Typography>
      </Box>

      {/* Architecture Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card sx={{ p: 2.5, border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(13, 19, 34, 0.75)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main", fontWeight: 700, mb: 1 }}>
            <DnsIcon sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Isolated Sandboxes</Typography>
          </Box>
          <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.5, display: "block" }}>
            Each Google account runs inside an isolated <code>debian:bookworm-slim</code> container capped at 256MB RAM to prevent token collisions.
          </Typography>
        </Card>

        <Card sx={{ p: 2.5, border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(13, 19, 34, 0.75)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "secondary.main", fontWeight: 700, mb: 1 }}>
            <LayersIcon sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Twin-Tier Quotas</Typography>
          </Box>
          <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.5, display: "block" }}>
            Every Google account tracks <strong>Gemini Models (Flash/Pro)</strong> and <strong>Claude & GPT models (Sonnet/Opus 4.6)</strong> across 5-Hour and Weekly limits.
          </Typography>
        </Card>

        <Card sx={{ p: 2.5, border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(13, 19, 34, 0.75)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "warning.main", fontWeight: 700, mb: 1 }}>
            <MemoryIcon sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>FastAPI Real-time Hub</Typography>
          </Box>
          <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.5, display: "block" }}>
            Continuous background telemetry daemon scrapes internal SQLite / state stores and streams live JSON metrics to GravWatch UI.
          </Typography>
        </Card>
      </div>

      {/* Code Snippets */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {codeSnippets.map((snippet, idx) => (
          <Card key={idx} sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(13, 19, 34, 0.75)", overflow: "hidden" }}>
            <CardHeader
              title={<Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#ffffff", fontSize: { xs: "0.85rem", sm: "0.95rem" } }}>{snippet.title}</Typography>}
              subheader={<Typography variant="caption" sx={{ color: "text.secondary", fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>{snippet.desc}</Typography>}
              action={
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={copiedIndex === idx ? <CheckIcon sx={{ color: "primary.main", fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 15 }} />}
                  onClick={() => copyToClipboard(snippet.code, idx)}
                  sx={{
                    borderColor: "rgba(255, 255, 255, 0.12)",
                    color: copiedIndex === idx ? "primary.main" : "text.secondary",
                    fontSize: "0.72rem",
                    "&:hover": { borderColor: "primary.main", color: "primary.main" },
                  }}
                >
                  {copiedIndex === idx ? "Copied" : "Copy"}
                </Button>
              }
              sx={{
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                pb: 1.5,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "center" },
                gap: { xs: 1.25, sm: 0 },
                "& .MuiCardHeader-content": { minWidth: 0, flex: 1 },
                "& .MuiCardHeader-action": { m: 0, alignSelf: { xs: "flex-end", sm: "auto" } },
              }}
            />

            <CardContent sx={{ p: { xs: 1.75, sm: 2.5 }, backgroundColor: "rgba(9, 13, 22, 0.9)", overflowX: "auto" }}>
              <pre style={{ margin: 0, fontFamily: "JetBrains Mono, monospace", fontSize: "0.75rem", color: "#cbd5e1", lineHeight: 1.6, whiteSpace: "pre" }}>
                <code>{snippet.code}</code>
              </pre>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};
