import type { Metadata } from "next";
import localFont from "next/font/local";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const lineSeed = localFont({
  src: [
    {
      path: '../fonts/LINESeedSansTH_Rg.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/LINESeedSansTH_Bd.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-line-seed',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "HostPanel — Premium Hosting Control Panel",
  description: "Self-hosted VPS Control Panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lineSeed.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <SidebarProvider>
              <AppSidebar />
              <main className="flex-1 overflow-auto flex flex-col">
                <header className="h-16 flex items-center justify-between border-b px-4">
                  <div className="flex items-center gap-2">
                    <SidebarTrigger />
                  </div>
                  <ThemeToggle />
                </header>
                <div className="flex-1 p-6">
                  {children}
                </div>
              </main>
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
