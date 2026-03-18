import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Kyle-Anthony Hay | Portfolio",
  description: "Software Developer and Entrepreneur",
  keywords: ["Software Developer", "Entrepreneur", "Portfolio", "Production Company"],
  icons: {
    icon: "/profile.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <div className="min-h-screen bg-[#f9fafb]">
          {children}
        </div>
      </body>
    </html>
  );
}
