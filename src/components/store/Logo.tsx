import { Link } from "@tanstack/react-router";

import emblem from "@/assets/galbano-emblem.png.asset.json";
import wordmark from "@/assets/galbano-wordmark.png.asset.json";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" aria-label="Gálbano Tech — página inicial" className={cn("flex shrink-0 items-center gap-2.5", className)}>
      <img src={emblem.url} alt="" width={200} height={190} className="h-9 w-auto sm:h-11" />
      <img src={wordmark.url} alt="Gálbano Tech" width={700} height={200} className="h-6 w-auto sm:h-8" />
    </Link>
  );
}
