import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { triageHistory } from "@/db/schema";
import { inArray } from "drizzle-orm";
import type { GitlabDvituAxisKey } from "@/lib/gitlab-dvitu-matrix-criteria-descriptions-by-axis-and-score-one-to-five-pt-br-v1";

const DVITU_AXES_UPPER = ["D", "V", "I", "T", "U"] as const;

/** Pares (eixo DVITU, nota) que possuem ao menos um registro no histórico local. */
export async function GET() {
  try {
    const rows = await db
      .select({
        axis: triageHistory.axis,
        score: triageHistory.score,
      })
      .from(triageHistory)
      .where(inArray(triageHistory.axis, [...DVITU_AXES_UPPER]));

    const seen = new Set<string>();
    const unique: { axis: string; score: number }[] = [];
    for (const r of rows) {
      const k = `${r.axis}\0${r.score}`;
      if (seen.has(k)) continue;
      seen.add(k);
      unique.push(r);
    }

    const byAxis: Record<GitlabDvituAxisKey, number[]> = {
      d: [],
      v: [],
      i: [],
      t: [],
      u: [],
    };

    for (const r of unique) {
      const key = r.axis.trim().toLowerCase() as GitlabDvituAxisKey;
      if (key in byAxis && typeof r.score === "number") {
        byAxis[key].push(r.score);
      }
    }

    for (const k of Object.keys(byAxis) as GitlabDvituAxisKey[]) {
      byAxis[k] = [...new Set(byAxis[k])].sort((a, b) => a - b);
    }

    return NextResponse.json({ ok: true as const, data: byAxis });
  } catch (error) {
    console.error("Failed to fetch DVITU triage history availability:", error);
    return NextResponse.json({ ok: false as const, message: "Internal Server Error" }, { status: 500 });
  }
}
