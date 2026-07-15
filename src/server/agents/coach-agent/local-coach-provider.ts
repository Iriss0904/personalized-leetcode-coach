import type { CodeRunResult } from "@/types/code-runner";
import { publicFallbackReview } from "./review-output-protocol";

export function localCoachReview(problemTitle: string, run: CodeRunResult) {
  return publicFallbackReview(problemTitle, run);
}

export function localCoachChat(problemTitle: string, message: string) {
  return `For **${problemTitle}**, turn “${message.slice(0, 100)}” into one checkable invariant. Then trace a small visible test and identify the first line where that invariant changes. Start Piston and use **Run Code** whenever you need execution evidence.`;
}
