import type { WorkbenchLanguage } from "./types";

export const WORKBENCH_LAST_CONTEXT_STORAGE_KEY =
  "patterncoach.workbenchLastContext.v1";

export type WorkbenchContextRecord = {
  href: string;
  language: WorkbenchLanguage;
  planItemId?: string;
  problemSlug: string;
  savedAt: number;
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function isWorkbenchLanguage(
  value: unknown,
): value is WorkbenchLanguage {
  return value === "Python";
}

export function buildWorkbenchHref({
  language,
  planItemId,
  problemSlug,
}: {
  language: WorkbenchLanguage;
  planItemId?: string | null;
  problemSlug: string;
}) {
  const params = new URLSearchParams({
    problem: problemSlug,
    language,
  });
  const normalizedPlanItemId = planItemId?.trim();

  if (normalizedPlanItemId) {
    params.set("planItemId", normalizedPlanItemId);
  }

  return `/workbench?${params.toString()}`;
}

export function parseWorkbenchContextRecord(
  raw: string | null | undefined,
): WorkbenchContextRecord | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WorkbenchContextRecord>;
    const href = typeof parsed.href === "string" ? parsed.href : "";
    const url = new URL(href, "http://patterncoach.local");

    if (url.pathname !== "/workbench" || !url.search) {
      return null;
    }

    const problemSlug = url.searchParams.get("problem")?.trim();
    const language = url.searchParams.get("language");
    const planItemId = url.searchParams.get("planItemId")?.trim() || undefined;

    if (!problemSlug || !isWorkbenchLanguage(language)) {
      return null;
    }

    if (
      parsed.problemSlug !== problemSlug ||
      parsed.language !== language ||
      (parsed.planItemId || undefined) !== planItemId
    ) {
      return null;
    }

    return {
      href: buildWorkbenchHref({ language, planItemId, problemSlug }),
      language,
      planItemId,
      problemSlug,
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : 0,
    };
  } catch {
    return null;
  }
}

export function readLastWorkbenchContext(
  storage?: StorageLike | null,
): WorkbenchContextRecord | null {
  try {
    const source =
      storage ??
      (typeof window === "undefined" ? null : window.localStorage);

    if (!source) {
      return null;
    }

    return parseWorkbenchContextRecord(
      source.getItem(WORKBENCH_LAST_CONTEXT_STORAGE_KEY),
    );
  } catch {
    return null;
  }
}

export function writeLastWorkbenchContext(
  input: {
    language: WorkbenchLanguage;
    planItemId?: string | null;
    problemSlug: string;
  },
  storage?: StorageLike | null,
) {
  try {
    const target =
      storage ??
      (typeof window === "undefined" ? null : window.localStorage);

    if (!target) {
      return null;
    }

    const planItemId = input.planItemId?.trim() || undefined;
    const record: WorkbenchContextRecord = {
      href: buildWorkbenchHref({
        language: input.language,
        planItemId,
        problemSlug: input.problemSlug,
      }),
      language: input.language,
      planItemId,
      problemSlug: input.problemSlug,
      savedAt: Date.now(),
    };

    target.setItem(WORKBENCH_LAST_CONTEXT_STORAGE_KEY, JSON.stringify(record));
    return record;
  } catch {
    return null;
  }
}
