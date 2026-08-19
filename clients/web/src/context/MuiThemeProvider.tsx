"use client";

import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useTheme } from "./ThemeContext";

export const MuiAppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();

  const isDark = theme === "dark";

  const muiTheme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDark ? "dark" : "light",
          primary: {
            main: "#10b981",
            light: "#34d399",
            dark: "#059669",
            contrastText: "#ffffff",
          },
          secondary: {
            main: "#06b6d4",
            light: "#22d3ee",
            dark: "#0891b2",
            contrastText: "#ffffff",
          },
          error: {
            main: "#f43f5e",
            light: "#fb7185",
            dark: "#e11d48",
          },
          warning: {
            main: "#f59e0b",
            light: "#fbbf24",
            dark: "#d97706",
          },
          info: {
            main: "#3b82f6",
            light: "#60a5fa",
            dark: "#2563eb",
          },
          success: {
            main: "#22c55e",
            light: "#4ade80",
            dark: "#16a34a",
          },
          background: {
            default: isDark ? "#090d16" : "#f8fafc",
            paper: isDark ? "#0d1322" : "#ffffff",
          },
          text: {
            primary: isDark ? "#f8fafc" : "#0f172a",
            secondary: isDark ? "#94a3b8" : "#64748b",
          },
          divider: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
        },
        typography: {
          fontFamily: "'Inter', sans-serif",
          button: {
            textTransform: "none",
            fontWeight: 600,
          },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                boxShadow: "none",
                fontWeight: 600,
                "&:hover": {
                  boxShadow: "none",
                },
              },
              contained: {
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
                backgroundColor: isDark ? "rgba(13, 19, 34, 0.7)" : "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(16px)",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
                borderRadius: 16,
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                borderRadius: 18,
                backgroundColor: isDark ? "#0d1322" : "#ffffff",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.1)",
                backgroundImage: "none",
                margin: "12px",
                maxHeight: "calc(100% - 24px)",
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                fontWeight: 600,
                borderRadius: 8,
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)",
              },
            },
          },
        },
      }),
    [isDark]
  );

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};
