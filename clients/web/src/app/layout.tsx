import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { MuiAppThemeProvider } from "@/context/MuiThemeProvider";
import { GravWatchProvider } from "@/context/GravWatchContext";

export const metadata: Metadata = {
  title: "GravWatch - Multi-Account Antigravity Telemetry Hub",
  description:
    "Real-time multi-account Google Antigravity CLI quota monitoring & telemetry aggregation engine.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className="dark">
      <body className="min-h-screen bg-dark-950 font-sans antialiased text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
        <LanguageProvider>
          <ThemeProvider>
            <MuiAppThemeProvider>
              <GravWatchProvider>
                {children}
              </GravWatchProvider>
            </MuiAppThemeProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
