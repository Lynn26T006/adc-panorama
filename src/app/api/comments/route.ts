import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL!,
  connectionLimit: 5,
});

// GET: 获取当前用户的评论历史（?mine=true）
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  try {
    const mine = request.nextUrl.searchParams.get("mine");
    const userId = (session.user as any).id;

    if (mine === "true") {
      const [rows] = await pool.query(
        `SELECT c.id, c.drug_id, c.content, c.created_at,
                d.brand_name, d.antibody
         FROM comments c
         LEFT JOIN drugs d ON c.drug_id = d.id
         WHERE c.user_id = ?
         ORDER BY c.created_at DESC
         LIMIT 100`,
        [userId]
      );
      return NextResponse.json({ comments: rows });
    }

    return NextResponse.json({ comments: [] });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { drugId, content, parentId } = await request.json();
    if (!drugId || !content?.trim()) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    // 获取数字 drugId
    let drugIdNum = parseInt(String(drugId));
    if (isNaN(drugIdNum)) {
      const [rows] = await pool.query("SELECT id FROM drugs WHERE adcdb_id = ? LIMIT 1", [drugId]) as any[];
      if (rows.length === 0) return NextResponse.json({ error: "药物不存在" }, { status: 404 });
      drugIdNum = rows[0].id;
    }

    const [result] = await pool.query(
      "INSERT INTO comments (user_id, drug_id, parent_id, content) VALUES (?, ?, ?, ?)",
      [userId, drugIdNum, parentId || null, content.trim()]
    );

    // 如果是回复，给原评论者发通知
    if (parentId) {
      const [parentRows] = await pool.query(
        "SELECT user_id FROM comments WHERE id = ?", [parentId]
      ) as any[];
      if (parentRows.length > 0 && parentRows[0].user_id !== userId) {
        await pool.query(
          "INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, 'comment_reply', '有人回复了你的评论', ?, ?)",
          [parentRows[0].user_id, content.trim().substring(0, 100), `/products/${drugId}`]
        );
      }
    }

    return NextResponse.json({ success: true, id: (result as any).insertId }, { status: 201 });
  } catch (error) {
    console.error("Comment POST error:", error);
    return NextResponse.json({ error: "评论失败" }, { status: 500 });
  }
}
