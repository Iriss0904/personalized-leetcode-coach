import { z } from "zod";

const nonEmptyStringArray = z.array(z.string()).min(1, "Choose at least one.");

export const onboardingSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required."),
  interviewGoal: z.enum(["full_time", "internship", "general_practice"]),
  preferredLanguages: nonEmptyStringArray,
  strongPatterns: nonEmptyStringArray,
  weakPatterns: nonEmptyStringArray,
  explanationStyle: nonEmptyStringArray,
  outputPreferences: nonEmptyStringArray,
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
