import type { Metadata } from "next";
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
  title: "MonopoluriV3",
  description: "Financial tracking for Eden & Sivan",
};

import { UserProvider } from "@/contexts/UserContext";
import { Shell } from "@/components/Shell";

// ... (keep metadata)

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
        <UserProvider>
          <Shell>
            {children}
          </Shell>
        </UserProvider>
      </body>
    </html>
  );
}


