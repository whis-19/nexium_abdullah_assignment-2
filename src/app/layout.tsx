import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blog Summarizer",
  description: "AI-powered blog summarizer with Urdu translation, sentiment, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* Gradient Bar Header */}
        <div style={{
          width: "100%",
          height: 64,
          background: "linear-gradient(90deg, #3b82f6 0%, #7c3aed 100%)",
          display: "flex",
          alignItems: "center",
          padding: "0 0 0 2rem",
          boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)",
        }}>
          <Image src="/next.svg" alt="Logo" width={36} height={36} style={{ marginRight: 16 }} />
          <span style={{ fontWeight: 700, fontSize: 26, letterSpacing: 1, color: "#fff" }}>Blog Summarizer</span>
        </div>
        <Toaster />
        {children}
      </body>
    </html>
  );
}
