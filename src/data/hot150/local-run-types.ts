import { z } from "zod";

export const publicDifficultySchema = z.enum(["Easy", "Medium", "Hard"]);

export const publicValueTypeSchema = z.enum([
  "void",
  "integer",
  "number",
  "boolean",
  "string",
  "integer_array",
  "number_array",
  "boolean_array",
  "string_array",
  "integer_matrix",
  "string_matrix",
  "character_matrix",
  "linked_list",
  "linked_list_array",
  "binary_tree",
  "next_pointer_tree",
  "next_pointer_levels",
  "random_pointer_list",
  "graph_adjacency_list",
  "quad_tree",
  "operation_arguments",
  "operation_results",
  "return_and_mutated_prefix",
]);

export const publicContractKindSchema = z.enum([
  "pure_function",
  "inplace_argument",
  "return_and_mutated_prefix",
  "design_object",
]);

export const publicParameterAdapterSchema = z.enum([
  "identity",
  "linked_list",
  "linked_list_array",
  "binary_tree",
  "next_pointer_tree",
  "random_pointer_list",
  "graph_adjacency_list",
  "quad_tree",
  "linked_list_with_cycle",
  "binary_tree_node_reference",
  "operation_arguments",
]);

export const publicReturnAdapterSchema = z.enum([
  "identity",
  "linked_list",
  "binary_tree",
  "next_pointer_tree",
  "random_pointer_list",
  "graph_adjacency_list",
  "quad_tree",
  "operation_results",
]);

export const publicComparisonStrategySchema = z.enum([
  "exact",
  "unordered",
  "multiset",
  "float_tolerance",
  "inplace_argument",
  "operation_sequence",
  "public_special_judge",
]);

export const publicValueSchema = z
  .object({
    type: publicValueTypeSchema,
    nullable: z.boolean().optional(),
  })
  .strict();

export const publicInputSchema = z
  .object({
    type: z.literal("object"),
    required: z.array(z.string().min(1)),
    properties: z.record(z.string(), publicValueSchema),
  })
  .strict();

export const publicParameterSchema = z
  .object({
    name: z.string().min(1),
    type: publicValueTypeSchema,
  })
  .strict();

export const publicSignatureSchema = z
  .object({
    className: z.string().min(1).optional(),
    methodName: z.string().min(1),
    contractKind: publicContractKindSchema,
    parameters: z.array(publicParameterSchema),
    returnType: publicValueTypeSchema,
  })
  .strict();

export const publicParameterSerializationSchema = z
  .object({
    parameter: z.string().min(1),
    adapter: publicParameterAdapterSchema,
    auxiliaryInput: z.string().min(1).optional(),
    referenceRootParameter: z.string().min(1).optional(),
  })
  .strict();

export const publicSerializationSchema = z
  .object({
    argumentOrder: z.array(z.string().min(1)),
    auxiliaryInputs: z.array(z.string().min(1)).optional(),
    parameterAdapters: z.array(publicParameterSerializationSchema),
    operationArgumentAdapters: z
      .record(z.string(), z.array(publicParameterAdapterSchema))
      .optional(),
    returnAdapter: publicReturnAdapterSchema,
    mutatedArgumentIndex: z.number().int().nonnegative().optional(),
  })
  .strict();

export const publicComparisonConfigValueSchema = z.union([
  z.boolean(),
  z.number(),
  z.string(),
]);

export const publicComparisonSchema = z
  .object({
    strategy: publicComparisonStrategySchema,
    config: z.record(z.string(), publicComparisonConfigValueSchema).optional(),
  })
  .strict();

export const publicVisibleTestSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    input: z.record(z.string(), z.unknown()),
    expected: z.unknown(),
  })
  .strict();

export const publicHot150ProblemSchema = z
  .object({
    number: z.number().int().positive(),
    order: z.number().int().min(1).max(150),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1),
    difficulty: publicDifficultySchema,
    section: z.string().min(1),
    tags: z.array(z.string().min(1)).min(1),
    originalProblemUrl: z
      .string()
      .url()
      .regex(/^https:\/\/leetcode\.com\/problems\/[a-z0-9-]+\/$/),
    language: z
      .object({
        python: z
          .object({
            supported: z.literal(true),
            runtime: z.string().min(1),
          })
          .strict(),
      })
      .strict(),
    signature: publicSignatureSchema,
    inputSchema: publicInputSchema,
    outputSchema: publicValueSchema,
    serialization: publicSerializationSchema,
    comparison: publicComparisonSchema,
    visibleTests: z.array(publicVisibleTestSchema).min(1),
  })
  .strict()
  .superRefine((problem, context) => {
    const parameterNames = problem.signature.parameters.map(({ name }) => name);
    const required = problem.inputSchema.required;
    const propertyNames = Object.keys(problem.inputSchema.properties);
    const adapterNames = problem.serialization.parameterAdapters.map(
      ({ parameter }) => parameter,
    );

    if (problem.signature.contractKind === "design_object") {
      if (!problem.signature.className) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "design_object contracts require className",
          path: ["signature", "className"],
        });
      }
    } else {
      for (const [label, names] of [
        ["serialization.argumentOrder", problem.serialization.argumentOrder],
        ["serialization.parameterAdapters", adapterNames],
      ] as const) {
        if (!sameStringSet(parameterNames, names)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${label} must match signature parameters`,
          });
        }
      }
      const publicInputNames = [
        ...parameterNames,
        ...(problem.serialization.auxiliaryInputs ?? []),
      ];
      for (const [label, names] of [
        ["inputSchema.required", required],
        ["inputSchema.properties", propertyNames],
      ] as const) {
        if (!sameStringSet(publicInputNames, names)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${label} must match parameters plus auxiliary inputs`,
          });
        }
      }
    }

    if (
      ["inplace_argument", "return_and_mutated_prefix"].includes(
        problem.signature.contractKind,
      ) &&
      problem.serialization.mutatedArgumentIndex === undefined
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "mutation-aware contracts require mutatedArgumentIndex",
        path: ["serialization", "mutatedArgumentIndex"],
      });
    }

    for (const test of problem.visibleTests) {
      const validation = validatePublicTestInput(problem, test.input);
      for (const issue of validation.issues) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${test.id}: ${issue}`,
          path: ["visibleTests"],
        });
      }
      if (!matchesPublicValueType(test.expected, problem.outputSchema)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${test.id}: expected output does not match ${problem.outputSchema.type}`,
          path: ["visibleTests"],
        });
      }
    }
  });

export const publicHot150BankSchema = z
  .object({
    schemaVersion: z.literal(1),
    problems: z.array(publicHot150ProblemSchema).length(150),
  })
  .strict()
  .superRefine((bank, context) => {
    const numbers = bank.problems.map(({ number }) => number);
    const slugs = bank.problems.map(({ slug }) => slug);
    const orders = bank.problems.map(({ order }) => order).sort((a, b) => a - b);

    if (new Set(numbers).size !== 150) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hot-150 problem numbers must be unique",
        path: ["problems"],
      });
    }
    if (new Set(slugs).size !== 150) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hot-150 slugs must be unique",
        path: ["problems"],
      });
    }
    if (!orders.every((order, index) => order === index + 1)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hot-150 order must contain every integer from 1 through 150",
        path: ["problems"],
      });
    }
  });

export type PublicDifficulty = z.infer<typeof publicDifficultySchema>;
export type PublicValueType = z.infer<typeof publicValueTypeSchema>;
export type PublicValueSchema = z.infer<typeof publicValueSchema>;
export type PublicContractKind = z.infer<typeof publicContractKindSchema>;
export type PublicParameterAdapter = z.infer<typeof publicParameterAdapterSchema>;
export type PublicReturnAdapter = z.infer<typeof publicReturnAdapterSchema>;
export type PublicComparisonStrategy = z.infer<
  typeof publicComparisonStrategySchema
>;
export type PublicInputSchema = z.infer<typeof publicInputSchema>;
export type PublicSignature = z.infer<typeof publicSignatureSchema>;
export type PublicSerialization = z.infer<typeof publicSerializationSchema>;
export type PublicComparison = z.infer<typeof publicComparisonSchema>;
export type PublicVisibleTest = z.infer<typeof publicVisibleTestSchema>;
export type PublicHot150Problem = z.infer<typeof publicHot150ProblemSchema>;
export type PublicHot150Bank = z.infer<typeof publicHot150BankSchema>;

export type PublicInputValidation = {
  ok: boolean;
  issues: string[];
};

export function definePublicHot150Bank(value: unknown): PublicHot150Bank {
  return publicHot150BankSchema.parse(value);
}

export function validatePublicHot150Bank(value: unknown) {
  return publicHot150BankSchema.safeParse(value);
}

export function findPublicHot150Problem(
  bank: PublicHot150Bank,
  numberOrSlug: number | string,
) {
  return bank.problems.find((problem) =>
    typeof numberOrSlug === "number"
      ? problem.number === numberOrSlug
      : problem.slug === numberOrSlug,
  );
}

export function validatePublicTestInput(
  problem: Pick<PublicHot150Problem, "inputSchema">,
  input: unknown,
): PublicInputValidation {
  if (!isRecord(input)) {
    return { ok: false, issues: ["input must be a JSON object"] };
  }

  const issues: string[] = [];
  const schema = problem.inputSchema;
  for (const name of schema.required) {
    if (!(name in input)) {
      issues.push(`missing required input property ${name}`);
    }
  }
  for (const name of Object.keys(input)) {
    if (!(name in schema.properties)) {
      issues.push(`unknown input property ${name}`);
    }
  }
  for (const [name, valueSchema] of Object.entries(schema.properties)) {
    if (name in input && !matchesPublicValueType(input[name], valueSchema)) {
      issues.push(`${name} does not match ${valueSchema.type}`);
    }
  }

  return { ok: issues.length === 0, issues };
}

export function defaultParameterAdapter(
  type: PublicValueType,
): PublicParameterAdapter {
  switch (type) {
    case "linked_list":
      return "linked_list";
    case "linked_list_array":
      return "linked_list_array";
    case "binary_tree":
      return "binary_tree";
    case "next_pointer_tree":
      return "next_pointer_tree";
    case "random_pointer_list":
      return "random_pointer_list";
    case "graph_adjacency_list":
      return "graph_adjacency_list";
    case "quad_tree":
      return "quad_tree";
    case "operation_arguments":
      return "operation_arguments";
    default:
      return "identity";
  }
}

export function defaultReturnAdapter(type: PublicValueType): PublicReturnAdapter {
  switch (type) {
    case "linked_list":
      return "linked_list";
    case "binary_tree":
      return "binary_tree";
    case "next_pointer_tree":
    case "next_pointer_levels":
      return "next_pointer_tree";
    case "random_pointer_list":
      return "random_pointer_list";
    case "graph_adjacency_list":
      return "graph_adjacency_list";
    case "quad_tree":
      return "quad_tree";
    case "operation_results":
      return "operation_results";
    default:
      return "identity";
  }
}

function matchesPublicValueType(value: unknown, schema: PublicValueSchema): boolean {
  if (value === null) {
    return schema.nullable === true;
  }

  switch (schema.type) {
    case "void":
      return value === null;
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "string":
      return typeof value === "string";
    case "integer_array":
      return isArrayOf(value, (item) => typeof item === "number" && Number.isInteger(item));
    case "number_array":
      return isArrayOf(value, (item) => typeof item === "number" && Number.isFinite(item));
    case "boolean_array":
      return isArrayOf(value, (item) => typeof item === "boolean");
    case "string_array":
      return isArrayOf(value, (item) => typeof item === "string");
    case "integer_matrix":
      return isArrayOf(value, (row) =>
        isArrayOf(row, (item) => typeof item === "number" && Number.isInteger(item)),
      );
    case "string_matrix":
    case "character_matrix":
      return isArrayOf(value, (row) => isArrayOf(row, (item) => typeof item === "string"));
    case "linked_list":
      return isArrayOf(value, (item) => typeof item === "number" && Number.isInteger(item));
    case "linked_list_array":
      return isArrayOf(value, (list) =>
        list === null ||
        isArrayOf(list, (item) => typeof item === "number" && Number.isInteger(item)),
      );
    case "binary_tree":
    case "next_pointer_tree":
      return isArrayOf(
        value,
        (item) => item === null || (typeof item === "number" && Number.isInteger(item)),
      );
    case "next_pointer_levels":
      return isArrayOf(
        value,
        (item) => item === "#" || (typeof item === "number" && Number.isInteger(item)),
      );
    case "random_pointer_list":
      return isArrayOf(
        value,
        (item) =>
          Array.isArray(item) &&
          item.length === 2 &&
          typeof item[0] === "number" &&
          Number.isInteger(item[0]) &&
          (item[1] === null ||
            (typeof item[1] === "number" && Number.isInteger(item[1]))),
      );
    case "graph_adjacency_list":
      return isArrayOf(value, (row) =>
        isArrayOf(row, (item) => typeof item === "number" && Number.isInteger(item)),
      );
    case "quad_tree":
      return Array.isArray(value);
    case "operation_arguments":
      return isArrayOf(value, (item) => Array.isArray(item));
    case "operation_results":
      return Array.isArray(value);
    case "return_and_mutated_prefix":
      return (
        isRecord(value) &&
        typeof value.returnValue === "number" &&
        Number.isInteger(value.returnValue) &&
        Array.isArray(value.mutatedPrefix)
      );
  }
}

function isArrayOf(
  value: unknown,
  predicate: (item: unknown) => boolean,
): value is unknown[] {
  return Array.isArray(value) && value.every(predicate);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sameStringSet(left: readonly string[], right: readonly string[]) {
  return (
    left.length === right.length &&
    new Set(left).size === new Set(right).size &&
    left.every((value) => right.includes(value))
  );
}
