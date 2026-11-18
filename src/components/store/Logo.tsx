import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { BrandLogo } from "./BrandLogo";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="Gálbano Tech — página inicial"
      className={cn("flex shrink-0 items-center gap-2.5", className)}
    >
      <BrandLogo
        alt="Gálbano Tech"
        className="h-11 w-auto max-w-[250px] object-contain sm:h-14 sm:max-w-[320px]"
        fallback={
          <span className="flex shrink-0 items-center gap-2.5">
            <img src="/galbano-emblem.webp" alt="" width={96} height={96} className="h-11 w-11 object-contain sm:h-14 sm:w-14" />
            <img src="/galbano-wordmark.webp" alt="Gálbano Tech" width={320} height={100} className="h-8 w-auto object-contain sm:h-10" />
          </span>
        }
      />
    </Link>
  );
}
