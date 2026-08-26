import type { Metadata } from "next";
import { AppFooter } from "@/components/app/app-footer";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { DEFAULT_SITE_URL } from "@/lib/config/public";
import { getSiteUrl } from "@/lib/config/server";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl() ?? new URL(DEFAULT_SITE_URL),
  title: {
    default: "Hubtopus - GitHub Developer and Repository Intelligence",
    template: "%s",
  },
  description:
    "Explore public developer work and privately review repositories, work queues, and maintenance signals.",
  applicationName: "Hubtopus",
  openGraph: {
    title: "Hubtopus - GitHub Developer and Repository Intelligence",
    description:
      "Explore developer work and privately review repository health in one focused workspace.",
    type: "website",
    siteName: "Hubtopus",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Hubtopus GitHub workspace and developer explorer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hubtopus - GitHub Developer and Repository Intelligence",
    description:
      "Explore developer work and privately review repository health in one focused workspace.",
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
          <AppFooter />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
