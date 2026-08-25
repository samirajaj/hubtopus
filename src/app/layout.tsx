import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Hubtopus - Explore GitHub Developers",
    template: "%s",
  },
  description:
    "Build clear, factual portfolio briefs from public GitHub profiles, repositories, project health, and external contributions.",
  applicationName: "Hubtopus",
  openGraph: {
    title: "Hubtopus - Explore GitHub Developers",
    description:
      "Turn public GitHub work into a clear, factual developer brief.",
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
    title: "Hubtopus - Explore GitHub Developers",
    description:
      "Turn public GitHub work into a clear, factual developer brief.",
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
