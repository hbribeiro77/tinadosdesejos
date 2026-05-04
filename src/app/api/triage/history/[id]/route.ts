import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { triageHistory } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ ok: false, message: "Missing id" }, { status: 400 });
    }

    await db.delete(triageHistory).where(eq(triageHistory.id, id)).run();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete triage history:", error);
    return NextResponse.json({ ok: false, message: "Internal Server Error" }, { status: 500 });
  }
}
