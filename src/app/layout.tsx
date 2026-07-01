import type { Metadata, Viewport } from "next";
import { Sora, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { MotionProvider } from "@/components/shared/MotionProvider";
import { ThemedBackground } from "@/components/shared/ThemedBackground";
import { AGENCY_NAME, PRODUCT_NAME } from "@/lib/constants";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${PRODUCT_NAME} · ${AGENCY_NAME}`,
    template: `%s · ${PRODUCT_NAME}`,
  },
  description: `Live view of your AI voice receptionist — calls handled, recordings, and sentiment. By ${AGENCY_NAME}.`,
  robots: { index: false, follow: false },
};

// viewportFit: cover lets the mobile bottom nav pad against the home-indicator
// safe area (env(safe-area-inset-bottom)).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${sora.variable} ${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <ThemedBackground />
          <MotionProvider>{children}</MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
