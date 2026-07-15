import { NextResponse } from "next/server";
import { z } from "zod";
import { clearCoachChatHistory } from "@/server/agents/coach-agent/clear-chat-history";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const result = await clearCoachChatHistory(body);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Malformed JSON request body.",
        },
        { status: 400 },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid clear chat request.",
          issues: error.flatten(),
        },
        { status: 400 },
      );
    }

    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to clear the chat history.",
      },
      { status: 500 },
    );
  }
}

async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch (error) {
    throw error instanceof SyntaxError
      ? error
      : new SyntaxError("Malformed JSON request body.");
  }
}
