import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { HandbookClient } from "@/features/handbook/handbook-client";
import { loadHandbookData } from "@/features/handbook/handbook-data";
import { HandbookExportButton } from "@/features/handbook/handbook-export-button";

export const dynamic = "force-dynamic";

export default async function HandbookPage({
  searchParams,
}: {
  searchParams?: Promise<{ edit?: string }>;
}) {
  const data = await loadHandbookData();
  const params = await searchParams;

  return (
    <AppLayout displayName={data.displayName}>
      <PageHeader
        actions={<HandbookExportButton markdown={data.markdown} />}
        description="Reusable language, library, and template notes you have looked up. Edit, export, and review them before interviews."
        title="Knowledge Handbook"
      />
      <HandbookClient initialEditId={params?.edit ?? null} notes={data.notes} />
    </AppLayout>
  );
}
