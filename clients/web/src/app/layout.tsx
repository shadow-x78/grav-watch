// ─────────────────────────────────────────────
// GravWatch - Root Application Layout
// https://github.com/shadow-x78/grav-watch
// ─────────────────────────────────────────────

import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { GravWatchProviders } from "@/context";

export const metadata: Metadata = {
  title: "GravWatch",
  description: "Multi-account Google Antigravity CLI quota monitor.",
  icons: {
    icon: [
      { url: "/gravwatch.svg", type: "image/svg+xml" },
    ],
    shortcut: "/gravwatch.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className="dark">
      <head>
        <link rel="icon" href="/gravwatch.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen bg-[#060911] font-sans antialiased text-slate-100 selection:bg-[#4285f4]/30 selection:text-white">
        <LanguageProvider>
          <ThemeProvider>
            <GravWatchProviders>
              {children}
            </GravWatchProviders>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}