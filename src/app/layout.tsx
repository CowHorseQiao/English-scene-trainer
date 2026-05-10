import type { Metadata } from "next";
import "./globals.css";
import { AppNav } from "@/components/layout/app-nav";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

export const metadata: Metadata = {
  title: "English Scene Trainer",
  description: "个人英语场景语料训练系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AppNav />
        <div className="mx-auto max-w-6xl px-4 py-4 pb-16 sm:py-6 sm:pb-6">{children}</div>
        <MobileBottomNav />
      </body>
    </html>
  );
}