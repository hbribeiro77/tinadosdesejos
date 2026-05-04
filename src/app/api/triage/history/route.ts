import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { triageHistory } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const axis = searchParams.get("axis");
  const scoreRaw = searchParams.get("score");

  if (!axis || !scoreRaw) {
    return NextResponse.json({ ok: false, message: "Missing axis or score" }, { status: 400 });
  }

  const score = parseInt(scoreRaw, 10);
  if (isNaN(score)) {
    return NextResponse.json({ ok: false, message: "Invalid score" }, { status: 400 });
  }

  try {
    const history = await db
      .select()
      .from(triageHistory)
      .where(and(eq(triageHistory.axis, axis.toUpperCase()), eq(triageHistory.score, score)))
      .orderBy(desc(triageHistory.createdAt))
      .limit(3);

    return NextResponse.json({ ok: true, data: history });
  } catch (error) {
    console.error("Failed to fetch triage history:", error);
    return NextResponse.json({ ok: false, message: "Internal Server Error" }, { status: 500 });
  }
}
