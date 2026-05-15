import Image from "next/image";

type LogoProps = {
  size?: number;
  className?: string;
  withWordmark?: boolean;
};

export function Logo({ size = 32, className, withWordmark = true }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Image
        src="/logo.png"
        alt="Plumely"
        width={size}
        height={size}
        priority
        className="shrink-0"
      />
      {withWordmark && (
        <span className="text-lg font-bold tracking-tight text-ink">
          Plumely
        </span>
      )}
    </span>
  );
}
