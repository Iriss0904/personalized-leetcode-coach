export const PUBLIC_PYTHON_RUNTIME = {
  language: "python",
  version: "3.12.0",
} as const;

export function isPublicPythonRuntime(runtime: {
  language?: string;
  version?: string;
}) {
  return (
    runtime.language?.toLowerCase() === PUBLIC_PYTHON_RUNTIME.language &&
    runtime.version === PUBLIC_PYTHON_RUNTIME.version
  );
}
