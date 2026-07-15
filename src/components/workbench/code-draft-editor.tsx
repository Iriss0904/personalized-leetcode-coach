"use client";

import dynamic from "next/dynamic";

const Editor = dynamic(
  async () => {
    const [{ Editor: MonacoEditor, loader }, monaco] = await Promise.all([
      import("@monaco-editor/react"),
      import("monaco-editor"),
    ]);
    globalThis.MonacoEnvironment = {
      getWorker: () =>
        new Worker(
          new URL(
            "monaco-editor/esm/vs/editor/editor.worker.js",
            import.meta.url,
          ),
          { type: "module" },
        ),
    };
    loader.config({ monaco });
    return MonacoEditor;
  },
  { ssr: false, loading: () => <div className="min-h-80 p-4">Loading Python editor…</div> },
);

export function CodeDraftEditor({
  code,
  onChange,
}: {
  code: string;
  onChange: (code: string) => void;
}) {
  return (
    <div className="min-h-96 overflow-hidden rounded-lg border bg-[#15171c]" data-testid="code-draft-editor">
      <Editor
        height="480px"
        language="python"
        onChange={(value) => onChange(value ?? "")}
        options={{
          automaticLayout: true,
          fontSize: 14,
          insertSpaces: true,
          minimap: { enabled: false },
          padding: { top: 16 },
          scrollBeyondLastLine: false,
          tabSize: 4,
        }}
        theme="vs-dark"
        value={code}
      />
    </div>
  );
}
