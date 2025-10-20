import type { Metadata } from "next";
import {
  Space_Grotesk,
  Inter,
  JetBrains_Mono,
  PT_Serif,
} from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import TanstackQueryProvider from "@/providers/tanstack-query-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { cn, getPublicUrl } from "@/lib/utils";
import { companyConfig, createPageMetadata } from "@/lib/brand";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const defaultUrl = getPublicUrl();

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  ...createPageMetadata("home"),
  appleWebApp: {
    title: companyConfig.name,
    statusBarStyle: "black-translucent",
  },
};

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const ptSerif = PT_Serif({
  variable: "--font-serif",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  display: "swap",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-grotesk",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          ptSerif.variable,
          jetBrainsMono.variable,
          inter.variable,
          spaceGrotesk.variable,
          "antialiased"
        )}
      >
        <TanstackQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1 py-8 sm:py-12 md:py-16">{children}</main>
              <Footer />
            </div>
            <Toaster richColors />
          </ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </TanstackQueryProvider>
      </body>
    </html>
  );
}
