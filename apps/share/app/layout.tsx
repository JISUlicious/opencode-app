import "../styles/globals.css";

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import type { ReactNode } from "react";
import { BotIdClient } from "botid/client";

import { DEFAULT_PUBLIC_BASE_URL } from "../server/_lib/share-utils.ts";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono"
});

export const metadata: Metadata = {
  metadataBase: new URL(DEFAULT_PUBLIC_BASE_URL),
  title: {
    default: "WorkspaceAgent Share",
    template: "%s - WorkspaceAgent Share"
  },
  description: "Publish WorkspaceAgent worker packages and shareable import links.",
  icons: { icon: "/openwork-mark.svg" },
  openGraph: {
    type: "website",
    siteName: "WorkspaceAgent Share",
  },
  twitter: {
    card: "summary_large_image",
    site: "@workspaceagent",
  },
};

// Analytics removed — WorkspaceAgent is privacy-first

const protectedRoutes = [
  { path: "/v1/package", method: "POST" as const },
  { path: "/v1/bundles", method: "POST" as const },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <BotIdClient protect={protectedRoutes} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
