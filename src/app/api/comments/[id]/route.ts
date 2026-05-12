import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL!,
  connectionLimit: 5,
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  try {
    const { id } = await params;
    const { content } = await request.json();
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // 检查是否是评论所有者或 admin
    const [rows] = await pool.query("SELECT user_id FROM comments WHERE id = ?", [id]) as any[];
    if (rows.length === 0) return NextResponse.json({ error: "评论不存在" }, { status: 404 });
    if (rows[0].user_id !== userId && userRole !== "admin") {
      return NextResponse.json({ error: "无权修改" }, { status: 403 });
    }

    await pool.query("UPDATE comments SET content = ? WHERE id = ?", [content.trim(), id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Comment PUT error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  try {
    const { id } = await params;
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    const [rows] = await pool.query("SELECT user_id FROM comments WHERE id = ?", [id]) as any[];
    if (rows.length === 0) return NextResponse.json({ error: "评论不存在" }, { status: 404 });
    if (rows[0].user_id !== userId && userRole !== "admin") {
      return NextResponse.json({ error: "无权删除" }, { status: 403 });
    }

    await pool.query("DELETE FROM comments WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Comment DELETE error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
