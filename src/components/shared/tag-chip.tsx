import Link from "next/link";
import { cn } from "@/lib/utils";

export function TagChip({
  label,
  href,
  active = false,
}: {
  label: string;
  href?: string;
  active?: boolean;
}) {
  const className = cn(
    "rounded-full border px-2.5 py-0.5 text-xs font-medium",
    active
      ? "border-primary bg-primary/10 text-primary"
      : "border-border bg-card text-muted-foreground hover:text-foreground",
  );

  if (href) {
    return (
      <Link className={className} href={href}>
        {label}
      </Link>
    );
  }

  return <span className={className}>{label}</span>;
}
