import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { drugs } from "@/lib/db/schema";
import { eq, like, or, and, inArray, sql, asc, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const db = await getDb();
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const stage = searchParams.get("stage") || "";
    const target = searchParams.get("target") || "";
    const payloadClass = searchParams.get("payloadClass") || "";
    const conjugationMethod = searchParams.get("conjugationMethod") || "";
    const sort = searchParams.get("sort") || "";
    const order = searchParams.get("order") || "asc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "15")));

    const whereConditions: ReturnType<typeof eq>[] = [];

    if (search) {
      const s = `%${search}%`;
      whereConditions.push(
        or(
          like(drugs.antibody, s),
          like(drugs.brandName, s),
          like(drugs.genericCn, s),
          like(drugs.target, s),
          like(drugs.companyOriginator, s)
        )!
      );
    }

    if (stage) {
      const stages = stage.split(",");
      if (stages.includes("临床阶段")) {
        stages.push("临床I期", "临床II期", "临床III期", "NDA");
      }
      whereConditions.push(inArray(drugs.stage, stages));
    }
    if (target) whereConditions.push(inArray(drugs.target, target.split(",")));
    if (payloadClass) whereConditions.push(inArray(drugs.payloadClass, payloadClass.split(",")));
    if (conjugationMethod) whereConditions.push(inArray(drugs.conjugationMethod, conjugationMethod.split(",")));

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    const offset = (page - 1) * pageSize;

    const results = await db
      .select()
      .from(drugs)
      .where(whereClause)
      .orderBy(
        sort === "brandName"
          ? (order === "desc" ? desc(drugs.brandName) : asc(drugs.brandName))
          : sort === "target"
            ? (order === "desc" ? desc(drugs.target) : asc(drugs.target))
            : sort === "stage"
              ? (order === "desc" ? desc(drugs.stage) : asc(drugs.stage))
              : sort === "approvalYear"
                ? (order === "desc" ? desc(drugs.approvalYear) : asc(drugs.approvalYear))
                : asc(drugs.id)
      )
      .limit(pageSize)
      .offset(offset);

    const [totalRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(drugs)
      .where(whereClause);
    const total = Number(totalRow?.count || 0);

    return NextResponse.json({
      products: results,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
