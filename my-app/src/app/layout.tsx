import type { Metadata } from "next";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kyle-Anthony Hay | AI Engineer",
  description:
    "Kyle-Anthony Hay builds AI products for companies and for himself: OnTract, Sentio+, V1 ProdBot and SelahNote.",
  keywords: ["Kyle-Anthony Hay", "AI Engineer", "Software Engineer", "Portfolio", "OnTract", "Sentio+", "ProdBot", "SelahNote"],
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
      <body className="font-sans antialiased">
        <SmoothScroll />
        <div className="min-h-screen bg-paper">
          {children}
        </div>
      </body>
    </html>
  );
}
