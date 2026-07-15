# Hot-150 Public Content Audit

Public v0.1 release gate for the independently authored Python-only runtime bank.

- Safe metadata: 150/150
- Python execution contracts: 150/150
- Schema/comparator/wrapper validation: 150/150
- Synthetic public visible-test sets: 150/150
- Exported private benchmark/hidden/reference/provenance assets: 0
- Independent release verifier: 150 PASS / 0 BLOCKED against public visible tests using real Piston; the private correctness oracle was not exported.
- Scope limit: these results validate the public contracts and visible tests, not official LeetCode hidden-test acceptance.

`Forbidden assets absent` jointly checks raw statements, benchmark or hidden cases, reference solutions/hashes, gold labels, private provenance, cached responses, and local absolute paths.

| Order | # | Slug | Safe metadata | Python contract | I/O + comparator | Wrapper builds | Public visible tests | Raw statement absent | Forbidden assets absent | Final |
|---:|---:|---|---|---|---|---|---|---|---|---|
| 1 | 88 | merge-sorted-array | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 2 | 27 | remove-element | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 3 | 26 | remove-duplicates-from-sorted-array | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 4 | 80 | remove-duplicates-from-sorted-array-ii | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 5 | 169 | majority-element | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 6 | 189 | rotate-array | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 7 | 121 | best-time-to-buy-and-sell-stock | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 8 | 122 | best-time-to-buy-and-sell-stock-ii | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 9 | 55 | jump-game | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 10 | 45 | jump-game-ii | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 11 | 274 | h-index | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 12 | 380 | insert-delete-getrandom-o1 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 13 | 238 | product-of-array-except-self | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 14 | 134 | gas-station | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 15 | 135 | candy | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 16 | 42 | trapping-rain-water | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 17 | 13 | roman-to-integer | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 18 | 12 | integer-to-roman | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 19 | 58 | length-of-last-word | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 20 | 14 | longest-common-prefix | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 21 | 151 | reverse-words-in-a-string | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 22 | 6 | zigzag-conversion | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 23 | 28 | find-the-index-of-the-first-occurrence-in-a-string | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 24 | 68 | text-justification | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 25 | 125 | valid-palindrome | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 26 | 392 | is-subsequence | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 27 | 167 | two-sum-ii-input-array-is-sorted | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 28 | 11 | container-with-most-water | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 29 | 15 | 3sum | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 30 | 209 | minimum-size-subarray-sum | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 31 | 3 | longest-substring-without-repeating-characters | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 32 | 30 | substring-with-concatenation-of-all-words | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 33 | 76 | minimum-window-substring | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 34 | 36 | valid-sudoku | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 35 | 54 | spiral-matrix | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 36 | 48 | rotate-image | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 37 | 73 | set-matrix-zeroes | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 38 | 289 | game-of-life | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 39 | 383 | ransom-note | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 40 | 205 | isomorphic-strings | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 41 | 290 | word-pattern | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 42 | 242 | valid-anagram | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 43 | 49 | group-anagrams | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 44 | 1 | two-sum | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 45 | 202 | happy-number | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 46 | 219 | contains-duplicate-ii | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 47 | 128 | longest-consecutive-sequence | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 48 | 228 | summary-ranges | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 49 | 56 | merge-intervals | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 50 | 57 | insert-interval | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 51 | 452 | minimum-number-of-arrows-to-burst-balloons | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 52 | 20 | valid-parentheses | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 53 | 71 | simplify-path | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 54 | 155 | min-stack | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 55 | 150 | evaluate-reverse-polish-notation | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 56 | 224 | basic-calculator | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 57 | 141 | linked-list-cycle | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 58 | 2 | add-two-numbers | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 59 | 21 | merge-two-sorted-lists | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 60 | 138 | copy-list-with-random-pointer | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 61 | 92 | reverse-linked-list-ii | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 62 | 25 | reverse-nodes-in-k-group | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 63 | 19 | remove-nth-node-from-end-of-list | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 64 | 82 | remove-duplicates-from-sorted-list-ii | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 65 | 61 | rotate-list | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 66 | 86 | partition-list | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 67 | 146 | lru-cache | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 68 | 104 | maximum-depth-of-binary-tree | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 69 | 100 | same-tree | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 70 | 226 | invert-binary-tree | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 71 | 101 | symmetric-tree | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 72 | 105 | construct-binary-tree-from-preorder-and-inorder-traversal | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 73 | 106 | construct-binary-tree-from-inorder-and-postorder-traversal | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 74 | 117 | populating-next-right-pointers-in-each-node-ii | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 75 | 114 | flatten-binary-tree-to-linked-list | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 76 | 112 | path-sum | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 77 | 129 | sum-root-to-leaf-numbers | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 78 | 124 | binary-tree-maximum-path-sum | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 79 | 173 | binary-search-tree-iterator | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 80 | 222 | count-complete-tree-nodes | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 81 | 236 | lowest-common-ancestor-of-a-binary-tree | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 82 | 199 | binary-tree-right-side-view | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 83 | 637 | average-of-levels-in-binary-tree | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 84 | 102 | binary-tree-level-order-traversal | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 85 | 103 | binary-tree-zigzag-level-order-traversal | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 86 | 530 | minimum-absolute-difference-in-bst | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 87 | 230 | kth-smallest-element-in-a-bst | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 88 | 98 | validate-binary-search-tree | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 89 | 200 | number-of-islands | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 90 | 130 | surrounded-regions | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 91 | 133 | clone-graph | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 92 | 399 | evaluate-division | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 93 | 207 | course-schedule | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 94 | 210 | course-schedule-ii | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 95 | 909 | snakes-and-ladders | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 96 | 433 | minimum-genetic-mutation | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 97 | 127 | word-ladder | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 98 | 208 | implement-trie-prefix-tree | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 99 | 211 | design-add-and-search-words-data-structure | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 100 | 212 | word-search-ii | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 101 | 17 | letter-combinations-of-a-phone-number | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 102 | 77 | combinations | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 103 | 46 | permutations | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 104 | 39 | combination-sum | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 105 | 52 | n-queens-ii | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 106 | 22 | generate-parentheses | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 107 | 79 | word-search | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 108 | 108 | convert-sorted-array-to-binary-search-tree | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 109 | 148 | sort-list | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 110 | 427 | construct-quad-tree | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 111 | 23 | merge-k-sorted-lists | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 112 | 53 | maximum-subarray | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 113 | 918 | maximum-sum-circular-subarray | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 114 | 35 | search-insert-position | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 115 | 74 | search-a-2d-matrix | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 116 | 162 | find-peak-element | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 117 | 33 | search-in-rotated-sorted-array | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 118 | 34 | find-first-and-last-position-of-element-in-sorted-array | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 119 | 153 | find-minimum-in-rotated-sorted-array | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 120 | 4 | median-of-two-sorted-arrays | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 121 | 215 | kth-largest-element-in-an-array | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 122 | 502 | ipo | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 123 | 373 | find-k-pairs-with-smallest-sums | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 124 | 295 | find-median-from-data-stream | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 125 | 67 | add-binary | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 126 | 190 | reverse-bits | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 127 | 191 | number-of-1-bits | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 128 | 136 | single-number | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 129 | 137 | single-number-ii | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 130 | 201 | bitwise-and-of-numbers-range | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 131 | 9 | palindrome-number | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 132 | 66 | plus-one | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 133 | 172 | factorial-trailing-zeroes | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 134 | 69 | sqrtx | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 135 | 50 | powx-n | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 136 | 149 | max-points-on-a-line | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 137 | 70 | climbing-stairs | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 138 | 198 | house-robber | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 139 | 139 | word-break | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 140 | 322 | coin-change | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 141 | 300 | longest-increasing-subsequence | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 142 | 120 | triangle | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 143 | 64 | minimum-path-sum | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 144 | 63 | unique-paths-ii | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 145 | 5 | longest-palindromic-substring | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 146 | 97 | interleaving-string | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 147 | 72 | edit-distance | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 148 | 123 | best-time-to-buy-and-sell-stock-iii | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 149 | 188 | best-time-to-buy-and-sell-stock-iv | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 150 | 221 | maximal-square | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

Notes: #108 and #162 use deterministic synthetic visible tests. If future public custom fixtures allow multiple answers, their comparators must be reviewed before release.
