import type { Metadata, Viewport } from "next";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

const siteTitle = "Kyle-Anthony Hay | AI Engineer";
const siteDescription =
  "Kyle-Anthony Hay builds AI products for companies and for himself: OnTract, Sentio+, V1 ProdBot and SelahNote.";

// The share image itself comes from app/opengraph-image.jpg and
// app/twitter-image.jpg (rendered by scripts/og/render.sh). Declaring it
// explicitly stops LinkedIn and others from guessing an image off the page,
// which is how the agent mascot ended up in link previews.
export const metadata: Metadata = {
  metadataBase: new URL("https://www.kyleanthonyhay.com"),
  title: siteTitle,
  description: siteDescription,
  keywords: ["Kyle-Anthony Hay", "AI Engineer", "Software Engineer", "Portfolio", "OnTract", "Sentio+", "ProdBot", "SelahNote"],
  icons: {
    icon: "/profile.jpg",
  },
  openGraph: {
    type: "website",
    siteName: "Kyle-Anthony Hay",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
};

// viewport-fit=cover lets the chat composer pad for the home indicator;
// resizes-content keeps the chat shell above the keyboard on Android.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
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
