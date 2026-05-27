import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { drugs } from "@/lib/db/schema";
import { isNotNull, or, and, eq, ne, like, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const db = await getDb();
  try {
    const { searchParams } = request.nextUrl;
    const dosage = searchParams.get("dosage") || "";
    const bufferFilter = searchParams.get("buffer") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "12")));

    const conditions = [
      or(
        isNotNull(drugs.lyoBuffer),
        isNotNull(drugs.lyoStabilizer),
        isNotNull(drugs.lyoSurfactant),
        isNotNull(drugs.lyoPh),
        isNotNull(drugs.lyoCycle),
        isNotNull(drugs.liquidExcipients)
      ),
    ];

    if (dosage === "冻干粉针") {
      conditions.push(eq(drugs.lyophilization, true));
    } else if (dosage === "注射液") {
      conditions.push(ne(drugs.lyophilization, true));
      conditions.push(isNotNull(drugs.dosageForm));
    }

    if (bufferFilter && bufferFilter !== "全部") {
      const bufferMap: Record<string, string[]> = {
        "柠檬酸盐": ["柠檬酸钠", "柠檬酸"],
        "柠檬酸": ["柠檬酸"],
        "琥珀酸盐": ["琥珀酸钠", "琥珀酸"],
        "Tris": ["Tris"],
        "L-组氨酸": ["组氨酸"],
        "MES": ["MES"],
        "磷酸盐": ["磷酸"],
        "甘氨酸": ["甘氨酸"],
      };
      const keywords = bufferMap[bufferFilter];
      if (keywords) {
        conditions.push(or(...keywords.map(kw => like(drugs.lyoBuffer, `%${kw}%`))));
      } else {
        conditions.push(like(drugs.lyoBuffer, `%${bufferFilter}%`));
      }
    }

    const whereClause = and(...conditions);

    const [results, countResult] = await Promise.all([
      db.select().from(drugs).where(whereClause).orderBy(drugs.id).limit(pageSize).offset((page - 1) * pageSize),
      db.select({ count: sql<number>`count(*)` }).from(drugs).where(whereClause),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return NextResponse.json({ products: results, page, pageSize, total });
  } catch (error) {
    console.error("Formulation API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
