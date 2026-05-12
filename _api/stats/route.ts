import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { drugs } from "@/lib/db/schema";
import { or, isNotNull, sql, eq } from "drizzle-orm";

export async function GET(_request: NextRequest) {
  const db = await getDb();
  try {
    const [total] = await db.select({ count: sql<number>`count(*)` }).from(drugs);
    const [withFormulation] = await db
      .select({ count: sql<number>`count(*)` })
      .from(drugs)
      .where(or(isNotNull(drugs.lyoBuffer), isNotNull(drugs.lyoStabilizer), isNotNull(drugs.lyoPh), isNotNull(drugs.liquidExcipients)));
    const [lyophilized] = await db
      .select({ count: sql<number>`count(*)` })
      .from(drugs)
      .where(eq(drugs.lyophilization, true));
    const [approved] = await db
      .select({ count: sql<number>`count(*)` })
      .from(drugs)
      .where(eq(drugs.stage, "已上市"));

    const targets = await db
      .select({ target: drugs.target, count: sql<number>`count(*)` })
      .from(drugs)
      .where(isNotNull(drugs.target))
      .groupBy(drugs.target)
      .orderBy(sql`count desc`)
      .limit(10);

    return NextResponse.json({
      totalDrugs: Number(total?.count || 0),
      withFormulation: Number(withFormulation?.count || 0),
      lyophilized: Number(lyophilized?.count || 0),
      approved: Number(approved?.count || 0),
      topTargets: targets.map(t => ({ name: t.target, count: Number(t.count) })),
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
