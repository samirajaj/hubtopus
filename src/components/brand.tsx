import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "focus-visible:ring-ring inline-flex items-center gap-2 rounded-md text-base font-semibold focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
    >
      <Image
        src="/logo-mark.png"
        alt=""
        width={36}
        height={36}
        className="size-9 shrink-0 object-contain"
      />
      <span>Hubtopus</span>
    </Link>
  );
}
