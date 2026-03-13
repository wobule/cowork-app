import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/top-bar";

export const metadata: Metadata = {
  title: "Mission Control",
  description: "Your personal mission control dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="dark">
      <body className="antialiased">
        <div className="flex h-screen overflow-hidden relative z-10">
          <Sidebar />
          <div className="w-5 flex-shrink-0" />
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
