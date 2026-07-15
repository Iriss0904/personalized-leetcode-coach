import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatusBadge({
  label,
  icon,
  className,
}: {
  label: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {icon}
      {label}
    </span>
  );
}
