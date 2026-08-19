"use client";

import React, { useState, useEffect } from "react";
import { useGravWatch } from "@/context/GravWatchContext";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Avatar from "@mui/material/Avatar";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import TerminalIcon from "@mui/icons-material/Terminal";
import ErrorIcon from "@mui/icons-material/Error";
import { formatRelativeTime, formatTokens } from "@/lib/utils";

export const LiveActivityFeed: React.FC = () => {
  const { events, isLiveStreaming } = useGravWatch();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  return (
    <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(13, 19, 34, 0.75)" }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {isLiveStreaming ? (
              <RadioButtonCheckedIcon sx={{ fontSize: 16, color: "primary.main", animation: "pulse 1.5s infinite" }} />
            ) : (
              <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            )}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#ffffff", fontSize: { xs: "0.9rem", sm: "1rem" } }}>
              Live Antigravity Telemetry Stream
            </Typography>
          </Box>
        }
        subheader={
          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
            Real-time agy command executions and quota drains across isolated Docker nodes
          </Typography>
        }
        action={
          <Chip
            label={`${events.length} Packets`}
            size="small"
            variant="outlined"
            sx={{ fontSize: "0.65rem", fontFamily: "monospace", borderColor: "rgba(255, 255, 255, 0.12)", display: { xs: "none", sm: "inline-flex" } }}
          />
        }
        sx={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)", pb: 1.5 }}
      />

      <CardContent sx={{ p: { xs: 1.5, sm: 2.5 }, "&:last-child": { pb: { xs: 2, sm: 2.5 } }, width: "100%", boxSizing: "border-box" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.25,
            maxHeight: 380,
            overflowY: "auto",
            overflowX: "hidden",
            width: "100%",
            boxSizing: "border-box",
            pr: 0.5,
            pb: 1.5,
          }}
        >
          {events.map((evt) => {
            const isError = evt.status === "rate_limit" || evt.status === "fail";
            return (
              <Paper
                key={evt.id}
                elevation={0}
                sx={{
                  p: { xs: 1.25, sm: 1.75 },
                  borderRadius: 2.5,
                  border: "1px solid",
                  borderColor: isError ? "rgba(244, 63, 94, 0.25)" : "rgba(255, 255, 255, 0.06)",
                  backgroundColor: isError ? "rgba(244, 63, 94, 0.05)" : "rgba(9, 13, 22, 0.6)",
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  justifyContent: "space-between",
                  alignItems: { xs: "stretch", sm: "center" },
                  gap: { xs: 1, sm: 2 },
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                  flexShrink: 0,
                  boxSizing: "border-box",
                  transition: "background-color 0.2s, border-color 0.2s",
                  "&:hover": {
                    backgroundColor: isError ? "rgba(244, 63, 94, 0.08)" : "rgba(9, 13, 22, 0.85)",
                    borderColor: isError ? "rgba(244, 63, 94, 0.4)" : "rgba(255, 255, 255, 0.12)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flex: 1, overflow: "hidden" }}>
                  <Avatar
                    sx={{
                      width: 34,
                      height: 34,
                      flexShrink: 0,
                      bgcolor: isError ? "rgba(244, 63, 94, 0.15)" : "rgba(16, 185, 129, 0.12)",
                      color: isError ? "error.main" : "primary.main",
                    }}
                  >
                    {isError ? <ErrorIcon sx={{ fontSize: 18 }} /> : <TerminalIcon sx={{ fontSize: 18 }} />}
                  </Avatar>

                  <Box sx={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#ffffff", fontSize: { xs: "0.8rem", sm: "0.875rem" } }} noWrap>
                        {evt.accountAlias}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace", display: { xs: "none", sm: "inline" }, fontSize: "0.72rem" }}>
                        ({evt.accountId})
                      </Typography>
                      <Chip
                        label={evt.specificModel}
                        size="small"
                        color={isError ? "error" : "secondary"}
                        sx={{ height: 20, fontSize: "0.65rem", fontFamily: "monospace", fontWeight: 600 }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#94a3b8",
                        fontFamily: "monospace",
                        display: "block",
                        fontSize: { xs: "0.7rem", sm: "0.75rem" },
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "100%",
                      }}
                    >
                      {evt.promptSnippet}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "row", sm: "column" },
                    justifyContent: { xs: "space-between", sm: "center" },
                    alignItems: { xs: "center", sm: "flex-end" },
                    flexShrink: 0,
                    fontFamily: "monospace",
                    pt: { xs: 0.75, sm: 0 },
                    pl: { xs: 0, sm: 2 },
                    borderTop: { xs: "1px solid rgba(255, 255, 255, 0.04)", sm: "none" },
                    minWidth: { xs: "auto", sm: 110 },
                    textAlign: { xs: "left", sm: "right" },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 800, color: isError ? "error.main" : "primary.main", fontSize: { xs: "0.78rem", sm: "0.85rem" } }}>
                    {evt.tokensUsed > 0 ? `-${formatTokens(evt.tokensUsed)} tok` : "429 Limit"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: { xs: "0.68rem", sm: "0.72rem" }, display: "block" }}>
                    {isMounted ? `${formatRelativeTime(evt.timestamp, "en")} • ${evt.latencyMs}ms` : `${evt.latencyMs}ms`}
                  </Typography>
                </Box>
              </Paper>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};
