import { z } from "zod";

export const factCandidateSchema = z.object({
  factType: z.string().min(1),
  tag: z.string().min(1),
  value: z.string().min(1),
  observedBehavior: z.string().optional(),
  evidenceTraceIds: z.array(z.string()).default([]),
});
export type FactCandidate = z.infer<typeof factCandidateSchema>;
export function normalizeMemoryTag(tag: string) { return tag.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_"); }
export type FactStatus = "active" | "improving" | "resolved" | "stale" | "contradicted";
