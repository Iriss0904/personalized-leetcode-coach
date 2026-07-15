import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { CoachMarkdown } from "@/components/coach/coach-markdown";
import { PageHeader } from "@/components/shared/page-header";
import { getChatHistoryPageData } from "@/features/chat-history/chat-history-data";

export const dynamic = "force-dynamic";

export default async function ChatHistoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ session?: string }>;
}) {
  const params = await searchParams;
  const data = await getChatHistoryPageData(params?.session);

  return (
    <AppLayout displayName={data.displayName}>
      <PageHeader
        description="Coach conversations and tool activity stored in your local SQLite database."
        title="Chat History"
      />
      <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          {data.sessions.map((session) => (
            <Link
              className="block rounded-md border bg-card p-3"
              href={`/history/chats?session=${session.id}`}
              key={session.id}
            >
              <p className="font-medium">
                {session.problem.leetcodeNumber}. {session.problem.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {session.messages.length} messages · {toolCallCount(session)} tool calls
              </p>
            </Link>
          ))}
        </aside>
        <section className="space-y-3 rounded-md border bg-card p-4">
          {data.selected ? (
            <>
              {data.selected.toolEvents.length ? (
                <details className="rounded-md border bg-muted/30 p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    Tool activity ({toolCallCount(data.selected)} calls)
                  </summary>
                  <div className="mt-2 grid gap-1">
                    {data.selected.toolEvents.map((event) => (
                      <p className="text-xs text-muted-foreground" key={event.id}>
                        {event.type === "tool_call"
                          ? "Called"
                          : event.ok === false
                            ? "Failed"
                            : "Completed"}
                        : <code>{event.toolName}</code>
                      </p>
                    ))}
                  </div>
                </details>
              ) : null}
              {data.selected.messages.map((message) => (
                <article className="rounded-md bg-muted p-3" key={message.id}>
                  <p className="mb-1 text-xs font-semibold uppercase">{message.role}</p>
                  <CoachMarkdown markdown={message.contentMarkdown} />
                </article>
              ))}
            </>
          ) : (
            <p>No chat history yet.</p>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

function toolCallCount(session: {
  toolEvents: Array<{ type: "tool_call" | "tool_result" }>;
}) {
  return session.toolEvents.filter((event) => event.type === "tool_call").length;
}
