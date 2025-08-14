import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import AppHeader from "@/components/AppHeader";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ParkBunny - Parking Revenue Enhancement Platform",
  description: "Transform parking into a dynamic revenue stream. ParkBunny activates local businesses and rewards drivers with no CapEx and unmatched operator control.",
  keywords: ["parking", "revenue", "business partnerships", "parking management", "local business", "parking optimization"],
  authors: [{ name: "ParkBunny" }],
  creator: "ParkBunny",
  publisher: "ParkBunny",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://parkbunny.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "ParkBunny - Parking Revenue Enhancement Platform",
    description: "Transform parking into a dynamic revenue stream. Activate local businesses and reward drivers with no CapEx and unmatched operator control.",
    url: '/',
    siteName: 'ParkBunny',
    images: [
      {
        url: '/favicon.ico',
        width: 512,
        height: 512,
        alt: 'ParkBunny - Parking Revenue Enhancement Platform',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "ParkBunny - Parking Revenue Enhancement Platform",
    description: "Transform parking into a dynamic revenue stream. Activate local businesses and reward drivers with no CapEx and unmatched operator control.",
    images: ['/favicon.ico'],
    creator: '@parkbunny',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </head>
        <body className={inter.className}>
          <AppHeader />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
