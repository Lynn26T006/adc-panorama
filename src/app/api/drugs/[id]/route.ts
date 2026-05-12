import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { drugs } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = await getDb();
  try {
    const { id } = await params;
    const numId = parseInt(id);

    const result = isNaN(numId)
      ? await db.select().from(drugs).where(eq(drugs.adcdbId, id)).limit(1)
      : await db
          .select()
          .from(drugs)
          .where(or(eq(drugs.id, numId), eq(drugs.adcdbId, id)))
          .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Drug not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
