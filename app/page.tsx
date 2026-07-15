import { existsSync } from "node:fs";
import { redirect } from "next/navigation";
import { localUserHandle } from "@/features/onboarding/profile-defaults";
import prisma from "@/server/db/prisma";
import { DEFAULT_DATABASE_URL, resolveSqliteFilePath } from "@/server/db/sqlite-path";

export const dynamic = "force-dynamic";

async function hasLocalProfile() {
  try {
    const databasePath = resolveSqliteFilePath(process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL);
    if (!existsSync(databasePath)) return false;
    const user = await prisma.user.findUnique({
      where: { handle: localUserHandle },
      select: { profile: { select: { id: true } } },
    });

    return Boolean(user?.profile);
  } catch {
    return false;
  }
}

export default async function Home() {
  const hasProfile = await hasLocalProfile();

  redirect(hasProfile ? "/today" : "/onboarding");
}
