import Image from 'next/image';

type SiteLogoMarkProps = {
  size?: number;
  className?: string;
};

/** Decorative mark; parent link should set accessible name (e.g. "SouthCaravan home"). */
export function SiteLogoMark({ size = 32, className }: SiteLogoMarkProps) {
  return (
    <Image
      src="/logo.svg"
      alt=""
      width={size}
      height={size}
      className={className ?? 'h-8 w-8 shrink-0 rounded-md object-contain'}
      aria-hidden
    />
  );
}
