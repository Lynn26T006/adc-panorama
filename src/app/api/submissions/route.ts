import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import mysql from "mysql2/promise";

const pool = mysql.createPool({ uri: process.env.DATABASE_URL!, connectionLimit: 5 });

// GET: 获取当前用户的提交记录（?mine=true）
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  try {
    const mine = request.nextUrl.searchParams.get("mine");
    if (mine === "true") {
      const userId = (session.user as any).id;
      const [rows] = await pool.query(
        "SELECT id, drug_name, status, created_at, reviewed_at FROM submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        [userId]
      );
      return NextResponse.json({ submissions: rows });
    }
    return NextResponse.json({ submissions: [] });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  try {
    const { drugName, fieldData } = await request.json();
    if (!drugName?.trim() || !fieldData) {
      return NextResponse.json({ error: "请填写药物名称和数据" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    await pool.query(
      "INSERT INTO submissions (user_id, drug_name, field_data) VALUES (?, ?, ?)",
      [userId, drugName.trim(), JSON.stringify(fieldData)]
    );

    return NextResponse.json({ success: true, message: "提交成功，等待审核" }, { status: 201 });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
