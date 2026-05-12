import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL!,
  connectionLimit: 5,
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ drugId: string }> }
) {
  try {
    const { drugId } = await params;
    const drugIdNum = parseInt(drugId);

    // 查询评论并 JOIN 用户信息
    const [rows] = await pool.query(
      `SELECT c.id, c.user_id, c.drug_id, c.parent_id, c.content, c.created_at, c.updated_at,
              u.display_name, u.avatar_url
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.drug_id = ?
       ORDER BY c.created_at ASC`,
      [isNaN(drugIdNum) ? drugId : drugIdNum]
    );

    // 如果按名字查不到，尝试按数字ID
    let finalRows = rows;
    if (Array.isArray(rows) && rows.length === 0 && isNaN(drugIdNum)) {
      // Try by adcdb_id
      const [drugRows] = await pool.query("SELECT id FROM drugs WHERE adcdb_id = ? LIMIT 1", [drugId]) as any[];
      if (drugRows.length > 0) {
        const [rows2] = await pool.query(
          `SELECT c.id, c.user_id, c.drug_id, c.parent_id, c.content, c.created_at, c.updated_at,
                  u.display_name, u.avatar_url
           FROM comments c
           LEFT JOIN users u ON c.user_id = u.id
           WHERE c.drug_id = ?
           ORDER BY c.created_at ASC`,
          [drugRows[0].id]
        );
        finalRows = rows2;
      }
    }

    return NextResponse.json({ comments: finalRows });
  } catch (error) {
    console.error("Comments GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
