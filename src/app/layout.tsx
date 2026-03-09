import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/hooks/useAuth";
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
  title: "geoSync — Biophysical Compatibility",
  description:
    "Compatibility scored through chronobiology, stress response, and seasonal imprinting.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "geoSync — Biophysical Compatibility",
    description:
      "Compatibility scored through chronobiology, stress response, and seasonal imprinting.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "geoSync — Biophysical Compatibility",
    description:
      "Compatibility scored through chronobiology, stress response, and seasonal imprinting.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-bg text-text-primary`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
