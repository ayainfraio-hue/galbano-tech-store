import { useEffect, useState, type ReactNode } from "react";

import { getBrandLogoUrl } from "@/lib/brand-logo";

type BrandLogoProps = {
  alt: string;
  className?: string;
  fallback: ReactNode;
};

/** Loads the centrally managed logo and reuses the browser cache until it changes. */
export function BrandLogo({ alt, className, fallback }: BrandLogoProps) {
  const [failed, setFailed] = useState(false);
  const [version, setVersion] = useState<number | null>(null);

  useEffect(() => {
    const refresh = () => {
      setFailed(false);
      setVersion(Date.now());
    };
    window.addEventListener("brand-logo-updated", refresh);
    return () => window.removeEventListener("brand-logo-updated", refresh);
  }, []);

  if (failed) return <>{fallback}</>;

  const baseUrl = getBrandLogoUrl();
  const src = version === null ? baseUrl : `${baseUrl}?v=${version}`;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
