import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import mysql from "mysql2/promise";

const pool = mysql.createPool({ uri: process.env.DATABASE_URL!, connectionLimit: 5 });

// 检查是否已收藏
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ drugId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  try {
    const { drugId } = await params;
    const userId = (session.user as any).id;

    let drugIdNum = parseInt(drugId);
    if (isNaN(drugIdNum)) {
      const [rows] = await pool.query("SELECT id FROM drugs WHERE adcdb_id = ? LIMIT 1", [drugId]) as any[];
      if (rows.length === 0) return NextResponse.json({ bookmarked: false });
      drugIdNum = rows[0].id;
    }

    const [rows] = await pool.query(
      "SELECT id FROM bookmarks WHERE user_id = ? AND drug_id = ?",
      [userId, drugIdNum]
    ) as any[];

    return NextResponse.json({ bookmarked: rows.length > 0 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 取消收藏
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ drugId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  try {
    const { drugId } = await params;
    const userId = (session.user as any).id;

    let drugIdNum = parseInt(drugId);
    if (isNaN(drugIdNum)) {
      const [rows] = await pool.query("SELECT id FROM drugs WHERE adcdb_id = ? LIMIT 1", [drugId]) as any[];
      if (rows.length === 0) return NextResponse.json({ error: "药物不存在" }, { status: 404 });
      drugIdNum = rows[0].id;
    }

    await pool.query("DELETE FROM bookmarks WHERE user_id = ? AND drug_id = ?", [userId, drugIdNum]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
