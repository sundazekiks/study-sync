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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const description = "One course hub for collaborative study materials.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "StudySync",
    template: "%s | StudySync",
  },
  description,
  applicationName: "StudySync",
  keywords: [
    "study groups",
    "collaborative study planner",
    "course resources",
    "study scheduler",
  ],
  openGraph: {
    type: "website",
    siteName: "StudySync",
    title: "StudySync",
    description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "StudySync",
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}