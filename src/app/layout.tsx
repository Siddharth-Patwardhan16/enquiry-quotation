import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "../trpc/provider";
import { SessionProvider } from "../components/providers/SessionProvider";
import { AuthProvider } from "../components/providers/AuthProvider";
import { SupabaseProvider } from "../components/providers/supabase-provider";
import { UserSyncProvider } from "../components/providers/UserSyncProvider";
import { ToastProvider } from "../components/providers/ToastProvider";
import { PerformanceProvider } from "../components/providers/PerformanceProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Suspense } from "react";
import { NavigationSkeleton } from "../components/ui/loading-skeleton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM Portal - Enquiry & Quotations",
  description: "Customer Relationship Management Portal for handling enquiries and quotations",
  keywords: ["CRM", "enquiry", "quotations", "customer management"],
  authors: [{ name: "CRM Portal Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense fallback={<NavigationSkeleton />}>
          <PerformanceProvider>
            <TRPCProvider>
              <SupabaseProvider>
                <UserSyncProvider>
                  <SessionProvider>
                    <AuthProvider>
                      <ToastProvider>
                        {children}
                      </ToastProvider>
                    </AuthProvider>
                  </SessionProvider>
                </UserSyncProvider>
              </SupabaseProvider>
            </TRPCProvider>
          </PerformanceProvider>
        </Suspense>
        <SpeedInsights />
      </body>
    </html>
  );
}
