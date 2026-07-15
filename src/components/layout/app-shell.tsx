"use client";

import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { WorkbenchLanguage } from "@/features/workbench/types";

type AppShellProps = {
  children: ReactNode;
  headerActions?: ReactNode;
  currentProblemLabel: string;
  currentProblemDifficulty: string | null;
  language: WorkbenchLanguage;
  problemQuery: string;
  resolutionMessage: string | null;
  onLanguageChange: (language: WorkbenchLanguage) => void;
  onProblemQueryChange: (query: string) => void;
  onProblemResolve: () => void;
};

function difficultyClassName(difficulty: string | null) {
  if (difficulty === "Easy") {
    return "border-emerald-200 bg-emerald-100 text-emerald-700";
  }

  if (difficulty === "Medium") {
    return "border-amber-200 bg-amber-100 text-amber-700";
  }

  if (difficulty === "Hard") {
    return "border-rose-200 bg-rose-100 text-rose-700";
  }

  return "border-border bg-muted text-muted-foreground";
}

export function AppShell({
  children,
  headerActions,
  currentProblemLabel,
  currentProblemDifficulty,
  language,
  problemQuery,
  resolutionMessage,
  onLanguageChange,
  onProblemQueryChange,
  onProblemResolve,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-full w-full max-w-[1800px] items-center gap-4 overflow-x-auto px-4 lg:px-6">
          <div className="flex shrink-0 items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-[#101418] text-sm font-bold text-white shadow-sm">
              PC
            </div>
            <span className="whitespace-nowrap text-sm font-semibold">
              PatternCoach
            </span>
          </div>

          <form
            className="relative flex w-[330px] shrink-0 items-center"
            onSubmit={(event) => {
              event.preventDefault();
              onProblemResolve();
            }}
          >
            <Search
              className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              aria-label="Problem resolver"
              className="h-9 rounded-md bg-card pl-9 pr-10"
              onChange={(event) => onProblemQueryChange(event.target.value)}
              placeholder="Problem # / slug search..."
              value={problemQuery}
            />
            <Button
              aria-label="Resolve problem"
              className="absolute right-1 h-7 w-7 px-0"
              size="icon"
              type="submit"
              variant="ghost"
            >
              /
            </Button>
            {resolutionMessage ? (
              <p className="absolute left-1 top-10 max-w-[320px] truncate rounded-md border border-border bg-popover px-2 py-1 text-xs text-muted-foreground shadow-sm">
                {resolutionMessage}
              </p>
            ) : null}
          </form>

          <div className="flex min-w-[180px] flex-1 items-center gap-3">
            <h1 className="truncate text-base font-semibold leading-6">
              {currentProblemLabel}
            </h1>
            <span
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
                difficultyClassName(currentProblemDifficulty),
              )}
            >
              {currentProblemDifficulty ?? "Demo"}
            </span>
          </div>

          <div className="w-32 shrink-0">
            <Select
              onValueChange={(value) =>
                onLanguageChange(value as WorkbenchLanguage)
              }
              value={language}
            >
              <SelectTrigger aria-label="Language" className="h-9 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Python">Python</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {headerActions ? (
            <div className="shrink-0">{headerActions}</div>
          ) : null}

        </div>
      </header>
      {children}
    </div>
  );
}
