import { NextResponse } from "next/server";
import {
  advancePlannerDoseBatch,
  PlannerError,
} from "@/server/planner/planner-service";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await advancePlannerDoseBatch();

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
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
            : "Unable to continue to the next dose.",
      },
      { status: 500 },
    );
  }
}
