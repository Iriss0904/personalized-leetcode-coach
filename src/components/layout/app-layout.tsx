import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";

export function AppLayout({
  contentClassName,
  displayName,
  children,
}: {
  contentClassName?: string;
  displayName: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar displayName={displayName} mode="push" />
      <main className="min-w-0 flex-1">
        <div
          className={cn(
            "mx-auto w-full max-w-6xl px-4 py-6 lg:px-8",
            contentClassName,
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
