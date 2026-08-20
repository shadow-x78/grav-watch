import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { GravWatchProvider } from "@/context/GravWatchContext";

export const metadata: Metadata = {
  title: "GravWatch - Google Antigravity Telemetry Hub",
  description:
    "Real-time multi-account Google Antigravity CLI quota monitoring & telemetry aggregation engine.",
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
            <GravWatchProvider>
              {children}
            </GravWatchProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
