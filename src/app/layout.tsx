import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { Toaster } from "@/components/ui/sonner";
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
  title: "OX PANEL",
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
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
