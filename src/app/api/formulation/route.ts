import { NextRequest, NextResponse } from "next/server";
import { getProductsWithFormulation, classifyBuffer } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    const all = getProductsWithFormulation();
    const { searchParams } = request.nextUrl;
    const dosage = searchParams.get("dosage") || "";
    const bufferFilter = searchParams.get("buffer") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "12")));

    let filtered = [...all];

    if (dosage === "冻干粉针") {
      filtered = filtered.filter(r => r.lyophilization === true);
    } else if (dosage === "注射液") {
      filtered = filtered.filter(r => r.dosageForm && !r.lyophilization);
    }

    if (bufferFilter && bufferFilter !== "全部") {
      filtered = filtered.filter(r => classifyBuffer(r.lyoExcipientsBuffer) === bufferFilter);
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    return NextResponse.json({ products: paged, page, pageSize, total });
  } catch (error) {
    console.error("Formulation API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
