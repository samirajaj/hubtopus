import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Hubtopus — Explore GitHub Developers",
    template: "%s",
  },
  description:
    "Search GitHub developers and explore their public profiles, repositories, languages, stars, and recent activity.",
  applicationName: "Hubtopus",
  openGraph: {
    title: "Hubtopus — Explore GitHub Developers",
    description: "Turn public GitHub activity into a clear developer profile.",
    type: "website",
    siteName: "Hubtopus",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Hubtopus developer explorer dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hubtopus — Explore GitHub Developers",
    description: "Turn public GitHub activity into a clear developer profile.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
