import { WorkbenchClient } from "@/features/workbench/workbench-client";
import { loadWorkbenchData } from "@/features/workbench/workbench-data";

export const dynamic = "force-dynamic";

export default async function WorkbenchPage({
  searchParams,
}: {
  searchParams: Promise<{ problem?: string; planItemId?: string }>;
}) {
  const { problem, planItemId } = await searchParams;
  return <WorkbenchClient initialData={await loadWorkbenchData(problem, planItemId)} />;
}
