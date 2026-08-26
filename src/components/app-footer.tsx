import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { Brand } from "@/components/brand";

const productLinks = [
  { href: "/", label: "Explore" },
  { href: "/compare", label: "Compare" },
  { href: "/workspace", label: "Workspace" },
  { href: "/workspace/health", label: "Health" },
] as const;

export function AppFooter() {
  return (
    <footer className="print-hidden border-t">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="max-w-md">
          <Brand />
          <p className="text-muted-foreground mt-3 text-sm leading-6">
            Clear GitHub portfolio signals and private repository health in one
            focused workspace.
          </p>
        </div>

        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap gap-x-5 gap-y-3 text-sm"
        >
          {productLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>Built for useful decisions from GitHub data.</span>
          <span className="flex items-center gap-1">
            Created by
            <a
              href="https://github.com/samirajaj"
              target="_blank"
              rel="noreferrer"
              className="text-foreground focus-visible:ring-ring inline-flex items-center gap-1 rounded-sm font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
            >
              Samir Ajaj
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
