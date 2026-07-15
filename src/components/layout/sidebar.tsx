"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { readLastWorkbenchContext } from "@/features/workbench/workbench-context";
import { cn } from "@/lib/utils";
import { SIDEBAR_NAV } from "./sidebar-nav";

const STORAGE_KEY = "patterncoach:sidebar-collapsed:v1";
const RAIL_WIDTH = 56;
const PANEL_WIDTH = 232;

function initialsFor(displayName: string) {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Sidebar({
  displayName,
  mode = "push",
  onNavigate,
}: {
  displayName: string;
  mode?: "push" | "overlay";
  onNavigate?: (href: string) => void;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  const [workbenchHref, setWorkbenchHref] = useState("/workbench");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) !== "0");
      setWorkbenchHref(readLastWorkbenchContext()?.href ?? "/workbench");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggle = () => {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  const expanded = !collapsed;

  return (
    <>
      {mode === "overlay" && expanded ? (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/20"
          onClick={toggle}
          type="button"
        />
      ) : null}
      <nav
        aria-label="Primary"
        className={cn(
          "z-40 flex flex-col border-r border-border bg-card py-3 transition-[width]",
          mode === "overlay"
            ? "fixed left-0 top-0 h-screen"
            : "sticky top-0 h-screen shrink-0",
        )}
        style={{ width: expanded ? PANEL_WIDTH : RAIL_WIDTH }}
      >
        <button
          aria-label="Toggle sidebar"
          className="mx-auto mb-4 grid h-9 w-9 place-items-center rounded-md bg-[#101418] text-sm font-bold text-white"
          onClick={toggle}
          type="button"
        >
          PC
        </button>

        <ul className="flex-1 space-y-1 px-2">
          {SIDEBAR_NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const href = item.href === "/workbench" ? workbenchHref : item.href;

            return (
              <li key={item.href}>
                <Link
                  className={cn(
                    "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  href={href}
                  onClick={() => onNavigate?.(href)}
                  title={item.label}
                >
                  {active ? (
                    <span className="absolute left-0 top-1.5 h-[calc(100%-12px)] w-0.5 rounded-full bg-primary" />
                  ) : null}
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {expanded ? <span className="truncate">{item.label}</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-2 flex items-center gap-3 px-3 py-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-violet-200 bg-violet-100 text-xs font-semibold text-violet-800">
            {initialsFor(displayName)}
          </span>
          {expanded ? (
            <span className="truncate text-sm font-medium">{displayName}</span>
          ) : null}
        </div>
      </nav>
    </>
  );
}
