import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

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
        <Sidebar />
        <main className="lg:pl-64 min-h-screen pb-20 lg:pb-0">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
