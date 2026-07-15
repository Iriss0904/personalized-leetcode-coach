# PatternCoach Power User Playbook

PatternCoach is most useful when you treat it as a practice loop, not an answer box:

> create evidence → ask for one decision → run again → keep the lesson → revisit it

This guide assumes the app is already running. For installation and configuration, use the [Setup Guide](./user-setup.md). For service, database, or port problems, use [Troubleshooting](./troubleshooting.md).

## 1. Your First 10 Minutes

Take one short trip through the whole learning loop.

1. On **Initial Coach Profile**, save your display name and learning signals, or use **Skip**. You can edit strengths, weaknesses, and output preferences later under **Skill Profile**.
2. On **Today**, create a local plan with an interview date and weekly study hours. The initial queue is deterministic; later Review self-ratings add due items to **Review Focus**.
3. Start or continue a Today item, or use the page-level **Open Workbench** action and choose a problem from the **Hot-150 catalog** by exact number, title, or slug.
4. Use **Open original problem on LeetCode** to read the statement, then return to the **Python draft**. PatternCoach intentionally does not bundle the statement.
5. Write a partial attempt. A wrong but meaningful attempt is more useful than an empty editor.
6. Add one boundary case with **Add custom visible test**. Follow the key names in the displayed Python signature and enter both input and expected output as valid JSON.
7. Select **Run Code** and inspect **Real local execution evidence**.
8. Select **Review My Code**. Review runs the current tests again, then creates a saved Review grounded in that new execution.
9. If you need another step, use **Coach Chat** and ask for one hint, one invariant, or one walkthrough—not a replacement solution.
10. Keep one durable artifact: add a reusable idea to **Knowledge Handbook**, or let a failed Review become a **Mistake Book** item to revisit.

<!-- Screenshot: sanitized Workbench showing one failed visible test and Real local execution evidence. -->

## 2. The Best Coaching Starts With Evidence

A useful habit is: **Run first. Review second. Chat third.** Each action carries different context.

- **Run Code** executes the visible and custom tests you selected. It saves real execution evidence but does not create a Problem History Review entry.
- **Review My Code** executes the selected tests again. It gives **Coach Review** the resulting status, counts, and first failure, then saves the Review in **Problem History**.
- **Coach Chat** receives the current problem and draft, recent turns for that problem, focused Profile/Memory context, and your new message. It does not silently reuse the existing Run panel, but you can explicitly ask it to run the current code; the `run_current_code` tool then obtains fresh real Piston evidence.

That last distinction matters. If you ask Chat about an existing failure, include the useful evidence in the message: the input, expected value, actual value or error, and the variable you distrust. If you want the product to collect fresh evidence, use **Review My Code** or explicitly ask Chat to run the current code.

Custom visible tests are especially good for isolating one belief:

- the smallest empty or one-element case;
- a boundary equal to the target;
- a repeated value that challenges pointer movement;
- an input that makes one loop iteration easy to trace.

The draft autosaves to local SQLite while you edit. Custom tests also persist for that local problem workspace and are restored after reload.

Passing visible tests means only that those local cases passed. It is not hidden-test coverage or official LeetCode acceptance.

## 3. Ask for Less Than the Full Answer

There is no Hint Level control in the current public UI. Build a natural-language hint ladder instead, and stop as soon as you can continue alone.

1. **Observation** — ask what fact you are missing without naming the final algorithm.
2. **Invariant** — ask what must remain true after each iteration.
3. **Walkthrough** — provide one failing case and ask for a trace using your variables.
4. **Pseudocode** — request structure without executable Python.
5. **Implementation review** — ask for the smallest correction that preserves your approach.

The model-powered Coach is best suited to this ladder. The clearly labeled built-in local Coach remains useful for basic evidence summaries and a next-step prompt, but it is intentionally less conversational. With an external provider, the current draft, user message, focused Profile/Memory context, and requested tool results may leave your computer; review the [privacy guide](./privacy.md) first.

<!-- Screenshot: sanitized Coach Chat response to a one-hint-only request. -->

## 4. Tell the Coach What You Already Know

The Coach can only target the gap you make visible.

Weak request:

> I do not understand this problem.

Stronger request:

> I know this is a sliding-window problem. I do not know when removing the left character makes the window valid again. Give me one hint without code.

Include whichever details narrow the decision:

- the pattern you already recognize;
- the boundary convention you intended;
- the variable or line you distrust;
- the structure and variable names you want to keep;
- whether you want observation, invariant, trace, pseudocode, or code review;
- whether complexity is your current question.

**Skill Profile** stores editable signals that the external Review and Chat prompts use as focused context. If a preference matters for this exact turn—“one next step,” “no code,” or “use my variable names”—state it in the current message as well.

## 5. Use Familiar Patterns Without Getting Trapped by Them

Templates are helpful until two conventions get mixed. Ask the Coach to inspect the seam rather than restart the solution.

For example, keep a closed-interval binary-search loop and ask only whether `left`, `right`, and the midpoint updates follow the same convention. Or say that you understand the hash-map idea but want to know whether you check before or after inserting the current index.

PatternCoach can retrieve related records through its focused SQLite FTS5 memory and mistake-history tools. For an especially precise comparison, you can still use a manual workflow:

1. Filter **Problem History** by problem or tag, or open the related card in **Mistake Book**.
2. Copy the old trap or failing-case summary.
3. Return to the current Workbench and include that text in your Chat request.
4. Ask whether the current draft repeats the same failure.

Bringing the exact prior record into the message gives the Coach concrete material even when automatic retrieval selects a different recent item.

## 6. What PatternCoach Actually Carries Forward

PatternCoach keeps selected learning records across browser sessions, but it does not remember everything.

- A real executed **Run Code** or **Review My Code** saves the latest Python draft for that problem.
- A completed Review saves execution evidence, its Coach reply, a **Problem History** attempt, and a compact Review summary.
- With a configured model-powered Coach, focused facts and recent compact Review episodes can inform a later Review or Chat. Retrieval uses deterministic facts, recent local records, and SQLite FTS5 rather than embeddings.
- **Chat History** stores Coach Chat messages and saved Review replies for later reading. Recent uncleared turns for the current problem are replayed into Chat; restate a detail when it is older or especially important.
- **Knowledge Handbook** entries and explicit **Mistake Book** entries persist across sessions.
- **Skill Profile** preserves the signals you edit and shows deterministic skill/mistake facts and synthesis derived from real Reviews.

You can correct Profile signals with **Edit Signals**. In **Knowledge Handbook**, you can edit, mark an item **Learned**, or delete it. Workbench **Clear chat** clears the visible Chat conversation for the current problem while preserving Reviews and explicit learning records; Mistake Book has no equivalent delete control. For a full local-data reset, follow [Troubleshooting](./troubleshooting.md) instead of assuming a Chat command erased everything.

## 7. Know What Goes in Each Book

Use the product term **Knowledge Handbook** for reusable ideas and **Mistake Book** for problem-specific repair work.

### Knowledge Handbook

Good entries are small and transferable:

- an invariant;
- a Python API or standard-library reminder;
- a compact algorithm template;
- a complexity rule;
- a “when to use this” cue.

Prefer **New** when you want clean, structured fields: concept key, title, category, snippet, and when-to-use context. You can search, copy, edit, mark an entry **Learned**, delete it, or use **Export Markdown**.

Good: “Closed-interval binary search keeps the target inside `[left, right]`; continue while `left <= right`.”

Weak: a full problem solution copied into the snippet with no cue for when it applies.

### Mistake Book

A failed Review with a usable diagnosis can appear under **Problems to Revisit**. The most useful record says:

- what assumption failed;
- which input exposed it;
- how to recognize the same trap next time;
- what boundary test to run first.

You can also make an explicit save from Coach Chat. Put the final text you want to keep in that same message. The current save path stores what you wrote; it does not transform the previous Coach answer into a polished note. After saving, open the book and verify the entry.

<!-- Screenshot: sanitized Mistake Book card with Common trap, Redo Review, and no learner identity. -->
<!-- Screenshot: sanitized Knowledge Handbook note with Snippet and When to use. -->

## 8. Revisit Before You Forget

Two pages support different kinds of review.

Use **Problem History** when you want facts: Review attempts, run status, first failed case, tags, and progress summaries. **Restore Workspace** opens that problem with its latest saved draft; it does not restore the exact code snapshot from the selected historical attempt.

Use **Mistake Book** when you want a repair queue:

1. Read the **Common trap** or your saved **Problem Guide**.
2. Choose **Redo Review**.
3. Before editing, predict one case that should fail.
4. Add that custom visible test and select **Run Code**.
5. Make the smallest correction, then select **Review My Code**.

For Review-derived cards, a later passing Review can move a previously diagnosed problem into **Resolved Problems**. A manually saved guide remains a manual entry rather than a completion checkbox.

Use **Export Markdown** in either book before an offline review session. The export is a snapshot and may contain your local learning content, so inspect it before sharing; later changes in the app do not update an older downloaded file.

<!-- Screenshot: sanitized Problem History group showing filters and Restore Workspace. -->

## 9. Use Today and History to Choose Your Next Focus

**Today** currently creates a deterministic Hot-150 schedule. Your weekly hours set a daily dose, using a fixed estimate per problem and a cap of five items per day. The order comes from the catalog.

After Review, your self-rating completes the matching Planner item, updates its deterministic review schedule, and can surface the problem in **Review Focus**. Current boundary: PatternCoach does not use an LLM to rewrite the plan from an open-ended Chat request such as “make tomorrow easier.”

For now, use three visible signals to choose deliberately:

- **Today** for the next item in the fixed pacing queue;
- **Problem History** filters for a pattern with repeated failed Reviews;
- **Mistake Book** for the concrete trap you can repair next.

<!-- Screenshot: sanitized Today page showing the deterministic dose and Open Workbench. -->

## 10. Practice Routines

### 15-minute repair

- Open one item under **Problems to Revisit**.
- Predict a boundary case before revealing or changing anything.
- Choose **Redo Review**, add that case, and run once.
- Make one correction and finish with **Review My Code**.

### 30-minute evidence-first practice

- Open one problem from **Today** or the Hot-150 catalog.
- Write until you can state one invariant.
- Add one custom visible test and use **Run Code**.
- Use **Review My Code**, then ask Chat for at most one additional hint.
- Save one reusable Handbook note only if the idea transfers to another problem.

### 10-minute history sweep

- Filter **Problem History** by one tag.
- Open the most recent failed problem with **Restore Workspace**.
- Compare the saved failure summary with the latest draft.
- Either run one confirming test or leave the problem untouched and choose a more useful review target.

## 11. Copyable Coach Requests

These are natural-language requests, not hidden modes. Chat does not silently reuse the existing Run panel, so either include the evidence explicitly or ask it to run the current code for fresh Piston evidence.

### Hint and explanation

1. `Give me one hint only. Do not name the final algorithm.`
2. `Point me toward the missing observation. No pseudocode yet.`
3. `I know this uses two pointers, but I do not know when the left pointer should move. Give me one hint without code.`

### Debug and invariant

4. `The failing case is input [paste input], expected [value], actual [value]. Walk through it using my current variables.`
5. `Which invariant is broken in this loop? Point to the first iteration where it stops being true.`
6. `Give me one boundary-focused test to add next, and explain what assumption it checks.`

### Review and complexity

7. `Keep my current structure and variable names. Suggest the smallest correction.`
8. `Review this draft for one inconsistent boundary convention. Do not rewrite the solution.`
9. `Analyze the time and space complexity of my current draft. Identify the operation that dominates.`
10. `Give me pseudocode for the missing step, but no executable Python.`

### Revisit and style

11. `Here is the prior trap copied from my Mistake Book: [trap]. Does this draft repeat it?`
12. `Use an example-first explanation and stop after one actionable next step.`
13. `Do not show a full answer. Ask me one question that tests whether I understand the invariant.`

### Explicit saves

14. `Save this to the Knowledge Handbook: [reusable rule], useful when [situation].`
15. `Save this to the Mistake Book: [what failed]; exposed by [input]; next time check [boundary or invariant].`

## 12. Common Ways to Get Weak Coaching

- **Asking Chat to guess a run.** Use Review My Code, paste the exact failure evidence, or explicitly request `run_current_code` in natural language.
- **Referring only to “the error above.”** Recent uncleared Chat turns are retained, but the Run panel is not silently reused. Restate the relevant evidence when needed.
- **Starting with “give me the solution.”** You lose the chance to test your own observation and invariant.
- **Hiding what you already know.** Name the pattern, convention, and uncertain decision.
- **Assuming Profile choices replace a current instruction.** The Coach receives focused Profile context, but repeat important turn-specific constraints in the current message.
- **Saving everything.** Keep Knowledge Handbook for transferable ideas and Mistake Book for problem-specific traps.
- **Treating visible-test success as acceptance.** Confirm independently on the official problem site.
- **Treating a saved custom test as official coverage.** Custom tests persist locally, but they remain user-authored visible tests rather than hidden-test or LeetCode acceptance evidence.

The goal is not to make the Coach do more work. It is to give it better evidence, request a smaller intervention, and leave yourself a record that makes the next attempt easier to start.
