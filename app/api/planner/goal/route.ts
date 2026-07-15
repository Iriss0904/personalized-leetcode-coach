import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createOrUpdatePlannerGoal,
  PlannerError,
} from "@/server/planner/planner-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const goal = await createOrUpdatePlannerGoal(body);

    return NextResponse.json({
      ok: true,
      goalId: goal.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid readiness goal.",
          issues: error.flatten(),
        },
        { status: 400 },
      );
    }

    if (error instanceof PlannerError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: error.status },
      );
    }

    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to save the readiness goal.",
      },
      { status: 500 },
    );
  }
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new PlannerError("Malformed JSON request body.", 400);
  }
}
