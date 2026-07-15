import { publicHot150Bank } from "../src/data/hot150/local-bank.public";
import { localUserHandle } from "../src/features/onboarding/profile-defaults";
import prisma from "../src/server/db/prisma";

function starterCode(methodName: string, parameters: string[], className?: string) {
  if (className) {
    return `class ${className}:\n    def __init__(self, *args):\n        pass\n`;
  }
  const args = parameters.length ? `, ${parameters.join(", ")}` : "";
  return `class Solution:\n    def ${methodName}(self${args}):\n        pass\n`;
}

async function main() {
  await prisma.user.upsert({
    where: { handle: localUserHandle },
    update: {},
    create: { handle: localUserHandle },
  });

  for (const problem of publicHot150Bank.problems) {
    const row = await prisma.problem.upsert({
      where: { slug: problem.slug },
      update: {
        title: problem.title,
        difficulty: problem.difficulty,
        hot150Order: problem.order,
        hot150Section: problem.section,
        officialUrl: problem.originalProblemUrl,
        tags: JSON.stringify(problem.tags),
        starterCodePython: starterCode(
          problem.signature.methodName,
          problem.signature.parameters.map(({ name }) => name),
          problem.signature.className,
        ),
        methodName: problem.signature.methodName,
        inputContractJson: JSON.stringify(problem.inputSchema),
        outputContractJson: JSON.stringify(problem.outputSchema),
        comparisonStrategy: problem.comparison.strategy,
        comparisonConfigJson: JSON.stringify(problem.comparison.config ?? {}),
        contractKind: problem.signature.contractKind,
      },
      create: {
        leetcodeNumber: problem.number,
        slug: problem.slug,
        title: problem.title,
        difficulty: problem.difficulty,
        hot150Order: problem.order,
        hot150Section: problem.section,
        officialUrl: problem.originalProblemUrl,
        tags: JSON.stringify(problem.tags),
        starterCodePython: starterCode(
          problem.signature.methodName,
          problem.signature.parameters.map(({ name }) => name),
          problem.signature.className,
        ),
        methodName: problem.signature.methodName,
        inputContractJson: JSON.stringify(problem.inputSchema),
        outputContractJson: JSON.stringify(problem.outputSchema),
        comparisonStrategy: problem.comparison.strategy,
        comparisonConfigJson: JSON.stringify(problem.comparison.config ?? {}),
        contractKind: problem.signature.contractKind,
      },
    });

    await prisma.problemTestCase.deleteMany({
      where: { problemId: row.id, userId: null, source: "public_visible" },
    });
    await prisma.problemTestCase.createMany({
      data: problem.visibleTests.map((test, index) => ({
        problemId: row.id,
        label: test.label,
        inputJson: JSON.stringify(test.input),
        expectedJson: JSON.stringify(test.expected),
        source: "public_visible",
        isVisible: true,
        sortOrder: index,
      })),
    });
  }

  console.log(`Initialized local database and ${publicHot150Bank.problems.length} public Hot-150 contracts.`);
  console.log("The learner Profile will be created during first-run Onboarding.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Database seed failed.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
