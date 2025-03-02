import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@lib/context/AuthContext';
import { ToastProvider } from '@/layouts/Toast';
import ClientLayout from './ClientLayout';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Philly Social",
  description: "Connect with Philly",
  keywords: "Philly, social, news, events, community",
  authors: [{ name: "Antonio Archer" }],
  openGraph: {
    title: "Philly Social",
    description: "Connect with Philly",
    url: "https://phillysocial.adarcher.app",
    images: [
      {
        url: "/Logo.png",
        width: 800,
        height: 600,
        alt: "Philly Social Icon",
      },
    ],
  },
  metadataBase: new URL("https://phillysocial.adarcher.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#e6f0f0]`}
      >
        <AuthProvider>
          <ToastProvider>
            <ClientLayout>{children}</ClientLayout>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
