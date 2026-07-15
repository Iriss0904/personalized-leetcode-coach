import { AppLayout } from "@/components/layout/app-layout";
import { localUserHandle } from "@/features/onboarding/profile-defaults";
import { getTodayPlannerData } from "@/server/planner/planner-service";
import { TodayClient } from "@/features/today/today-client";
import prisma from "@/server/db/prisma";
import { loadHandbookHomeCard } from "@/server/memory/store/knowledge-note-store";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const data = await getTodayPlannerData();
  const user = await prisma.user.upsert({
    where: { handle: localUserHandle },
    update: {},
    create: { handle: localUserHandle },
  });
  const rows = await loadHandbookHomeCard(prisma, user.id);
  const handbookNotes = rows.map((note) => ({
    id: note.id,
    title: note.title,
    snippet: note.snippet,
    lookupCount: note.lookupCount,
  }));

  return (
    <AppLayout displayName={data.displayName}>
      <TodayClient handbookNotes={handbookNotes} initialData={data} />
    </AppLayout>
  );
}
