export type PublicRetrievalProfile = { factLimit: number; episodeLimit: number; ftsLimit: number };
export const publicRetrievalProfiles = {
  review: { factLimit: 6, episodeLimit: 5, ftsLimit: 5 },
  chat: { factLimit: 5, episodeLimit: 5, ftsLimit: 5 },
  planner: { factLimit: 10, episodeLimit: 10, ftsLimit: 0 },
} satisfies Record<string, PublicRetrievalProfile>;
