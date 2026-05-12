import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL!,
  connectionLimit: 5,
});

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  try {
    const { id } = await params;
    const userId = (session.user as any).id;

    // "all" 表示全部标记已读
    if (id === "all") {
      await pool.query("UPDATE notifications SET `read` = 1 WHERE user_id = ?", [userId]);
      return NextResponse.json({ success: true });
    }

    await pool.query("UPDATE notifications SET `read` = 1 WHERE id = ? AND user_id = ?", [id, userId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
