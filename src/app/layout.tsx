import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VEYRO — See the architecture behind the code",
  description:
    "Turn public GitHub repositories into interactive dependency maps. Trace imports, explore files, and understand how a codebase fits together.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "VEYRO — Visual Codebase Explorer",
    description:
      "Turn public GitHub repositories into interactive dependency maps. Trace imports, explore files, and understand how a codebase fits together.",
    type: "website",
    siteName: "VEYRO",
  },
  twitter: {
    card: "summary_large_image",
    title: "VEYRO — See the architecture behind the code",
    description:
      "Turn public GitHub repositories into interactive dependency maps.",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
