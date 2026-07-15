import type { OnboardingFormValues } from "./schema";

export const localUserHandle = "local-user";

export const publicDefaultProfile: OnboardingFormValues = {
  displayName: "Local Learner",
  interviewGoal: "general_practice",
  preferredLanguages: ["Python"],
  strongPatterns: ["Arrays & Hashing"],
  weakPatterns: ["Dynamic Programming"],
  explanationStyle: ["Concise"],
  outputPreferences: ["One next step"],
};

export const onboardingOptions = {
  interviewGoals: [
    { value: "full_time", label: "Full-time interview" },
    { value: "internship", label: "Internship interview" },
    { value: "general_practice", label: "General practice" },
  ],
  languages: ["Python"],
  strongPatterns: [
    "Arrays & Hashing",
    "Two Pointers",
    "Sliding Window",
    "Binary Search",
    "Trees",
    "Graphs",
    "Dynamic Programming",
  ],
  weakPatterns: [
    "Arrays & Hashing",
    "Two Pointers",
    "Sliding Window",
    "Binary Search",
    "Trees",
    "Graphs",
    "Dynamic Programming",
  ],
  explanationStyles: ["Concise", "Socratic", "Example first"],
  outputPreferences: ["One next step", "Complexity reminder", "Pattern reminder"],
} as const;
