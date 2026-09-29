import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Financial Crime Scene · DPI-HT-01",
  description: "Evidence-led financial reconstruction of Divorce Party International Ltd. at 31 August 2026.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
