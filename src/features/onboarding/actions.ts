"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/server/db/prisma";
import { onboardingSchema, type OnboardingFormValues } from "./schema";
import { localUserHandle, publicDefaultProfile } from "./profile-defaults";

export async function saveOnboardingProfile(input: OnboardingFormValues) {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, message: "Please check the profile fields." };
  }

  const profile = parsed.data;
  const user = await prisma.user.upsert({
    where: { handle: localUserHandle },
    update: {},
    create: { handle: localUserHandle },
  });

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: toProfileData(profile),
    create: { userId: user.id, ...toProfileData(profile) },
  });
  revalidatePath("/");
  return { ok: true as const };
}

export async function skipOnboarding() {
  return saveOnboardingProfile(publicDefaultProfile);
}

function toProfileData(profile: OnboardingFormValues) {
  return {
    displayName: profile.displayName,
    interviewGoal: profile.interviewGoal,
    preferredLanguages: JSON.stringify(["Python"]),
    strongPatterns: JSON.stringify(profile.strongPatterns),
    weakPatterns: JSON.stringify(profile.weakPatterns),
    explanationStyle: JSON.stringify(profile.explanationStyle),
    outputPreferences: JSON.stringify(profile.outputPreferences),
  };
}
