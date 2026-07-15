"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotebookExportButton({ markdown }: { markdown: string }) {
  function download() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "mistake-notebook.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button onClick={download} variant="outline">
      <Download aria-hidden="true" className="h-4 w-4" />
      Export Markdown
    </Button>
  );
}
