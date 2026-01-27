import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { MainContent } from "@/components/layout/MainContent";
import { MobileNav } from "@/components/layout/MobileNav";
import { ImportProvider } from "@/components/import/ImportContext";
import { ImportProgressPanel } from "@/components/import/ImportProgressModal";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Finanse Osobiste",
  description: "Aplikacja do zarządzania finansami osobistymi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${inter.variable} antialiased`}>
        <ImportProvider>
          <SidebarProvider>
            <Sidebar />
            <MainContent>{children}</MainContent>
            <MobileNav />
          </SidebarProvider>
          <ImportProgressPanel />
        </ImportProvider>
      </body>
    </html>
  );
}
