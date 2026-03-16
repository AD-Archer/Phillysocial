import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@lib/context/AuthContext";
import { ToastProvider } from "@/layouts/Toast";
import ClientLayout from "./ClientLayout";
import { ProfileCompletionProvider } from "@/lib/context/ProfileCompletionContext";
import UserMiniProfileProvider from "@/lib/context/UserMiniProfileContext";
import Analytics from "@components/Analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Philly Social - Connect with Philadelphia's Community",
  description:
    "Philly Social is your hub for Philadelphia news, events, local businesses, and community connections. Stay updated with the latest happenings in the city of brotherly love.",
  keywords:
    "Philadelphia, Philly, social network, news, events, community, local business, Philadelphia news, Philly events",
  authors: [
    { name: "Antonio Archer" },
    { name: "Mohamed Souare" },
    { name: "Sianni Strickland" },
    { name: "Bryan Gunawan" },
  ],
  creator: "Antonio Archer, Mohomed Souare, Sianni Strickland, Bryan Gunawan",
  publisher: "Philly Social",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://phillysocial.adarcher.app",
    title: "Philly Social - Connect with Philadelphia's Community",
    description:
      "Philly Social is your hub for Philadelphia news, events, local businesses, and community connections. Stay updated with the latest happenings in the city of brotherly love.",
    siteName: "Philly Social",
    images: [
      {
        url: "/Logo.png",
        width: 800,
        height: 600,
        alt: "Philly Social Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Philly Social - Connect with Philadelphia's Community",
    description:
      "Philly Social is your hub for Philadelphia news, events, local businesses, and community connections.",
    images: ["/Logo.png"],
    creator: "@phillysocial",
    site: "@phillysocial",
  },
  alternates: {
    canonical: "https://phillysocial.adarcher.app",
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
        <Analytics />
        <AuthProvider>
          <ProfileCompletionProvider>
            <ToastProvider>
              <UserMiniProfileProvider>
                <ClientLayout>{children}</ClientLayout>
              </UserMiniProfileProvider>
            </ToastProvider>
          </ProfileCompletionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
