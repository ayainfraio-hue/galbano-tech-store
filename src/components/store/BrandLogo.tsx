import { useEffect, useState, type ReactNode } from "react";

import { getBrandLogoUrl } from "@/lib/brand-logo";

type BrandLogoProps = {
  alt: string;
  className?: string;
  fallback: ReactNode;
};

/** Loads the one centrally managed logo and falls back to the existing artwork. */
export function BrandLogo({ alt, className, fallback }: BrandLogoProps) {
  const [failed, setFailed] = useState(false);
  const [version, setVersion] = useState(() => Date.now());

  useEffect(() => {
    const refresh = () => {
      setFailed(false);
      setVersion(Date.now());
    };
    window.addEventListener("brand-logo-updated", refresh);
    return () => window.removeEventListener("brand-logo-updated", refresh);
  }, []);

  if (failed) return <>{fallback}</>;

  return (
    <img
      src={`${getBrandLogoUrl()}?v=${version}`}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
