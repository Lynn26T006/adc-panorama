import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { drugs } from "@/lib/db/schema";
import { isNotNull, or } from "drizzle-orm";

const BUFFER_MAP: Record<string, string> = {
  "柠檬酸钠": "柠檬酸盐", "柠檬酸": "柠檬酸",
  "琥珀酸钠": "琥珀酸盐", "Tris": "Tris",
  "组氨酸": "L-组氨酸", "MES": "MES",
  "磷酸": "磷酸盐", "甘氨酸": "甘氨酸",
};

function classify(raw: string | null, map: Record<string, string>): string {
  if (!raw) return "";
  for (const [key, label] of Object.entries(map)) {
    if (raw.includes(key)) return label;
  }
  return raw.split(" ")[0].split(";")[0].trim();
}

export async function GET(request: NextRequest) {
  const db = await getDb();
  try {
    const { searchParams } = request.nextUrl;
    const dosage = searchParams.get("dosage") || "";
    const bufferFilter = searchParams.get("buffer") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "12")));

    const whereClause = or(
      isNotNull(drugs.lyoBuffer),
      isNotNull(drugs.lyoStabilizer),
      isNotNull(drugs.lyoSurfactant),
      isNotNull(drugs.lyoPh),
      isNotNull(drugs.lyoCycle),
      isNotNull(drugs.liquidExcipients)
    );

    const results = await db
      .select()
      .from(drugs)
      .where(whereClause)
      .orderBy(drugs.id)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    let filtered = results;
    if (dosage === "冻干粉针") filtered = results.filter(r => r.lyophilization === true);
    else if (dosage === "注射液") filtered = results.filter(r => r.lyophilization === false);

    if (bufferFilter && bufferFilter !== "全部") {
      filtered = filtered.filter(r => classify(r.lyoBuffer, BUFFER_MAP) === bufferFilter);
    }

    return NextResponse.json({ products: filtered, page, pageSize, total: filtered.length });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
