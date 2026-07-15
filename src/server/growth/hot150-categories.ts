export const HOT150_CATEGORIES: ReadonlyArray<{
  category: string;
  matchTags: readonly string[];
}> = [
  { category: "Two Pointers", matchTags: ["two-pointers"] },
  { category: "Sliding Window", matchTags: ["sliding-window"] },
  { category: "Stack", matchTags: ["stack"] },
  { category: "Binary Search", matchTags: ["binary-search"] },
  { category: "Linked List", matchTags: ["linked-list"] },
  { category: "Heap", matchTags: ["heap", "priority-queue"] },
  { category: "Backtracking", matchTags: ["backtracking"] },
  { category: "Graph", matchTags: ["graph", "trie"] },
  {
    category: "Tree / BFS-DFS",
    matchTags: ["binary-tree", "tree", "binary-search-tree", "bst", "bfs", "dfs"],
  },
  {
    category: "Dynamic Programming",
    matchTags: ["dynamic-programming", "1d-dp", "multidimensional-dp", "kadane"],
  },
  { category: "Greedy", matchTags: ["greedy"] },
  { category: "Intervals", matchTags: ["intervals"] },
  { category: "Math / Bit", matchTags: ["math", "bit-manipulation"] },
  { category: "Matrix", matchTags: ["matrix"] },
  { category: "Divide & Conquer", matchTags: ["divide-and-conquer"] },
  {
    category: "Array & Hashing",
    matchTags: ["hashmap", "hash-table", "array", "string"],
  },
];

export const OTHER_HOT150_CATEGORY = "Other";

export function classifyProblem(tags: readonly string[]) {
  const normalized = new Set(tags.map(normalizeTag));

  for (const entry of HOT150_CATEGORIES) {
    if (entry.matchTags.some((tag) => normalized.has(normalizeTag(tag)))) {
      return entry.category;
    }
  }

  return OTHER_HOT150_CATEGORY;
}

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase().replaceAll("_", "-");
}
