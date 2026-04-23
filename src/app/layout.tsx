import type { Metadata, Viewport } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google"; // Changed fonts
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Monopoluri",
  description: "Financial tracking for Eden & Sivan",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Monopoluri",
    statusBarStyle: "default",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#6BA84F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

import { UserProvider } from "@/contexts/UserContext";
import { Shell } from "@/components/Shell";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="pastel">
      <body
        className={`${manrope.variable} ${plexMono.variable} antialiased bg-base-100 text-base-content`}
      >
        <ServiceWorkerRegistration />
        <UserProvider>
          <Shell>
            {children}
          </Shell>
        </UserProvider>
      </body>
    </html>
  );
}


