"use client";

import Link from "next/link";
import { GitCompareArrows, Link2, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function BriefActions({ username }: { username: string }) {
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Profile link copied");
    } catch {
      toast.error("Could not copy the profile link");
    }
  }

  return (
    <div className="print-hidden flex flex-wrap gap-2">
      <Button variant="outline" size="lg" asChild>
        <Link href={`/compare/${encodeURIComponent(username)}`}>
          <GitCompareArrows aria-hidden="true" />
          Compare
        </Link>
      </Button>
      <Button
        variant="outline"
        size="icon-lg"
        onClick={copyLink}
        aria-label="Copy profile link"
        title="Copy profile link"
      >
        <Link2 aria-hidden="true" />
      </Button>
      <Button
        variant="outline"
        size="icon-lg"
        onClick={() => window.print()}
        aria-label="Print or save developer brief"
        title="Print or save as PDF"
      >
        <Printer aria-hidden="true" />
      </Button>
    </div>
  );
}
