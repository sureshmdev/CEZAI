import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "@/components/ui/sonner";
import type { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CEZAI",
  description: "Personalized Career and Skills Advisor",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" suppressHydrationWarning>
        {/* <head>
          <link rel="icon" href="/cezai-logo-light.png" sizes="any" />
        </head> */}
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {/* Root wrapper with header height variable */}
            <div className="[--header-height:calc(--spacing(14))]">
              <SidebarProvider className="flex flex-col">
                {/* Header */}
                <SiteHeader />

                {/* Sidebar + Main Content */}
                <div className="flex flex-1">
                  {/* Sidebar */}
                  <AppSidebar />

                  {/* Main content */}
                  <SidebarInset>
                    <main className="min-h-screen">{children}</main>
                  </SidebarInset>
                </div>
              </SidebarProvider>
            </div>

            <Toaster richColors />

            {/* Footer */}
            <footer className="bg-muted/50 py-6">
              <div className="container mx-auto px-4 text-center text-gray-200 space-y-2">
                <p className="text-sm">
                  &copy; {new Date().getFullYear()} CEZAI. All rights reserved.
                </p>
              </div>
            </footer>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
