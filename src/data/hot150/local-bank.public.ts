import {
  defaultParameterAdapter,
  defaultReturnAdapter,
  definePublicHot150Bank,
  publicHot150ProblemSchema,
  type PublicComparisonStrategy,
  type PublicContractKind,
  type PublicDifficulty,
  type PublicHot150Problem,
  type PublicParameterAdapter,
  type PublicReturnAdapter,
  type PublicValueSchema,
  type PublicValueType,
} from "./local-run-types";

type Metadata = readonly [
  number,
  number,
  string,
  string,
  PublicDifficulty,
  string,
];

type Parameter = readonly [string, PublicValueType];
type Runtime = readonly [
  string,
  readonly Parameter[],
  PublicValueType,
  PublicContractKind,
  PublicComparisonStrategy,
];
type SyntheticTest = readonly [Record<string, unknown>, unknown];

type ProblemOptions = {
  adapters?: Record<string, PublicParameterAdapter>;
  adapterBindings?: Record<
    string,
    { auxiliaryInput?: string; referenceRootParameter?: string }
  >;
  auxiliaryInputs?: readonly Parameter[];
  comparisonConfig?: Record<string, boolean | number | string>;
  inputTypes?: Record<string, PublicValueType>;
  mutatedArgumentIndex?: number;
  outputType?: PublicValueType;
  returnAdapter?: PublicReturnAdapter;
};

function valueSchema(type: PublicValueType): PublicValueSchema {
  if (
    [
      "linked_list",
      "binary_tree",
      "next_pointer_tree",
      "random_pointer_list",
      "graph_adjacency_list",
      "quad_tree",
    ].includes(type)
  ) {
    return { type, nullable: true };
  }
  return { type };
}

function sectionTag(section: string) {
  return section
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function problem(
  metadata: Metadata,
  runtime: Runtime,
  test: SyntheticTest,
  options: ProblemOptions = {},
): PublicHot150Problem {
  const [number, order, slug, title, difficulty, section] = metadata;
  const [methodName, parameters, returnType, contractKind, strategy] = runtime;
  const auxiliaryInputs = options.auxiliaryInputs ?? [];
  const inputParameters = [...parameters, ...auxiliaryInputs];
  const mutatedType =
    contractKind === "inplace_argument"
      ? parameters[options.mutatedArgumentIndex ?? 0]?.[1]
      : undefined;
  const outputType = options.outputType ??
    (contractKind === "return_and_mutated_prefix"
      ? "return_and_mutated_prefix"
      : (mutatedType ?? returnType));

  return publicHot150ProblemSchema.parse({
    number,
    order,
    slug,
    title,
    difficulty,
    section,
    tags: [sectionTag(section)],
    originalProblemUrl: `https://leetcode.com/problems/${slug}/`,
    language: { python: { supported: true, runtime: "python@3.12" } },
    signature: {
      methodName,
      contractKind,
      parameters: parameters.map(([name, type]) => ({ name, type })),
      returnType,
    },
    inputSchema: {
      type: "object",
      required: inputParameters.map(([name]) => name),
      properties: Object.fromEntries(
        inputParameters.map(([name, type]) => [
          name,
          valueSchema(options.inputTypes?.[name] ?? type),
        ]),
      ),
    },
    outputSchema: valueSchema(outputType),
    serialization: {
      argumentOrder: parameters.map(([name]) => name),
      auxiliaryInputs: auxiliaryInputs.length
        ? auxiliaryInputs.map(([name]) => name)
        : undefined,
      parameterAdapters: parameters.map(([name, type]) => ({
        parameter: name,
        adapter: options.adapters?.[name] ?? defaultParameterAdapter(type),
        ...options.adapterBindings?.[name],
      })),
      returnAdapter:
        options.returnAdapter ?? defaultReturnAdapter(outputType),
      mutatedArgumentIndex:
        ["inplace_argument", "return_and_mutated_prefix"].includes(contractKind)
          ? (options.mutatedArgumentIndex ?? 0)
          : undefined,
    },
    comparison: {
      strategy,
      config: options.comparisonConfig,
    },
    visibleTests: [
      {
        id: `p${number}-synthetic-1`,
        label: "Small synthetic case",
        input: test[0],
        expected: test[1],
      },
    ],
  });
}

function designProblem(
  metadata: Metadata,
  className: string,
  test: SyntheticTest,
  comparisonConfig?: Record<string, boolean | number | string>,
  operationArgumentAdapters?: Record<string, PublicParameterAdapter[]>,
): PublicHot150Problem {
  const [number, order, slug, title, difficulty, section] = metadata;
  return publicHot150ProblemSchema.parse({
    number,
    order,
    slug,
    title,
    difficulty,
    section,
    tags: [sectionTag(section), "design"],
    originalProblemUrl: `https://leetcode.com/problems/${slug}/`,
    language: { python: { supported: true, runtime: "python@3.12" } },
    signature: {
      className,
      methodName: className,
      contractKind: "design_object",
      parameters: [],
      returnType: "operation_results",
    },
    inputSchema: {
      type: "object",
      required: ["operations", "arguments"],
      properties: {
        operations: { type: "string_array" },
        arguments: { type: "operation_arguments" },
      },
    },
    outputSchema: { type: "operation_results" },
    serialization: {
      argumentOrder: ["operations", "arguments"],
      parameterAdapters: [
        { parameter: "operations", adapter: "identity" },
        { parameter: "arguments", adapter: "operation_arguments" },
      ],
      operationArgumentAdapters,
      returnAdapter: "operation_results",
    },
    comparison: { strategy: "operation_sequence", config: comparisonConfig },
    visibleTests: [
      {
        id: `p${number}-synthetic-1`,
        label: "Small synthetic operation sequence",
        input: test[0],
        expected: test[1],
      },
    ],
  });
}

const problems = [
  problem(
    [88, 1, "merge-sorted-array", "Merge Sorted Array", "Easy", "Array / String"],
    [
      "merge",
      [
        ["nums1", "integer_array"],
        ["m", "integer"],
        ["nums2", "integer_array"],
        ["n", "integer"],
      ],
      "void",
      "inplace_argument",
      "inplace_argument",
    ],
    [{ nums1: [2, 7, 0, 0], m: 2, nums2: [1, 9], n: 2 }, [1, 2, 7, 9]],
    { mutatedArgumentIndex: 0 },
  ),
  problem(
    [27, 2, "remove-element", "Remove Element", "Easy", "Array / String"],
    [
      "removeElement",
      [["nums", "integer_array"], ["val", "integer"]],
      "integer",
      "return_and_mutated_prefix",
      "public_special_judge",
    ],
    [
      { nums: [7, 2, 7, 2], val: 7 },
      { returnValue: 2, mutatedPrefix: [2, 2] },
    ],
    { comparisonConfig: { kind: "return_prefix_multiset" } },
  ),
  problem(
    [
      26,
      3,
      "remove-duplicates-from-sorted-array",
      "Remove Duplicates from Sorted Array",
      "Easy",
      "Array / String",
    ],
    [
      "removeDuplicates",
      [["nums", "integer_array"]],
      "integer",
      "return_and_mutated_prefix",
      "exact",
    ],
    [
      { nums: [2, 2, 5, 9, 9] },
      { returnValue: 3, mutatedPrefix: [2, 5, 9] },
    ],
  ),
  problem(
    [
      80,
      4,
      "remove-duplicates-from-sorted-array-ii",
      "Remove Duplicates from Sorted Array II",
      "Medium",
      "Array / String",
    ],
    [
      "removeDuplicates",
      [["nums", "integer_array"]],
      "integer",
      "return_and_mutated_prefix",
      "exact",
    ],
    [
      { nums: [2, 2, 2, 3, 3, 3, 4] },
      { returnValue: 5, mutatedPrefix: [2, 2, 3, 3, 4] },
    ],
  ),
  problem(
    [169, 5, "majority-element", "Majority Element", "Easy", "Array / String"],
    [
      "majorityElement",
      [["nums", "integer_array"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ nums: [8, 3, 8] }, 8],
  ),
  problem(
    [189, 6, "rotate-array", "Rotate Array", "Medium", "Array / String"],
    [
      "rotate",
      [["nums", "integer_array"], ["k", "integer"]],
      "void",
      "inplace_argument",
      "inplace_argument",
    ],
    [{ nums: [4, 8, 12, 16], k: 1 }, [16, 4, 8, 12]],
  ),
  problem(
    [
      121,
      7,
      "best-time-to-buy-and-sell-stock",
      "Best Time to Buy and Sell Stock",
      "Easy",
      "Array / String",
    ],
    ["maxProfit", [["prices", "integer_array"]], "integer", "pure_function", "exact"],
    [{ prices: [9, 1, 5, 3, 8] }, 7],
  ),
  problem(
    [
      122,
      8,
      "best-time-to-buy-and-sell-stock-ii",
      "Best Time to Buy and Sell Stock II",
      "Medium",
      "Array / String",
    ],
    ["maxProfit", [["prices", "integer_array"]], "integer", "pure_function", "exact"],
    [{ prices: [9, 1, 5, 3, 8] }, 9],
  ),
  problem(
    [55, 9, "jump-game", "Jump Game", "Medium", "Array / String"],
    ["canJump", [["nums", "integer_array"]], "boolean", "pure_function", "exact"],
    [{ nums: [2, 0, 1, 0] }, true],
  ),
  problem(
    [45, 10, "jump-game-ii", "Jump Game II", "Medium", "Array / String"],
    ["jump", [["nums", "integer_array"]], "integer", "pure_function", "exact"],
    [{ nums: [2, 1, 1, 1] }, 2],
  ),
  problem(
    [274, 11, "h-index", "H-Index", "Medium", "Array / String"],
    ["hIndex", [["citations", "integer_array"]], "integer", "pure_function", "exact"],
    [{ citations: [4, 4, 0, 0] }, 2],
  ),
  designProblem(
    [
      380,
      12,
      "insert-delete-getrandom-o1",
      "Insert Delete GetRandom O(1)",
      "Medium",
      "Array / String",
    ],
    "RandomizedSet",
    [
      {
        operations: [
          "RandomizedSet",
          "insert",
          "getRandom",
          "remove",
          "insert",
          "getRandom",
        ],
        arguments: [[], [9], [], [9], [4], []],
      },
      [null, true, 9, true, true, 4],
    ],
  ),
  problem(
    [
      238,
      13,
      "product-of-array-except-self",
      "Product of Array Except Self",
      "Medium",
      "Array / String",
    ],
    [
      "productExceptSelf",
      [["nums", "integer_array"]],
      "integer_array",
      "pure_function",
      "exact",
    ],
    [{ nums: [2, 3, 5] }, [15, 10, 6]],
  ),
  problem(
    [134, 14, "gas-station", "Gas Station", "Medium", "Array / String"],
    [
      "canCompleteCircuit",
      [["gas", "integer_array"], ["cost", "integer_array"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ gas: [2, 0, 3], cost: [1, 2, 1] }, 2],
  ),
  problem(
    [135, 15, "candy", "Candy", "Hard", "Array / String"],
    ["candy", [["ratings", "integer_array"]], "integer", "pure_function", "exact"],
    [{ ratings: [1, 3, 2] }, 4],
  ),
  problem(
    [42, 16, "trapping-rain-water", "Trapping Rain Water", "Hard", "Array / String"],
    ["trap", [["height", "integer_array"]], "integer", "pure_function", "exact"],
    [{ height: [3, 0, 2] }, 2],
  ),
  problem(
    [13, 17, "roman-to-integer", "Roman to Integer", "Easy", "Array / String"],
    ["romanToInt", [["s", "string"]], "integer", "pure_function", "exact"],
    [{ s: "XLIV" }, 44],
  ),
  problem(
    [12, 18, "integer-to-roman", "Integer to Roman", "Medium", "Array / String"],
    ["intToRoman", [["num", "integer"]], "string", "pure_function", "exact"],
    [{ num: 44 }, "XLIV"],
  ),
  problem(
    [58, 19, "length-of-last-word", "Length of Last Word", "Easy", "Array / String"],
    ["lengthOfLastWord", [["s", "string"]], "integer", "pure_function", "exact"],
    [{ s: "code   " }, 4],
  ),
  problem(
    [
      14,
      20,
      "longest-common-prefix",
      "Longest Common Prefix",
      "Easy",
      "Array / String",
    ],
    [
      "longestCommonPrefix",
      [["strs", "string_array"]],
      "string",
      "pure_function",
      "exact",
    ],
    [{ strs: ["interview", "internal", "into"] }, "int"],
  ),
  problem(
    [
      151,
      21,
      "reverse-words-in-a-string",
      "Reverse Words in a String",
      "Medium",
      "Array / String",
    ],
    ["reverseWords", [["s", "string"]], "string", "pure_function", "exact"],
    [{ s: "  practice   builds skill " }, "skill builds practice"],
  ),
  problem(
    [6, 22, "zigzag-conversion", "Zigzag Conversion", "Medium", "Array / String"],
    [
      "convert",
      [["s", "string"], ["numRows", "integer"]],
      "string",
      "pure_function",
      "exact",
    ],
    [{ s: "ABCDE", numRows: 2 }, "ACEBD"],
  ),
  problem(
    [
      28,
      23,
      "find-the-index-of-the-first-occurrence-in-a-string",
      "Find the Index of the First Occurrence in a String",
      "Easy",
      "Array / String",
    ],
    [
      "strStr",
      [["haystack", "string"], ["needle", "string"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ haystack: "coachcoach", needle: "ach" }, 2],
  ),
  problem(
    [68, 24, "text-justification", "Text Justification", "Hard", "Array / String"],
    [
      "fullJustify",
      [["words", "string_array"], ["maxWidth", "integer"]],
      "string_array",
      "pure_function",
      "exact",
    ],
    [{ words: ["hi"], maxWidth: 4 }, ["hi  "]],
  ),
  problem(
    [125, 25, "valid-palindrome", "Valid Palindrome", "Easy", "Two Pointers"],
    ["isPalindrome", [["s", "string"]], "boolean", "pure_function", "exact"],
    [{ s: "No lemon, no melon!" }, true],
  ),
  problem(
    [392, 26, "is-subsequence", "Is Subsequence", "Easy", "Two Pointers"],
    [
      "isSubsequence",
      [["s", "string"], ["t", "string"]],
      "boolean",
      "pure_function",
      "exact",
    ],
    [{ s: "ace", t: "abcde" }, true],
  ),
  problem(
    [
      167,
      27,
      "two-sum-ii-input-array-is-sorted",
      "Two Sum II - Input Array Is Sorted",
      "Medium",
      "Two Pointers",
    ],
    [
      "twoSum",
      [["numbers", "integer_array"], ["target", "integer"]],
      "integer_array",
      "pure_function",
      "exact",
    ],
    [{ numbers: [2, 5, 9, 12], target: 14 }, [1, 4]],
  ),
  problem(
    [
      11,
      28,
      "container-with-most-water",
      "Container With Most Water",
      "Medium",
      "Two Pointers",
    ],
    ["maxArea", [["height", "integer_array"]], "integer", "pure_function", "exact"],
    [{ height: [2, 4, 1, 3] }, 6],
  ),
  problem(
    [15, 29, "3sum", "3Sum", "Medium", "Two Pointers"],
    [
      "threeSum",
      [["nums", "integer_array"]],
      "integer_matrix",
      "pure_function",
      "multiset",
    ],
    [{ nums: [-2, 0, 2, 3] }, [[-2, 0, 2]]],
    { comparisonConfig: { depth: "deep" } },
  ),
  problem(
    [
      209,
      30,
      "minimum-size-subarray-sum",
      "Minimum Size Subarray Sum",
      "Medium",
      "Sliding Window",
    ],
    [
      "minSubArrayLen",
      [["target", "integer"], ["nums", "integer_array"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ target: 8, nums: [1, 4, 4] }, 2],
  ),
  problem(
    [
      3,
      31,
      "longest-substring-without-repeating-characters",
      "Longest Substring Without Repeating Characters",
      "Medium",
      "Sliding Window",
    ],
    [
      "lengthOfLongestSubstring",
      [["s", "string"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ s: "dvdf" }, 3],
  ),
  problem(
    [
      30,
      32,
      "substring-with-concatenation-of-all-words",
      "Substring with Concatenation of All Words",
      "Hard",
      "Sliding Window",
    ],
    [
      "findSubstring",
      [["s", "string"], ["words", "string_array"]],
      "integer_array",
      "pure_function",
      "multiset",
    ],
    [{ s: "barfoo", words: ["foo", "bar"] }, [0]],
  ),
  problem(
    [
      76,
      33,
      "minimum-window-substring",
      "Minimum Window Substring",
      "Hard",
      "Sliding Window",
    ],
    [
      "minWindow",
      [["s", "string"], ["t", "string"]],
      "string",
      "pure_function",
      "exact",
    ],
    [{ s: "xyyzyzyx", t: "xyz" }, "zyx"],
  ),
  problem(
    [36, 34, "valid-sudoku", "Valid Sudoku", "Medium", "Matrix"],
    [
      "isValidSudoku",
      [["board", "character_matrix"]],
      "boolean",
      "pure_function",
      "exact",
    ],
    [
      {
        board: [
          ["5", ".", ".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", ".", ".", ".", ".", "."],
          [".", ".", ".", ".", ".", ".", ".", ".", "."],
        ],
      },
      true,
    ],
  ),
  problem(
    [54, 35, "spiral-matrix", "Spiral Matrix", "Medium", "Matrix"],
    [
      "spiralOrder",
      [["matrix", "integer_matrix"]],
      "integer_array",
      "pure_function",
      "exact",
    ],
    [{ matrix: [[1, 2], [3, 4], [5, 6]] }, [1, 2, 4, 6, 5, 3]],
  ),
  problem(
    [48, 36, "rotate-image", "Rotate Image", "Medium", "Matrix"],
    [
      "rotate",
      [["matrix", "integer_matrix"]],
      "void",
      "inplace_argument",
      "inplace_argument",
    ],
    [{ matrix: [[1, 2], [3, 4]] }, [[3, 1], [4, 2]]],
  ),
  problem(
    [73, 37, "set-matrix-zeroes", "Set Matrix Zeroes", "Medium", "Matrix"],
    [
      "setZeroes",
      [["matrix", "integer_matrix"]],
      "void",
      "inplace_argument",
      "inplace_argument",
    ],
    [{ matrix: [[1, 2, 0], [4, 5, 6]] }, [[0, 0, 0], [4, 5, 0]]],
  ),
  problem(
    [289, 38, "game-of-life", "Game of Life", "Medium", "Matrix"],
    [
      "gameOfLife",
      [["board", "integer_matrix"]],
      "void",
      "inplace_argument",
      "inplace_argument",
    ],
    [
      { board: [[1, 1, 1], [0, 0, 0], [0, 0, 0]] },
      [[0, 1, 0], [0, 1, 0], [0, 0, 0]],
    ],
  ),
  problem(
    [383, 39, "ransom-note", "Ransom Note", "Easy", "Hashmap"],
    [
      "canConstruct",
      [["ransomNote", "string"], ["magazine", "string"]],
      "boolean",
      "pure_function",
      "exact",
    ],
    [{ ransomNote: "note", magazine: "tonebook" }, true],
  ),
  problem(
    [205, 40, "isomorphic-strings", "Isomorphic Strings", "Easy", "Hashmap"],
    [
      "isIsomorphic",
      [["s", "string"], ["t", "string"]],
      "boolean",
      "pure_function",
      "exact",
    ],
    [{ s: "kick", t: "side" }, false],
  ),
  problem(
    [290, 41, "word-pattern", "Word Pattern", "Easy", "Hashmap"],
    [
      "wordPattern",
      [["pattern", "string"], ["s", "string"]],
      "boolean",
      "pure_function",
      "exact",
    ],
    [{ pattern: "abba", s: "red blue blue red" }, true],
  ),
  problem(
    [242, 42, "valid-anagram", "Valid Anagram", "Easy", "Hashmap"],
    [
      "isAnagram",
      [["s", "string"], ["t", "string"]],
      "boolean",
      "pure_function",
      "exact",
    ],
    [{ s: "binary", t: "brainy" }, true],
  ),
  problem(
    [49, 43, "group-anagrams", "Group Anagrams", "Medium", "Hashmap"],
    [
      "groupAnagrams",
      [["strs", "string_array"]],
      "string_matrix",
      "pure_function",
      "multiset",
    ],
    [{ strs: ["tea", "eat", "tan"] }, [["tea", "eat"], ["tan"]]],
    { comparisonConfig: { depth: "deep" } },
  ),
  problem(
    [1, 44, "two-sum", "Two Sum", "Easy", "Hashmap"],
    [
      "twoSum",
      [["nums", "integer_array"], ["target", "integer"]],
      "integer_array",
      "pure_function",
      "multiset",
    ],
    [{ nums: [6, 1, 8], target: 9 }, [1, 2]],
  ),
  problem(
    [202, 45, "happy-number", "Happy Number", "Easy", "Hashmap"],
    ["isHappy", [["n", "integer"]], "boolean", "pure_function", "exact"],
    [{ n: 7 }, true],
  ),
  problem(
    [
      219,
      46,
      "contains-duplicate-ii",
      "Contains Duplicate II",
      "Easy",
      "Hashmap",
    ],
    [
      "containsNearbyDuplicate",
      [["nums", "integer_array"], ["k", "integer"]],
      "boolean",
      "pure_function",
      "exact",
    ],
    [{ nums: [1, 4, 1], k: 2 }, true],
  ),
  problem(
    [
      128,
      47,
      "longest-consecutive-sequence",
      "Longest Consecutive Sequence",
      "Medium",
      "Hashmap",
    ],
    [
      "longestConsecutive",
      [["nums", "integer_array"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ nums: [9, 1, 3, 2] }, 3],
  ),
  problem(
    [228, 48, "summary-ranges", "Summary Ranges", "Easy", "Intervals"],
    [
      "summaryRanges",
      [["nums", "integer_array"]],
      "string_array",
      "pure_function",
      "exact",
    ],
    [{ nums: [1, 2, 4, 7, 8] }, ["1->2", "4", "7->8"]],
  ),
  problem(
    [56, 49, "merge-intervals", "Merge Intervals", "Medium", "Intervals"],
    [
      "merge",
      [["intervals", "integer_matrix"]],
      "integer_matrix",
      "pure_function",
      "exact",
    ],
    [{ intervals: [[1, 2], [2, 4], [7, 8]] }, [[1, 4], [7, 8]]],
  ),
  problem(
    [57, 50, "insert-interval", "Insert Interval", "Medium", "Intervals"],
    [
      "insert",
      [["intervals", "integer_matrix"], ["newInterval", "integer_array"]],
      "integer_matrix",
      "pure_function",
      "exact",
    ],
    [{ intervals: [[1, 2], [6, 8]], newInterval: [3, 7] }, [[1, 2], [3, 8]]],
  ),
  problem(
    [
      452,
      51,
      "minimum-number-of-arrows-to-burst-balloons",
      "Minimum Number of Arrows to Burst Balloons",
      "Medium",
      "Intervals",
    ],
    [
      "findMinArrowShots",
      [["points", "integer_matrix"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ points: [[1, 2], [4, 6], [5, 8]] }, 2],
  ),
  problem(
    [20, 52, "valid-parentheses", "Valid Parentheses", "Easy", "Stack"],
    ["isValid", [["s", "string"]], "boolean", "pure_function", "exact"],
    [{ s: "([]{})" }, true],
  ),
  problem(
    [71, 53, "simplify-path", "Simplify Path", "Medium", "Stack"],
    ["simplifyPath", [["path", "string"]], "string", "pure_function", "exact"],
    [{ path: "/a/./b/../c//" }, "/a/c"],
  ),
  designProblem(
    [155, 54, "min-stack", "Min Stack", "Medium", "Stack"],
    "MinStack",
    [
      {
        operations: ["MinStack", "push", "push", "getMin", "pop", "top"],
        arguments: [[], [4], [1], [], [], []],
      },
      [null, null, null, 1, null, 4],
    ],
  ),
  problem(
    [
      150,
      55,
      "evaluate-reverse-polish-notation",
      "Evaluate Reverse Polish Notation",
      "Medium",
      "Stack",
    ],
    ["evalRPN", [["tokens", "string_array"]], "integer", "pure_function", "exact"],
    [{ tokens: ["7", "3", "-"] }, 4],
  ),
  problem(
    [224, 56, "basic-calculator", "Basic Calculator", "Hard", "Stack"],
    ["calculate", [["s", "string"]], "integer", "pure_function", "exact"],
    [{ s: "8-(3+2)" }, 3],
  ),
  problem(
    [141, 57, "linked-list-cycle", "Linked List Cycle", "Easy", "Linked List"],
    [
      "hasCycle",
      [["head", "linked_list"]],
      "boolean",
      "pure_function",
      "exact",
    ],
    [{ head: [5, 6, 7], pos: 0 }, true],
    {
      adapters: { head: "linked_list_with_cycle" },
      adapterBindings: { head: { auxiliaryInput: "pos" } },
      auxiliaryInputs: [["pos", "integer"]],
    },
  ),
  problem(
    [2, 58, "add-two-numbers", "Add Two Numbers", "Medium", "Linked List"],
    [
      "addTwoNumbers",
      [["l1", "linked_list"], ["l2", "linked_list"]],
      "linked_list",
      "pure_function",
      "exact",
    ],
    [{ l1: [2, 4], l2: [5, 6] }, [7, 0, 1]],
  ),
  problem(
    [
      21,
      59,
      "merge-two-sorted-lists",
      "Merge Two Sorted Lists",
      "Easy",
      "Linked List",
    ],
    [
      "mergeTwoLists",
      [["list1", "linked_list"], ["list2", "linked_list"]],
      "linked_list",
      "pure_function",
      "exact",
    ],
    [{ list1: [1, 4], list2: [2, 3] }, [1, 2, 3, 4]],
  ),
  problem(
    [
      138,
      60,
      "copy-list-with-random-pointer",
      "Copy List with Random Pointer",
      "Medium",
      "Linked List",
    ],
    [
      "copyRandomList",
      [["head", "random_pointer_list"]],
      "random_pointer_list",
      "pure_function",
      "exact",
    ],
    [{ head: [[7, null], [9, 0]] }, [[7, null], [9, 0]]],
  ),
  problem(
    [
      92,
      61,
      "reverse-linked-list-ii",
      "Reverse Linked List II",
      "Medium",
      "Linked List",
    ],
    [
      "reverseBetween",
      [["head", "linked_list"], ["left", "integer"], ["right", "integer"]],
      "linked_list",
      "pure_function",
      "exact",
    ],
    [{ head: [1, 2, 3, 4], left: 2, right: 3 }, [1, 3, 2, 4]],
  ),
  problem(
    [
      25,
      62,
      "reverse-nodes-in-k-group",
      "Reverse Nodes in k-Group",
      "Hard",
      "Linked List",
    ],
    [
      "reverseKGroup",
      [["head", "linked_list"], ["k", "integer"]],
      "linked_list",
      "pure_function",
      "exact",
    ],
    [{ head: [1, 2, 3, 4], k: 2 }, [2, 1, 4, 3]],
  ),
  problem(
    [
      19,
      63,
      "remove-nth-node-from-end-of-list",
      "Remove Nth Node From End of List",
      "Medium",
      "Linked List",
    ],
    [
      "removeNthFromEnd",
      [["head", "linked_list"], ["n", "integer"]],
      "linked_list",
      "pure_function",
      "exact",
    ],
    [{ head: [1, 2, 3], n: 2 }, [1, 3]],
  ),
  problem(
    [
      82,
      64,
      "remove-duplicates-from-sorted-list-ii",
      "Remove Duplicates from Sorted List II",
      "Medium",
      "Linked List",
    ],
    [
      "deleteDuplicates",
      [["head", "linked_list"]],
      "linked_list",
      "pure_function",
      "exact",
    ],
    [{ head: [1, 1, 2, 3, 3] }, [2]],
  ),
  problem(
    [61, 65, "rotate-list", "Rotate List", "Medium", "Linked List"],
    [
      "rotateRight",
      [["head", "linked_list"], ["k", "integer"]],
      "linked_list",
      "pure_function",
      "exact",
    ],
    [{ head: [1, 2, 3, 4], k: 1 }, [4, 1, 2, 3]],
  ),
  problem(
    [86, 66, "partition-list", "Partition List", "Medium", "Linked List"],
    [
      "partition",
      [["head", "linked_list"], ["x", "integer"]],
      "linked_list",
      "pure_function",
      "exact",
    ],
    [{ head: [4, 1, 3, 2], x: 3 }, [1, 2, 4, 3]],
  ),
  designProblem(
    [146, 67, "lru-cache", "LRU Cache", "Medium", "Linked List"],
    "LRUCache",
    [
      {
        operations: ["LRUCache", "put", "get", "put", "get", "get"],
        arguments: [[1], [1, 7], [1], [2, 8], [1], [2]],
      },
      [null, null, 7, null, -1, 8],
    ],
  ),
  problem(
    [
      104,
      68,
      "maximum-depth-of-binary-tree",
      "Maximum Depth of Binary Tree",
      "Easy",
      "Binary Tree General",
    ],
    ["maxDepth", [["root", "binary_tree"]], "integer", "pure_function", "exact"],
    [{ root: [5, 3, 8, null, 4] }, 3],
  ),
  problem(
    [100, 69, "same-tree", "Same Tree", "Easy", "Binary Tree General"],
    [
      "isSameTree",
      [["p", "binary_tree"], ["q", "binary_tree"]],
      "boolean",
      "pure_function",
      "exact",
    ],
    [{ p: [1, 2, 3], q: [1, 2, 4] }, false],
  ),
  problem(
    [
      226,
      70,
      "invert-binary-tree",
      "Invert Binary Tree",
      "Easy",
      "Binary Tree General",
    ],
    [
      "invertTree",
      [["root", "binary_tree"]],
      "binary_tree",
      "pure_function",
      "exact",
    ],
    [{ root: [8, 3, 10, 1, 6] }, [8, 10, 3, null, null, 6, 1]],
  ),
  problem(
    [101, 71, "symmetric-tree", "Symmetric Tree", "Easy", "Binary Tree General"],
    ["isSymmetric", [["root", "binary_tree"]], "boolean", "pure_function", "exact"],
    [{ root: [1, 2, 2] }, true],
  ),
  problem(
    [
      105,
      72,
      "construct-binary-tree-from-preorder-and-inorder-traversal",
      "Construct Binary Tree from Preorder and Inorder Traversal",
      "Medium",
      "Binary Tree General",
    ],
    [
      "buildTree",
      [["preorder", "integer_array"], ["inorder", "integer_array"]],
      "binary_tree",
      "pure_function",
      "exact",
    ],
    [{ preorder: [2, 1, 3], inorder: [1, 2, 3] }, [2, 1, 3]],
  ),
  problem(
    [
      106,
      73,
      "construct-binary-tree-from-inorder-and-postorder-traversal",
      "Construct Binary Tree from Inorder and Postorder Traversal",
      "Medium",
      "Binary Tree General",
    ],
    [
      "buildTree",
      [["inorder", "integer_array"], ["postorder", "integer_array"]],
      "binary_tree",
      "pure_function",
      "exact",
    ],
    [{ inorder: [1, 2, 3], postorder: [1, 3, 2] }, [2, 1, 3]],
  ),
  problem(
    [
      117,
      74,
      "populating-next-right-pointers-in-each-node-ii",
      "Populating Next Right Pointers in Each Node II",
      "Medium",
      "Binary Tree General",
    ],
    [
      "connect",
      [["root", "next_pointer_tree"]],
      "next_pointer_tree",
      "pure_function",
      "exact",
    ],
    [{ root: [1, 2, 3, 4, null, null, 5] }, [1, "#", 2, 3, "#", 4, 5, "#"]],
    { outputType: "next_pointer_levels" },
  ),
  problem(
    [
      114,
      75,
      "flatten-binary-tree-to-linked-list",
      "Flatten Binary Tree to Linked List",
      "Medium",
      "Binary Tree General",
    ],
    [
      "flatten",
      [["root", "binary_tree"]],
      "void",
      "inplace_argument",
      "inplace_argument",
    ],
    [{ root: [1, 2, 3] }, [1, null, 2, null, 3]],
  ),
  problem(
    [112, 76, "path-sum", "Path Sum", "Easy", "Binary Tree General"],
    [
      "hasPathSum",
      [["root", "binary_tree"], ["targetSum", "integer"]],
      "boolean",
      "pure_function",
      "exact",
    ],
    [{ root: [5, 3, 8], targetSum: 8 }, true],
  ),
  problem(
    [
      129,
      77,
      "sum-root-to-leaf-numbers",
      "Sum Root to Leaf Numbers",
      "Medium",
      "Binary Tree General",
    ],
    ["sumNumbers", [["root", "binary_tree"]], "integer", "pure_function", "exact"],
    [{ root: [2, 1, 3] }, 44],
  ),
  problem(
    [
      124,
      78,
      "binary-tree-maximum-path-sum",
      "Binary Tree Maximum Path Sum",
      "Hard",
      "Binary Tree General",
    ],
    ["maxPathSum", [["root", "binary_tree"]], "integer", "pure_function", "exact"],
    [{ root: [-4, -2, -5] }, -2],
  ),
  designProblem(
    [
      173,
      79,
      "binary-search-tree-iterator",
      "Binary Search Tree Iterator",
      "Medium",
      "Binary Tree General",
    ],
    "BSTIterator",
    [
      {
        operations: [
          "BSTIterator",
          "next",
          "hasNext",
          "next",
          "hasNext",
          "next",
          "hasNext",
        ],
        arguments: [[[2, 1, 3]], [], [], [], [], [], []],
      },
      [null, 1, true, 2, true, 3, false],
    ],
    undefined,
    { BSTIterator: ["binary_tree"] },
  ),
  problem(
    [
      222,
      80,
      "count-complete-tree-nodes",
      "Count Complete Tree Nodes",
      "Easy",
      "Binary Tree General",
    ],
    ["countNodes", [["root", "binary_tree"]], "integer", "pure_function", "exact"],
    [{ root: [1, 2, 3, 4, 5] }, 5],
  ),
  problem(
    [
      236,
      81,
      "lowest-common-ancestor-of-a-binary-tree",
      "Lowest Common Ancestor of a Binary Tree",
      "Medium",
      "Binary Tree General",
    ],
    [
      "lowestCommonAncestor",
      [
        ["root", "binary_tree"],
        ["p", "binary_tree"],
        ["q", "binary_tree"],
      ],
      "binary_tree",
      "pure_function",
      "exact",
    ],
    [{ root: [2, 1, 3], p: 1, q: 3 }, [2, 1, 3]],
    {
      adapters: {
        p: "binary_tree_node_reference",
        q: "binary_tree_node_reference",
      },
      adapterBindings: {
        p: { referenceRootParameter: "root" },
        q: { referenceRootParameter: "root" },
      },
      inputTypes: { p: "integer", q: "integer" },
    },
  ),
  problem(
    [
      199,
      82,
      "binary-tree-right-side-view",
      "Binary Tree Right Side View",
      "Medium",
      "Binary Tree BFS",
    ],
    [
      "rightSideView",
      [["root", "binary_tree"]],
      "integer_array",
      "pure_function",
      "exact",
    ],
    [{ root: [1, 2, 3, null, 5] }, [1, 3, 5]],
  ),
  problem(
    [
      637,
      83,
      "average-of-levels-in-binary-tree",
      "Average of Levels in Binary Tree",
      "Easy",
      "Binary Tree BFS",
    ],
    [
      "averageOfLevels",
      [["root", "binary_tree"]],
      "number_array",
      "pure_function",
      "float_tolerance",
    ],
    [{ root: [4, 2, 6] }, [4, 4]],
    { comparisonConfig: { epsilon: 0.000001 } },
  ),
  problem(
    [
      102,
      84,
      "binary-tree-level-order-traversal",
      "Binary Tree Level Order Traversal",
      "Medium",
      "Binary Tree BFS",
    ],
    [
      "levelOrder",
      [["root", "binary_tree"]],
      "integer_matrix",
      "pure_function",
      "exact",
    ],
    [{ root: [1, 2, 3, 4, null, null, 5] }, [[1], [2, 3], [4, 5]]],
  ),
  problem(
    [
      103,
      85,
      "binary-tree-zigzag-level-order-traversal",
      "Binary Tree Zigzag Level Order Traversal",
      "Medium",
      "Binary Tree BFS",
    ],
    [
      "zigzagLevelOrder",
      [["root", "binary_tree"]],
      "integer_matrix",
      "pure_function",
      "exact",
    ],
    [{ root: [1, 2, 3, 4, null, null, 5] }, [[1], [3, 2], [4, 5]]],
  ),
  problem(
    [
      530,
      86,
      "minimum-absolute-difference-in-bst",
      "Minimum Absolute Difference in BST",
      "Easy",
      "Binary Search Tree",
    ],
    [
      "getMinimumDifference",
      [["root", "binary_tree"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ root: [4, 2, 7, 1, 3] }, 1],
  ),
  problem(
    [
      230,
      87,
      "kth-smallest-element-in-a-bst",
      "Kth Smallest Element in a BST",
      "Medium",
      "Binary Search Tree",
    ],
    [
      "kthSmallest",
      [["root", "binary_tree"], ["k", "integer"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ root: [5, 3, 7, 2, 4, 6, 8], k: 3 }, 4],
  ),
  problem(
    [
      98,
      88,
      "validate-binary-search-tree",
      "Validate Binary Search Tree",
      "Medium",
      "Binary Search Tree",
    ],
    ["isValidBST", [["root", "binary_tree"]], "boolean", "pure_function", "exact"],
    [{ root: [5, 3, 7, 2, 6] }, false],
  ),
  problem(
    [200, 89, "number-of-islands", "Number of Islands", "Medium", "Graph General"],
    [
      "numIslands",
      [["grid", "character_matrix"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ grid: [["1", "0", "1"], ["1", "0", "0"]] }, 2],
  ),
  problem(
    [130, 90, "surrounded-regions", "Surrounded Regions", "Medium", "Graph General"],
    [
      "solve",
      [["board", "character_matrix"]],
      "void",
      "inplace_argument",
      "inplace_argument",
    ],
    [
      { board: [["X", "X", "X"], ["X", "O", "X"], ["X", "X", "X"]] },
      [["X", "X", "X"], ["X", "X", "X"], ["X", "X", "X"]],
    ],
  ),
  problem(
    [133, 91, "clone-graph", "Clone Graph", "Medium", "Graph General"],
    [
      "cloneGraph",
      [["node", "graph_adjacency_list"]],
      "graph_adjacency_list",
      "pure_function",
      "exact",
    ],
    [{ node: [[2], [1, 3], [2]] }, [[2], [1, 3], [2]]],
  ),
  problem(
    [399, 92, "evaluate-division", "Evaluate Division", "Medium", "Graph General"],
    [
      "calcEquation",
      [
        ["equations", "string_matrix"],
        ["values", "number_array"],
        ["queries", "string_matrix"],
      ],
      "number_array",
      "pure_function",
      "float_tolerance",
    ],
    [
      {
        equations: [["a", "b"], ["b", "c"]],
        values: [2, 3],
        queries: [["a", "c"], ["c", "a"], ["a", "x"]],
      },
      [6, 1 / 6, -1],
    ],
    { comparisonConfig: { epsilon: 0.000001 } },
  ),
  problem(
    [207, 93, "course-schedule", "Course Schedule", "Medium", "Graph General"],
    [
      "canFinish",
      [["numCourses", "integer"], ["prerequisites", "integer_matrix"]],
      "boolean",
      "pure_function",
      "exact",
    ],
    [{ numCourses: 3, prerequisites: [[1, 0], [2, 1]] }, true],
  ),
  problem(
    [
      210,
      94,
      "course-schedule-ii",
      "Course Schedule II",
      "Medium",
      "Graph General",
    ],
    [
      "findOrder",
      [["numCourses", "integer"], ["prerequisites", "integer_matrix"]],
      "integer_array",
      "pure_function",
      "public_special_judge",
    ],
    [{ numCourses: 3, prerequisites: [[1, 0], [2, 1]] }, [0, 1, 2]],
    {
      comparisonConfig: {
        kind: "topological_order",
        countParameter: "numCourses",
        edgesParameter: "prerequisites",
      },
    },
  ),
  problem(
    [909, 95, "snakes-and-ladders", "Snakes and Ladders", "Medium", "Graph BFS"],
    [
      "snakesAndLadders",
      [["board", "integer_matrix"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ board: [[-1, -1], [-1, -1]] }, 1],
  ),
  problem(
    [
      433,
      96,
      "minimum-genetic-mutation",
      "Minimum Genetic Mutation",
      "Medium",
      "Graph BFS",
    ],
    [
      "minMutation",
      [["startGene", "string"], ["endGene", "string"], ["bank", "string_array"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [
      { startGene: "CCCCGGGG", endGene: "CCCCGGGA", bank: ["CCCCGGGA"] },
      1,
    ],
  ),
  problem(
    [127, 97, "word-ladder", "Word Ladder", "Hard", "Graph BFS"],
    [
      "ladderLength",
      [["beginWord", "string"], ["endWord", "string"], ["wordList", "string_array"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ beginWord: "hit", endWord: "hot", wordList: ["hot"] }, 2],
  ),
  designProblem(
    [
      208,
      98,
      "implement-trie-prefix-tree",
      "Implement Trie (Prefix Tree)",
      "Medium",
      "Trie",
    ],
    "Trie",
    [
      {
        operations: ["Trie", "insert", "search", "startsWith", "search"],
        arguments: [[], ["cat"], ["cat"], ["ca"], ["car"]],
      },
      [null, null, true, true, false],
    ],
  ),
  designProblem(
    [
      211,
      99,
      "design-add-and-search-words-data-structure",
      "Design Add and Search Words Data Structure",
      "Medium",
      "Trie",
    ],
    "WordDictionary",
    [
      {
        operations: [
          "WordDictionary",
          "addWord",
          "addWord",
          "search",
          "search",
          "search",
        ],
        arguments: [[], ["bad"], ["dad"], [".ad"], ["b.."], ["pad"]],
      },
      [null, null, null, true, true, false],
    ],
  ),
  problem(
    [212, 100, "word-search-ii", "Word Search II", "Hard", "Trie"],
    [
      "findWords",
      [["board", "character_matrix"], ["words", "string_array"]],
      "string_array",
      "pure_function",
      "multiset",
    ],
    [
      { board: [["a", "b"], ["c", "d"]], words: ["ab", "ac", "bd", "abc"] },
      ["ab", "ac", "bd"],
    ],
  ),
  problem(
    [
      17,
      101,
      "letter-combinations-of-a-phone-number",
      "Letter Combinations of a Phone Number",
      "Medium",
      "Backtracking",
    ],
    [
      "letterCombinations",
      [["digits", "string"]],
      "string_array",
      "pure_function",
      "multiset",
    ],
    [{ digits: "7" }, ["p", "q", "r", "s"]],
  ),
  problem(
    [77, 102, "combinations", "Combinations", "Medium", "Backtracking"],
    [
      "combine",
      [["n", "integer"], ["k", "integer"]],
      "integer_matrix",
      "pure_function",
      "multiset",
    ],
    [{ n: 3, k: 2 }, [[1, 2], [1, 3], [2, 3]]],
    { comparisonConfig: { depth: "deep" } },
  ),
  problem(
    [46, 103, "permutations", "Permutations", "Medium", "Backtracking"],
    [
      "permute",
      [["nums", "integer_array"]],
      "integer_matrix",
      "pure_function",
      "multiset",
    ],
    [{ nums: [1, 2] }, [[1, 2], [2, 1]]],
  ),
  problem(
    [39, 104, "combination-sum", "Combination Sum", "Medium", "Backtracking"],
    [
      "combinationSum",
      [["candidates", "integer_array"], ["target", "integer"]],
      "integer_matrix",
      "pure_function",
      "multiset",
    ],
    [{ candidates: [2, 3, 5], target: 5 }, [[2, 3], [5]]],
    { comparisonConfig: { depth: "deep" } },
  ),
  problem(
    [52, 105, "n-queens-ii", "N-Queens II", "Hard", "Backtracking"],
    ["totalNQueens", [["n", "integer"]], "integer", "pure_function", "exact"],
    [{ n: 5 }, 10],
  ),
  problem(
    [
      22,
      106,
      "generate-parentheses",
      "Generate Parentheses",
      "Medium",
      "Backtracking",
    ],
    [
      "generateParenthesis",
      [["n", "integer"]],
      "string_array",
      "pure_function",
      "multiset",
    ],
    [{ n: 2 }, ["(())", "()()"]],
  ),
  problem(
    [79, 107, "word-search", "Word Search", "Medium", "Backtracking"],
    [
      "exist",
      [["board", "character_matrix"], ["word", "string"]],
      "boolean",
      "pure_function",
      "exact",
    ],
    [{ board: [["A", "B"], ["C", "D"]], word: "AB" }, true],
  ),
  problem(
    [
      108,
      108,
      "convert-sorted-array-to-binary-search-tree",
      "Convert Sorted Array to Binary Search Tree",
      "Easy",
      "Divide & Conquer",
    ],
    [
      "sortedArrayToBST",
      [["nums", "integer_array"]],
      "binary_tree",
      "pure_function",
      "exact",
    ],
    [{ nums: [-2, 0, 5] }, [0, -2, 5]],
  ),
  problem(
    [148, 109, "sort-list", "Sort List", "Medium", "Divide & Conquer"],
    ["sortList", [["head", "linked_list"]], "linked_list", "pure_function", "exact"],
    [{ head: [4, 1, 3] }, [1, 3, 4]],
  ),
  problem(
    [
      427,
      110,
      "construct-quad-tree",
      "Construct Quad Tree",
      "Medium",
      "Divide & Conquer",
    ],
    [
      "construct",
      [["grid", "integer_matrix"]],
      "quad_tree",
      "pure_function",
      "exact",
    ],
    [{ grid: [[1, 1], [1, 1]] }, [[1, 1]]],
  ),
  problem(
    [
      23,
      111,
      "merge-k-sorted-lists",
      "Merge k Sorted Lists",
      "Hard",
      "Divide & Conquer",
    ],
    [
      "mergeKLists",
      [["lists", "linked_list_array"]],
      "linked_list",
      "pure_function",
      "exact",
    ],
    [{ lists: [[1, 4], [2, 3], null] }, [1, 2, 3, 4]],
  ),
  problem(
    [
      53,
      112,
      "maximum-subarray",
      "Maximum Subarray",
      "Medium",
      "Kadane's Algorithm",
    ],
    ["maxSubArray", [["nums", "integer_array"]], "integer", "pure_function", "exact"],
    [{ nums: [-2, 4, -1, 2, -5] }, 5],
  ),
  problem(
    [
      918,
      113,
      "maximum-sum-circular-subarray",
      "Maximum Sum Circular Subarray",
      "Medium",
      "Kadane's Algorithm",
    ],
    [
      "maxSubarraySumCircular",
      [["nums", "integer_array"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ nums: [5, -6, 4] }, 9],
  ),
  problem(
    [
      35,
      114,
      "search-insert-position",
      "Search Insert Position",
      "Easy",
      "Binary Search",
    ],
    [
      "searchInsert",
      [["nums", "integer_array"], ["target", "integer"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ nums: [1, 4, 7, 9], target: 6 }, 2],
  ),
  problem(
    [
      74,
      115,
      "search-a-2d-matrix",
      "Search a 2D Matrix",
      "Medium",
      "Binary Search",
    ],
    [
      "searchMatrix",
      [["matrix", "integer_matrix"], ["target", "integer"]],
      "boolean",
      "pure_function",
      "exact",
    ],
    [{ matrix: [[1, 3], [6, 9]], target: 6 }, true],
  ),
  problem(
    [162, 116, "find-peak-element", "Find Peak Element", "Medium", "Binary Search"],
    [
      "findPeakElement",
      [["nums", "integer_array"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ nums: [1, 5, 2] }, 1],
  ),
  problem(
    [
      33,
      117,
      "search-in-rotated-sorted-array",
      "Search in Rotated Sorted Array",
      "Medium",
      "Binary Search",
    ],
    [
      "search",
      [["nums", "integer_array"], ["target", "integer"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ nums: [6, 8, 1, 3, 5], target: 3 }, 3],
  ),
  problem(
    [
      34,
      118,
      "find-first-and-last-position-of-element-in-sorted-array",
      "Find First and Last Position of Element in Sorted Array",
      "Medium",
      "Binary Search",
    ],
    [
      "searchRange",
      [["nums", "integer_array"], ["target", "integer"]],
      "integer_array",
      "pure_function",
      "exact",
    ],
    [{ nums: [1, 2, 2, 2, 5], target: 2 }, [1, 3]],
  ),
  problem(
    [
      153,
      119,
      "find-minimum-in-rotated-sorted-array",
      "Find Minimum in Rotated Sorted Array",
      "Medium",
      "Binary Search",
    ],
    ["findMin", [["nums", "integer_array"]], "integer", "pure_function", "exact"],
    [{ nums: [7, 9, 2, 4, 5] }, 2],
  ),
  problem(
    [
      4,
      120,
      "median-of-two-sorted-arrays",
      "Median of Two Sorted Arrays",
      "Hard",
      "Binary Search",
    ],
    [
      "findMedianSortedArrays",
      [["nums1", "integer_array"], ["nums2", "integer_array"]],
      "number",
      "pure_function",
      "float_tolerance",
    ],
    [{ nums1: [1, 5], nums2: [2, 4] }, 3],
    { comparisonConfig: { epsilon: 0.000001 } },
  ),
  problem(
    [
      215,
      121,
      "kth-largest-element-in-an-array",
      "Kth Largest Element in an Array",
      "Medium",
      "Heap",
    ],
    [
      "findKthLargest",
      [["nums", "integer_array"], ["k", "integer"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ nums: [8, 3, 6, 1], k: 2 }, 6],
  ),
  problem(
    [502, 122, "ipo", "IPO", "Hard", "Heap"],
    [
      "findMaximizedCapital",
      [
        ["k", "integer"],
        ["w", "integer"],
        ["profits", "integer_array"],
        ["capital", "integer_array"],
      ],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ k: 2, w: 0, profits: [1, 4, 2], capital: [0, 1, 1] }, 5],
  ),
  problem(
    [
      373,
      123,
      "find-k-pairs-with-smallest-sums",
      "Find K Pairs with Smallest Sums",
      "Medium",
      "Heap",
    ],
    [
      "kSmallestPairs",
      [["nums1", "integer_array"], ["nums2", "integer_array"], ["k", "integer"]],
      "integer_matrix",
      "pure_function",
      "multiset",
    ],
    [{ nums1: [1, 3], nums2: [4, 10], k: 2 }, [[1, 4], [3, 4]]],
  ),
  designProblem(
    [
      295,
      124,
      "find-median-from-data-stream",
      "Find Median from Data Stream",
      "Hard",
      "Heap",
    ],
    "MedianFinder",
    [
      {
        operations: [
          "MedianFinder",
          "addNum",
          "findMedian",
          "addNum",
          "findMedian",
          "addNum",
          "findMedian",
        ],
        arguments: [[], [4], [], [8], [], [2], []],
      },
      [null, null, 4, null, 6, null, 4],
    ],
    { epsilon: 0.000001 },
  ),
  problem(
    [67, 125, "add-binary", "Add Binary", "Easy", "Bit Manipulation"],
    [
      "addBinary",
      [["a", "string"], ["b", "string"]],
      "string",
      "pure_function",
      "exact",
    ],
    [{ a: "101", b: "11" }, "1000"],
  ),
  problem(
    [190, 126, "reverse-bits", "Reverse Bits", "Easy", "Bit Manipulation"],
    ["reverseBits", [["n", "integer"]], "integer", "pure_function", "exact"],
    [{ n: 1 }, 2147483648],
  ),
  problem(
    [191, 127, "number-of-1-bits", "Number of 1 Bits", "Easy", "Bit Manipulation"],
    ["hammingWeight", [["n", "integer"]], "integer", "pure_function", "exact"],
    [{ n: 45 }, 4],
  ),
  problem(
    [136, 128, "single-number", "Single Number", "Easy", "Bit Manipulation"],
    ["singleNumber", [["nums", "integer_array"]], "integer", "pure_function", "exact"],
    [{ nums: [6, 2, 6] }, 2],
  ),
  problem(
    [137, 129, "single-number-ii", "Single Number II", "Medium", "Bit Manipulation"],
    ["singleNumber", [["nums", "integer_array"]], "integer", "pure_function", "exact"],
    [{ nums: [4, 4, 4, -2] }, -2],
  ),
  problem(
    [
      201,
      130,
      "bitwise-and-of-numbers-range",
      "Bitwise AND of Numbers Range",
      "Medium",
      "Bit Manipulation",
    ],
    [
      "rangeBitwiseAnd",
      [["left", "integer"], ["right", "integer"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ left: 10, right: 12 }, 8],
  ),
  problem(
    [9, 131, "palindrome-number", "Palindrome Number", "Easy", "Math"],
    ["isPalindrome", [["x", "integer"]], "boolean", "pure_function", "exact"],
    [{ x: 12321 }, true],
  ),
  problem(
    [66, 132, "plus-one", "Plus One", "Easy", "Math"],
    ["plusOne", [["digits", "integer_array"]], "integer_array", "pure_function", "exact"],
    [{ digits: [8, 9, 9] }, [9, 0, 0]],
  ),
  problem(
    [
      172,
      133,
      "factorial-trailing-zeroes",
      "Factorial Trailing Zeroes",
      "Medium",
      "Math",
    ],
    ["trailingZeroes", [["n", "integer"]], "integer", "pure_function", "exact"],
    [{ n: 25 }, 6],
  ),
  problem(
    [69, 134, "sqrtx", "Sqrt(x)", "Easy", "Math"],
    ["mySqrt", [["x", "integer"]], "integer", "pure_function", "exact"],
    [{ x: 35 }, 5],
  ),
  problem(
    [50, 135, "powx-n", "Pow(x, n)", "Medium", "Math"],
    [
      "myPow",
      [["x", "number"], ["n", "integer"]],
      "number",
      "pure_function",
      "float_tolerance",
    ],
    [{ x: 2.5, n: 2 }, 6.25],
    { comparisonConfig: { epsilon: 0.000001 } },
  ),
  problem(
    [149, 136, "max-points-on-a-line", "Max Points on a Line", "Hard", "Math"],
    [
      "maxPoints",
      [["points", "integer_matrix"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ points: [[0, 0], [1, 1], [2, 2], [2, 0]] }, 3],
  ),
  problem(
    [70, 137, "climbing-stairs", "Climbing Stairs", "Easy", "1D DP"],
    ["climbStairs", [["n", "integer"]], "integer", "pure_function", "exact"],
    [{ n: 4 }, 5],
  ),
  problem(
    [198, 138, "house-robber", "House Robber", "Medium", "1D DP"],
    ["rob", [["nums", "integer_array"]], "integer", "pure_function", "exact"],
    [{ nums: [2, 9, 4, 1] }, 10],
  ),
  problem(
    [139, 139, "word-break", "Word Break", "Medium", "1D DP"],
    [
      "wordBreak",
      [["s", "string"], ["wordDict", "string_array"]],
      "boolean",
      "pure_function",
      "exact",
    ],
    [{ s: "coach", wordDict: ["co", "ach"] }, true],
  ),
  problem(
    [322, 140, "coin-change", "Coin Change", "Medium", "1D DP"],
    [
      "coinChange",
      [["coins", "integer_array"], ["amount", "integer"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ coins: [2, 5], amount: 7 }, 2],
  ),
  problem(
    [
      300,
      141,
      "longest-increasing-subsequence",
      "Longest Increasing Subsequence",
      "Medium",
      "1D DP",
    ],
    [
      "lengthOfLIS",
      [["nums", "integer_array"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ nums: [3, 1, 2, 5, 4] }, 3],
  ),
  problem(
    [120, 142, "triangle", "Triangle", "Medium", "Multidimensional DP"],
    [
      "minimumTotal",
      [["triangle", "integer_matrix"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ triangle: [[2], [5, 1], [4, 2, 7]] }, 5],
  ),
  problem(
    [
      64,
      143,
      "minimum-path-sum",
      "Minimum Path Sum",
      "Medium",
      "Multidimensional DP",
    ],
    ["minPathSum", [["grid", "integer_matrix"]], "integer", "pure_function", "exact"],
    [{ grid: [[1, 2, 3], [4, 1, 1]] }, 5],
  ),
  problem(
    [
      63,
      144,
      "unique-paths-ii",
      "Unique Paths II",
      "Medium",
      "Multidimensional DP",
    ],
    [
      "uniquePathsWithObstacles",
      [["obstacleGrid", "integer_matrix"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ obstacleGrid: [[0, 0, 0], [0, 1, 0]] }, 1],
  ),
  problem(
    [
      5,
      145,
      "longest-palindromic-substring",
      "Longest Palindromic Substring",
      "Medium",
      "Multidimensional DP",
    ],
    ["longestPalindrome", [["s", "string"]], "string", "pure_function", "exact"],
    [{ s: "cabacx" }, "cabac"],
  ),
  problem(
    [
      97,
      146,
      "interleaving-string",
      "Interleaving String",
      "Medium",
      "Multidimensional DP",
    ],
    [
      "isInterleave",
      [["s1", "string"], ["s2", "string"], ["s3", "string"]],
      "boolean",
      "pure_function",
      "exact",
    ],
    [{ s1: "ab", s2: "cd", s3: "acbd" }, true],
  ),
  problem(
    [72, 147, "edit-distance", "Edit Distance", "Medium", "Multidimensional DP"],
    [
      "minDistance",
      [["word1", "string"], ["word2", "string"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ word1: "coach", word2: "couch" }, 1],
  ),
  problem(
    [
      123,
      148,
      "best-time-to-buy-and-sell-stock-iii",
      "Best Time to Buy and Sell Stock III",
      "Hard",
      "Multidimensional DP",
    ],
    ["maxProfit", [["prices", "integer_array"]], "integer", "pure_function", "exact"],
    [{ prices: [3, 8, 2, 9] }, 12],
  ),
  problem(
    [
      188,
      149,
      "best-time-to-buy-and-sell-stock-iv",
      "Best Time to Buy and Sell Stock IV",
      "Hard",
      "Multidimensional DP",
    ],
    [
      "maxProfit",
      [["k", "integer"], ["prices", "integer_array"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ k: 1, prices: [3, 8, 2, 9] }, 7],
  ),
  problem(
    [221, 150, "maximal-square", "Maximal Square", "Medium", "Multidimensional DP"],
    [
      "maximalSquare",
      [["matrix", "character_matrix"]],
      "integer",
      "pure_function",
      "exact",
    ],
    [{ matrix: [["1", "1", "0"], ["1", "1", "0"]] }, 4],
  ),
] satisfies PublicHot150Problem[];

export const publicHot150Bank = definePublicHot150Bank({
  schemaVersion: 1,
  problems,
});

export {
  findPublicHot150Problem,
  validatePublicHot150Bank,
  validatePublicTestInput,
} from "./local-run-types";
export type {
  PublicHot150Bank,
  PublicHot150Problem,
  PublicValueType,
} from "./local-run-types";
