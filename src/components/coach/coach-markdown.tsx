import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type CoachMarkdownDensity = "default" | "compact";

type CoachMarkdownProps = {
  markdown: string;
  className?: string;
  density?: CoachMarkdownDensity;
};

export function CoachMarkdown({
  className,
  density = "default",
  markdown,
}: CoachMarkdownProps) {
  const compact = density === "compact";

  return (
    <div className={cn("max-w-full", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h3
              className={cn(
                "mt-4 font-semibold text-foreground first:mt-0",
                compact ? "text-xs" : "text-sm",
              )}
            >
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h3
              className={cn(
                "mt-4 font-semibold text-foreground first:mt-0",
                compact ? "text-xs" : "text-sm",
              )}
            >
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h3
              className={cn(
                "mt-4 font-semibold text-foreground first:mt-0",
                compact ? "text-xs" : "text-sm",
              )}
            >
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p
              className={cn(
                "mt-2 text-card-foreground first:mt-0",
                compact ? "text-xs leading-5" : "text-sm leading-6",
              )}
            >
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul
              className={cn(
                "mt-2 list-disc pl-5",
                compact
                  ? "space-y-0.5 text-xs leading-5"
                  : "space-y-1 text-sm leading-6",
              )}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              className={cn(
                "mt-2 list-decimal pl-5",
                compact
                  ? "space-y-0.5 text-xs leading-5"
                  : "space-y-1 text-sm leading-6",
              )}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          a: ({ children, href }) => (
            <a
              className="font-medium text-primary underline-offset-4 hover:underline"
              href={href}
              rel="noreferrer"
              target="_blank"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className={cn(
                "mt-3 border-l-2 border-emerald-300 bg-emerald-50/60 px-3 py-2 text-emerald-950",
                compact ? "text-xs leading-5" : "text-sm leading-6",
              )}
            >
              {children}
            </blockquote>
          ),
          code: ({ className: codeClassName, children }) => {
            const codeText = String(children);
            const isBlock = Boolean(codeClassName) || codeText.includes("\n");

            if (isBlock) {
              return (
                <code
                  className={cn(
                    "block min-w-max whitespace-pre font-mono font-medium text-slate-900",
                    compact ? "text-[11px] leading-5" : "text-[13px] leading-6",
                  )}
                >
                  {children}
                </code>
              );
            }

            return (
              <code
                className={cn(
                  "rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono font-medium text-emerald-950",
                  compact ? "text-[11px]" : "text-[13px]",
                )}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre
              className={cn(
                "my-3 max-w-full overflow-x-auto rounded-lg border border-slate-200 bg-[#f8faf9] shadow-inner",
                compact ? "p-3" : "p-4",
              )}
            >
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="my-3 max-w-full overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-left">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th
              className={cn(
                "border-b border-border bg-muted/50 px-3 py-2 font-semibold text-foreground",
                compact ? "text-xs" : "text-sm",
              )}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              className={cn(
                "border-b border-border px-3 py-2 align-top last:border-b-0",
                compact ? "text-xs leading-5" : "text-sm leading-6",
              )}
            >
              {children}
            </td>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
