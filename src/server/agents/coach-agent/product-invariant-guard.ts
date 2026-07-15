const officialAcceptanceClaims = [
  /(?:official|leetcode).{0,24}(?:accepted|\bAC\b|all hidden tests passed)/iu,
  /(?:官方|LeetCode).{0,20}(?:通过|全过|AC)/u,
];

export function findOfficialAcceptanceOverclaims(markdown: string) {
  return officialAcceptanceClaims.flatMap((regex, index) => regex.test(markdown) ? [{ patternId: `official-overclaim-${index + 1}` }] : []);
}

export function guardPublicCoachReply(reply: string) {
  return findOfficialAcceptanceOverclaims(reply).length
    ? "This review is limited to local public visible-test evidence and cannot claim official LeetCode acceptance."
    : reply;
}
