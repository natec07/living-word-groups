import type { Metadata, Viewport } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { NativeThemeBridge } from "@/components/native/native-theme-bridge";
import { ServiceWorkerRegistration } from "@/components/native/service-worker-registration";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APP_NAME, APP_FULL_NAME } from "@/lib/constants";

// Poppins (Living Word's brand headline font, from living-word.net) is now
// reserved for opt-in promotional contexts (sermon artwork, event campaigns,
// ministry banners) via the `font-brand` utility — see globals.css. Everyday
// UI (nav, posts, forms, buttons) uses the platform's native system font
// (San Francisco on iOS/macOS), with Inter loaded as the cross-platform
// fallback for non-Apple browsers.
const fontHeading = Poppins({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const fontInter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: APP_FULL_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: `${APP_FULL_NAME} — grow in faith, build community, stay connected all week long.`,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#14100d" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${fontHeading.variable} ${fontInter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <NativeThemeBridge />
            <ServiceWorkerRegistration />
            <TooltipProvider delay={200}>
              {children}
              <Toaster position="bottom-right" richColors closeButton />
            </TooltipProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
